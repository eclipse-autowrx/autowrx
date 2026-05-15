#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { spawn } = require("child_process");

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (!key.startsWith("--")) continue;
    const value = argv[i + 1];
    out[key.slice(2)] = value;
    i += 1;
  }
  return out;
}

function parsePrimitive(value) {
  const text = String(value || "").trim();
  if (text === "true") return true;
  if (text === "false") return false;
  if (text === "null" || text === "nil" || text === "none") return null;
  if (/^-?\d+$/.test(text)) return Number.parseInt(text, 10);
  if (/^-?\d+\.\d+$/.test(text)) return Number.parseFloat(text);
  return text;
}

function collectWatchNamesFromCppSource(cwd) {
  const out = [];
  const candidatePaths = [
    path.join(cwd || process.cwd(), "main.cpp"),
    path.join(cwd || process.cwd(), "src", "main.cpp"),
  ];

  for (const sourcePath of candidatePaths) {
    try {
      const content = fs.readFileSync(sourcePath, "utf8");
      // Match declarations that might be indented (e.g., inside functions)
      const re =
        /^\s*(?:int|double|float|bool|std::string)\s+([A-Za-z_]\w*)\s*(?:=|;)/gm;
      let m = re.exec(content);
      while (m) {
        const name = String(m[1] || "").trim();
        if (name && !out.includes(name)) out.push(name);
        m = re.exec(content);
      }
    } catch {
      // ignore source parse failures
    }
  }
  return out;
}

function toGdbValue(value) {
  if (value === true) return "1";
  if (value === false) return "0";
  if (value === null || value === undefined) return "0";
  if (typeof value === "number") return String(value);
  return JSON.stringify(String(value));
}

function parseFrame(doneLine) {
  const fileMatch =
    doneLine.match(/fullname="([^"]+)"/) || doneLine.match(/file="([^"]+)"/);
  const lineMatch = doneLine.match(/line="(\d+)"/);
  const fnMatch = doneLine.match(/func="([^"]+)"/);
  return {
    file: fileMatch ? fileMatch[1] : "",
    line: lineMatch ? Number.parseInt(lineMatch[1], 10) : 0,
    function: fnMatch ? fnMatch[1] : "",
  };
}


function isCppProjectSourcePath(filePath, cwd) {
  if (!filePath) return false;
  const p = path.resolve(String(filePath));
  const projectRoot = path.resolve(cwd || process.cwd());

  // Ignore system headers and libraries
  if (p.startsWith("/lib/")) return false;
  if (p.startsWith("/usr/")) return false;
  if (p.startsWith("/opt/")) return false;

  // If it's inside our current working directory, it's likely a project file
  if (p.startsWith(projectRoot)) return true;

  if (p.includes("/src/")) return true;
  if (
    p.endsWith(".cpp") ||
    p.endsWith(".hpp") ||
    p.endsWith(".c") ||
    p.endsWith(".h")
  )
    return true;

  return false;
}

function parseFirstCppFrameLevel(doneLine, cwd) {
  const frameTupleRe = /frame=\{([^{}]*)\}/g;
  let tuple = frameTupleRe.exec(doneLine);

  while (tuple) {
    const block = tuple[1];
    const levelMatch = block.match(/level="(\d+)"/);
    if (!levelMatch) {
      tuple = frameTupleRe.exec(doneLine);
      continue;
    }
    const level = Number.parseInt(levelMatch[1], 10);
    const fullMatch =
      block.match(/fullname="([^"]+)"/) || block.match(/file="([^"]+)"/);
    const file = fullMatch ? fullMatch[1] : "";
    if (isCppProjectSourcePath(file, cwd)) return level;
    tuple = frameTupleRe.exec(doneLine);
  }

  const m = doneLine.match(/level="(\d+)"/);
  return m ? Number.parseInt(m[1], 10) : 0;
}

