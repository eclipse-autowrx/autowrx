import dedent from "dedent";
import { NIL, v5 } from "uuid";
import { random } from "../reusable/functions";
import indentString from "indent-string";
import buildBrythonError from "../routes/components/CodeViewer/BrythonError";
import { OutputPart } from "../routes/components/CodeViewer/models";
import { removeCommentFromPythonCode } from "../utils/pythonCodeProcess";

interface BrythonRunnerOptions {
    brythonUrl: string;
    brythonLibraries?: string[];
}

class BrythonRunner {
    id: string;
    iframe: HTMLIFrameElement;
    codeScript: HTMLScriptElement;
    libraryLoaded: Promise<true>;

    constructor({ brythonUrl, brythonLibraries = [] }: BrythonRunnerOptions) {
        this.id = v5("IFRAME", NIL);
        const [iframe, codeScript] = BrythonRunner.createIframe(this.id);
        this.iframe = iframe;
        this.codeScript = codeScript;
        this.iframeWindow.document.body.appendChild(codeScript);
        (this.iframeWindow as any).console.log = (...content: any[]) => {
            if (typeof content[0] === "string" && content[0] === "no frame") {
                if (content[1].$py_error) {
                    console.log("-->", content);
                    this.outputLog.push(buildBrythonError(content[1]));
                }
            } else if (content.find((part) => typeof part !== "string")) {
            } else {
                console.log("-->", content);
                this.outputLog.push({
                    type: "string",
                    text: content.join(" "),
                });
            }
        };
        (this.iframeWindow as any).console.error = (...content: any[]) => {
            this.outputLog.push({
                type: "error",
                text: content.join(" "),
            });
        };
        (this.iframeWindow as any).finalize_execution = (id: string) => {
            console.log("finalize_execution");
            if (id in this.exec_hooks) {
                const oldOutputLog = JSON.parse(JSON.stringify(this.outputLog)) as OutputPart[];
                this.outputLog = [];
                this.exec_hooks[id].finalize(oldOutputLog);
            }
        };

        this.libraryLoaded = new Promise((resolve) => resolve(true));
        this.loadScript(brythonUrl).then(() => {
            console.log((window as any).__BRYTHON__);
            for (const scriptUrl of brythonLibraries) {
                this.loadScript(scriptUrl);
            }
        });
    }

    private outputLog: OutputPart[] = [];

    private exec_hooks: {
        [key: string]: {
            finalize: (s: OutputPart[]) => void;
        };
    } = {};

    private addExecutionHook(
        exec_id: string,
        callbacks: {
            finalize: (s: OutputPart[]) => void;
        }
    ) {
        this.exec_hooks[exec_id] = callbacks;
    }

    private static createIframe(id: string) {
        const iframe = document.createElement("iframe");
        iframe.id = id;
        iframe.style.display = "none";
        document.body.appendChild(iframe);

        const script = document.createElement("script");
        script.id = "code";
        script.type = "text/python3";

        return [iframe, script] as const;
    }

    public loadScript(scriptUrl: string) {
        const scriptEl = document.createElement("script");
        scriptEl.referrerPolicy = "origin";
        scriptEl.src = scriptUrl;
        const promise = new Promise<true>((resolve) => {
            scriptEl.onload = () => resolve(true);
        });
        this.libraryLoaded = Promise.all([this.libraryLoaded, promise]) as unknown as Promise<true>;
        const body = (this.iframe.contentWindow as Window).document.body;
        body.appendChild(scriptEl);
        return promise;
    }

    public setVSSSpec(spec: string, custom_apis: string) {
        (this.iframe.contentWindow as any).VSS_SPEC = spec;
        (this.iframe.contentWindow as any).VSS_CUSTOM_APIS = custom_apis;
    }

    get iframeWindow() {
        return this.iframe.contentWindow as Window & {
            brython: any;
            __BRYTHON__: any;
            eval: (x: string) => void;
        };
    }

    runCode(code: string): Promise<OutputPart[]> {
        return new Promise(async (resolve, reject) => {
            const executionId = random().replaceAll("-", "");

            const indentedCode = indentString(code, 4, {
                indent: "    ",
            });

            const varPostfix = `____${executionId}`;

            const wrappedCode = dedent(`
            from browser import aio as aio${varPostfix}, window as window${varPostfix}
            import traceback as traceback${varPostfix}
            id${varPostfix} = "${executionId}"
            async def m${varPostfix}():
                await aio${varPostfix}.sleep(0)
${indentedCode}
            
            async def r${varPostfix}():
                try:
                    await m${varPostfix}()
                except Exception as e:
                    window${varPostfix}.console.log(e)
                finally:
                    window${varPostfix}.finalize_execution(id${varPostfix})

            aio${varPostfix}.run(r${varPostfix}())
            `);

            console.log("libraryLoading");
            await this.libraryLoaded;
            console.log("libraryLoaded");

            this.addExecutionHook(executionId, {
                finalize: (s) => {
                    console.log("resolved");
                    resolve(s);
                },
            });
            this.codeScript.textContent = wrappedCode;
            try {
                // this.iframeWindow.brython({debug: 1})
                // console.log("wrappedCode")
                // console.log(wrappedCode)
                let pycode = removeCommentFromPythonCode(wrappedCode);
                // console.log("pycode")
                // console.log(pycode)
                let jsCode = this.iframeWindow.__BRYTHON__.python_to_js(pycode);
                // console.log("jsCode")
                // console.log(jsCode)
                try {
                    this.iframeWindow.eval(jsCode);
                } catch (err) {
                    console.log("jsCode error", err);
                }
                console.log("brython() running");
            } catch (error) {
                console.log("code finished erroring", error);
                this.outputLog.push(buildBrythonError(error));
                (this.iframeWindow as any).finalize_execution(executionId);
            }
        });
    }
}

export default BrythonRunner;
