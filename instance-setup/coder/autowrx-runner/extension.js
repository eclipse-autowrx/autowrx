const vscode = require('vscode');
const WebSocket = require('ws');

const TERMINAL_NAME = 'AutoWRX Console';
const RUNNER_RECONNECT_MS = 3000;
const SHELL_INTEGRATION_WAIT_MS = 150;
const SHELL_INTEGRATION_MAX_ATTEMPTS = 20;
const LOCAL_FALLBACK_RUNNER_WS_URL = 'ws://127.0.0.1:3200/v2/system/coder/runner/ws';

function activate(context) {
    console.log('AutoWRX runner extension is active');
    closeAllTerminalsForFreshSession();

    const runner = new RunnerBridge();
    runner.start();

    const disposableCmd = vscode.commands.registerCommand('autowrx-runner.triggerFromWeb', () => {
        runner.startRun('python-main', 'python3 -u main.py');
    });

    context.subscriptions.push(disposableCmd, {
        dispose: () => runner.dispose(),
    });
}

function closeAllTerminalsForFreshSession() {
    try {
        const terminals = vscode.window.terminals || [];
        terminals.forEach((terminal) => {
            try {
                terminal.dispose();
            } catch (error) {
                console.log(`[AutoWRX Runner] failed to close terminal: ${error?.message || error}`);
            }
        });
        if (terminals.length > 0) {
            console.log(`[AutoWRX Runner] closed ${terminals.length} existing terminal(s) for fresh session`);
        }
    } catch (error) {
        console.log(`[AutoWRX Runner] closeAllTerminalsForFreshSession failed: ${error?.message || error}`);
    }
}

class RunnerBridge {
    constructor() {
        this.ws = null;
        this.reconnectTimer = null;
        this.workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd();
        this.workspaceId = String(process.env.CODER_WORKSPACE_ID || '').trim();
        this.wsUrl = this.resolveWsUrl();
        this.runnerKey = String(process.env.AUTOWRX_RUNNER_KEY || '').trim();
        this.outputTerminal = null;
        this.activeExecution = null;
        this.disposables = [];
        this.setupTerminalHooks();
    }

    resolveWsUrl() {
        const explicit = String(process.env.AUTOWRX_RUNNER_WS_URL || '').trim();
        if (explicit) return explicit;
        // Fallback for local/dev scenarios.
        return LOCAL_FALLBACK_RUNNER_WS_URL;
    }

    ensureTerminal() {
        // Re-resolve every time to survive manual terminal closes.
        let terminal = vscode.window.terminals.find((t) => t.name === TERMINAL_NAME);
        if (!terminal) {
            terminal = vscode.window.createTerminal({
                name: TERMINAL_NAME,
                cwd: this.workspacePath,
            });
        }
        this.outputTerminal = terminal;
        return terminal;
    }

    start() {
        if (!this.workspaceId) {
            vscode.window.showWarningMessage('AutoWRX Runner: CODER_WORKSPACE_ID is missing; websocket bridge disabled.');
            return;
        }
        this.log(`[AutoWRX Runner] workspaceId=${this.workspaceId}`);
        this.log(`[AutoWRX Runner] wsUrl=${this.wsUrl}`);
        this.connect();
    }

    connect() {
        const params = new URLSearchParams({
            workspace_id: this.workspaceId,
        });
        if (this.runnerKey) {
            params.set('runner_key', this.runnerKey);
        }
        const url = `${this.wsUrl}?${params.toString()}`;
        this.log(`[AutoWRX Runner] connecting: ${url}`);
        this.ws = new WebSocket(url);
        this.ws.on('open', () => {
            this.log('[AutoWRX Runner] websocket connected');
            this.send({
                type: 'runner.hello',
                workspaceId: this.workspaceId,
                at: new Date().toISOString(),
            });
        });

        this.ws.on('message', (raw) => {
            try {
                const payload = JSON.parse(String(raw));
                this.handleMessage(payload);
            } catch (error) {
                this.log(`[AutoWRX Runner] invalid message: ${error?.message || error}`);
            }
        });

        this.ws.on('close', (code, reason) => {
            this.log(`[AutoWRX Runner] websocket closed code=${code} reason=${String(reason || '')}`);
            this.scheduleReconnect();
        });
        this.ws.on('error', (err) => {
            this.log(`[AutoWRX Runner] websocket error: ${err?.message || err}`);
            this.scheduleReconnect();
        });
    }