function parseDoneValue(doneLine) {
  const m = String(doneLine || "").match(/value="((?:[^"\\]|\\.)*)"/);
  if (!m) return undefined;
  return parsePrimitive(m[1].replace(/\\"/g, '"'));
}

function isSpam(text) {
  if (!text) return true;
  const t = text.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (t.includes("programreceivedsignal")) return true;
  if (t.includes("sigint")) return true;
  if (t.includes("signalstop")) return true;
  if (t.includes("libcso")) return true;
  if (t.includes("threaddebuggingusing")) return true;
  if (t.includes("usinghostlibthreaddb")) return true;
  if (t.includes("x8664linuxgnu")) return true;
  if (t.includes("newthread0x")) return true;
  if (t.includes("rttisymbolnotfound")) return true;

  return false;
}

class GdbWrapper {
  constructor({ programPath, varsPipePath, controlPipePath, cwd }) {
    this.programPath = path.resolve(programPath);
    this.varsPipePath = path.resolve(varsPipePath);
    this.controlPipePath = path.resolve(controlPipePath);
    this.cwd = cwd || process.cwd();
    this.token = 1;
    this.pending = new Map();
    this.controlQueue = [];
    this.stream = fs.createWriteStream(this.varsPipePath, {
      flags: "a",
      encoding: "utf8",
    });

    this.running = false;
    this.stopped = false;
    this.waitingInterrupt = false;
    this.tickTimer = null;

    this.watchNames = collectWatchNamesFromCppSource(this.cwd);

    this.miStreamBuffer = "";
  }

  start() {
    this.startControlReader();
    this.gdb = spawn("gdb", ["--interpreter=mi2", "--quiet", "--nx"], {
      cwd: this.cwd,
      stdio: ["pipe", "pipe", "pipe"],
    });

    const stdoutRl = readline.createInterface({ input: this.gdb.stdout });
    stdoutRl.on("line", (line) => this.onGdbLine(String(line || "").trim()));
    this.gdb.stderr.on("data", () => {});

    this.gdb.on("exit", () => {
      this.cleanup();
      process.exit(0);
    });

    this.bootstrap().catch(() => {
      this.cleanup();
      process.exit(1);
    });
  }

  startControlReader() {
    const reopen = () => {
      const controlStream = fs.createReadStream(this.controlPipePath, {
        encoding: "utf8",
      });
      const rl = readline.createInterface({ input: controlStream });
      rl.on("line", (line) => {
        const text = String(line || "").trim();
        if (!text) return;
        try {
          const payload = JSON.parse(text);
          if (payload && payload.type === "set_value" && payload.name) {
            this.controlQueue.push(payload);
          }
        } catch {
          // ignore
        }
      });
      rl.on("close", () => setTimeout(reopen, 10));
      rl.on("error", () => setTimeout(reopen, 200));
    };
    reopen();
  }

  send(cmd) {
    const token = this.token++;
    const full = `${token}${cmd}\n`;
    return new Promise((resolve, reject) => {
      this.pending.set(String(token), { resolve, reject });
      this.gdb.stdin.write(full);
    });
  }

  onGdbLine(line) {
    if (!line) return;

    const miMatch = line.match(/^[~@&]"((?:[^"\\]|\\.)*)"$/);
    if (miMatch) {
      const decodedChunk = miMatch[1]
        .replace(/\\n/g, "\n")
        .replace(/\\t/g, "\t")
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, "\\");

      this.miStreamBuffer += decodedChunk;

      let nlIdx;
      while ((nlIdx = this.miStreamBuffer.indexOf("\n")) !== -1) {
        const completeLine = this.miStreamBuffer.slice(0, nlIdx);
        this.miStreamBuffer = this.miStreamBuffer.slice(nlIdx + 1);

        if (!isSpam(completeLine) && completeLine.trim() !== "") {
          process.stdout.write(completeLine + "\n");
        }
      }
      return;
    }

    const match = line.match(/^(\d+)\^(.*)$/);
    if (match) {
      const [, token, payload] = match;
      const pending = this.pending.get(token);
      if (!pending) return;
      this.pending.delete(token);
      if (payload.startsWith("error")) pending.reject(new Error(payload));
      else pending.resolve(`^${payload}`);
      return;
    }

    if (line.startsWith("*stopped")) {
      this.running = false;
      this.stopped = true;
      if (
        line.includes('reason="exited-normally"') ||
        line.includes('reason="exited-signalled"')
      ) {
        this.cleanup();
        process.exit(0);
      }
      this.onStopped().catch(() => {
        this.cleanup();
        process.exit(1);
      });
      return;
    }

    if (line.startsWith("*running")) {
      this.running = true;
      this.stopped = false;
      return;
    }

    if (!line.match(/^[~@&^*=+]/) && !line.startsWith("(gdb)")) {
      if (isSpam(line)) return;
      if (line.trim() === "") return;
      process.stdout.write(line + "\n");
    }
  }

  async bootstrap() {
    await this.send("-gdb-set pagination off");
    await this.send("-gdb-set confirm off");
    await this.send("-gdb-set mi-async on");
    await this.send("-gdb-set disable-randomization off");
    await this.send("-gdb-set print thread-events off");
    await this.send(`-file-exec-and-symbols "${this.programPath}"`);
    await this.send("-exec-run");
    this.running = true;

    this.tickTimer = setInterval(async () => {
      if (!this.running || this.stopped || this.waitingInterrupt) return;
      this.waitingInterrupt = true;
      try {
        await this.send("-exec-interrupt");
      } catch {
        // ignore
      } finally {
        this.waitingInterrupt = false;
      }
    }, 1000);
  }

  async onStopped() {
    try {
      await this.send("-thread-select 1");
    } catch {
      // ignore
    }

    try {
      const framesResp = await this.send("-stack-list-frames");
      const level = parseFirstCppFrameLevel(framesResp, this.cwd);
      await this.send(`-stack-select-frame ${level}`);
    } catch {
      // ignore
    }

    let frameResp = await this.send("-stack-info-frame");
    const frame = parseFrame(frameResp);

    const vars = {};

    // For C++, we now strictly only watch top-level variables found in source
    if (this.watchNames.length > 0) {
      for (const name of this.watchNames) {
        try {
          const valueResp = await this.send(
            `-data-evaluate-expression ${name}`,
          );
          const value = parseDoneValue(valueResp);
          if (value !== undefined) vars[name] = value;
        } catch {
          // ignore
        }
      }
    }

    while (this.controlQueue.length > 0) {
      const cmd = this.controlQueue.shift();
      const name = String(cmd.name || "").trim();
      if (!name) continue;
      const valueExpr = toGdbValue(cmd.value);
      try {
        await this.send(`-gdb-set var ${name}=${valueExpr}`);
        vars[name] = cmd.value;
      } catch {
        // ignore invalid writes
      }
    }

    const payload = {
      type: "vars.snapshot",
      vars,
      frame,
    };
    this.stream.write(`${JSON.stringify(payload)}\n`);

    await this.send("-exec-continue");
    this.running = true;
    this.stopped = false;
  }

  cleanup() {
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
    try {
      this.stream.end();
    } catch {
      // ignore
    }
    try {
      this.gdb?.kill("SIGTERM");
    } catch {
      // ignore
    }
  }
}

const args = parseArgs(process.argv.slice(2));
const programPath = String(args.program || "").trim();
const varsPipePath = String(args["vars-pipe"] || "").trim();
const controlPipePath = String(args["control-pipe"] || "").trim();
if (!programPath || !varsPipePath || !controlPipePath) {
  process.stderr.write(
    "usage: autowrx_cpp_gdb_wrapper.js --program <path> --vars-pipe <path> --control-pipe <path>\n",
  );
  process.exit(2);
}

const wrapper = new GdbWrapper({
  programPath,
  varsPipePath,
  controlPipePath,
  cwd: process.cwd(),
});
wrapper.start();