    scheduleReconnect() {
        if (this.reconnectTimer) return;
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
        }, RUNNER_RECONNECT_MS);
    }

    handleMessage(payload) {
        if (!payload || typeof payload !== 'object') return;
        switch (payload.type) {
            case 'run.start':
                void this.startRun(payload.runKind, payload.command);
                break;
            case 'run.stdin':
                this.writeStdin(payload.data);
                break;
            case 'run.stop':
                this.stopRun();
                break;
            default:
                break;
        }
    }

    async startRun(runKind, command) {
        if (!command || typeof command !== 'string') return;
        const terminal = this.ensureTerminal();
        terminal.show(true);
        this.send({
            type: 'run.started',
            runKind: runKind || null,
            command,
            at: new Date().toISOString(),
        });

        const integration = await this.waitForShellIntegration(terminal);
        if (integration && typeof integration.executeCommand === 'function') {
            try {
                const execution = integration.executeCommand(command);
                this.activeExecution = execution;
                this.captureExecutionOutput(execution);
                return;
            } catch (error) {
                this.send({
                    type: 'run.error',
                    message: `executeCommand failed: ${error?.message || error}`,
                    at: new Date().toISOString(),
                });
            }
        }

        this.send({
            type: 'run.error',
            message: 'shellIntegration unavailable; output stream may be incomplete for this run',
            at: new Date().toISOString(),
        });
        // Last-resort fallback when shell integration is unavailable.
        terminal.sendText(command, true);
    }

    async waitForShellIntegration(terminal) {
        for (let i = 0; i < SHELL_INTEGRATION_MAX_ATTEMPTS; i += 1) {
            if (terminal !== this.outputTerminal) return null;
            const integration = terminal.shellIntegration;
            if (integration && typeof integration.executeCommand === 'function') {
                return integration;
            }
            await new Promise((resolve) => setTimeout(resolve, SHELL_INTEGRATION_WAIT_MS));
        }
        return null;
    }

    writeStdin(data) {
        const line = typeof data === 'string' ? data : String(data ?? '');
        const terminal = this.ensureTerminal();
        terminal.show(true);
        terminal.sendText(line, true);
    }

    stopRun() {
        const terminal = this.ensureTerminal();
        terminal.show(true);
        // Send Ctrl+C into the active terminal.
        terminal.sendText('\u0003', false);
    }

    setupTerminalHooks() {
        const closed = vscode.window.onDidCloseTerminal((terminal) => {
            if (terminal !== this.outputTerminal) return;
            this.log('[AutoWRX Runner] terminal closed by user');
            this.send({
                type: 'run.exit',
                code: null,
                signal: 'terminal_closed',
                at: new Date().toISOString(),
            });
            this.outputTerminal = null;
            this.activeExecution = null;
        });

        const started = vscode.window.onDidStartTerminalShellExecution((event) => {
            if (!this.outputTerminal || event.terminal !== this.outputTerminal) return;
            this.activeExecution = event.execution;
        });

        const ended = vscode.window.onDidEndTerminalShellExecution((event) => {
            if (!this.outputTerminal || event.terminal !== this.outputTerminal) return;
            if (this.activeExecution && event.execution !== this.activeExecution) return;
            this.send({
                type: 'run.exit',
                code: event.exitCode ?? null,
                signal: null,
                at: new Date().toISOString(),
            });
            this.activeExecution = null;
        });

        this.disposables.push(closed, started, ended);
    }

    async captureExecutionOutput(execution) {
        if (!execution || typeof execution.read !== 'function') return;
        try {
            for await (const chunk of execution.read()) {
                const text = typeof chunk === 'string' ? chunk : String(chunk ?? '');
                if (!text) continue;
                this.send({
                    type: 'run.output',
                    stream: 'stdout',
                    data: text,
                    at: new Date().toISOString(),
                });
            }
        } catch (error) {
            this.send({
                type: 'run.error',
                message: `read() failed: ${error?.message || error}`,
                at: new Date().toISOString(),
            });
        }
    }

    send(payload) {
        try {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify(payload));
            }
        } catch {
            // ignore
        }
    }

    dispose() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        if (this.ws) {
            try {
                this.ws.close();
            } catch {
                // ignore
            }
            this.ws = null;
        }
        this.stopRun();
        this.disposables.forEach((d) => d.dispose());
        this.disposables = [];
    }

    log(message) {
        console.log(message);
    }
}

function deactivate() { }

module.exports = {
    activate,
    deactivate,
};
