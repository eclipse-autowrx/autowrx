const vscode = require('vscode');

const TERMINAL_NAME = 'AutoWRX Console';
const TRIGGER_GLOB = '**/.autowrx_run';

function activate(context) {
    console.log('AutoWRX runner extension is active');

    const disposableCmd = vscode.commands.registerCommand('autowrx-runner.triggerFromWeb', () => {
        runCommandInTerminal('python3 main.py');
    });

    const watcher = vscode.workspace.createFileSystemWatcher(TRIGGER_GLOB);
    let isProcessing = false;

    const handleCommandTrigger = async (uri) => {
        if (isProcessing) return;

        try {
            isProcessing = true;
            const fileData = await vscode.workspace.fs.readFile(uri);
            const command = new TextDecoder().decode(fileData).trim();

            if (command) {
                runCommandInTerminal(command);
                await vscode.workspace.fs.writeFile(uri, new Uint8Array(0));
            }
        } catch (error) {
            console.error('AutoWRX: failed to read trigger file:', error);
        } finally {
            setTimeout(() => {
                isProcessing = false;
            }, 300);
        }
    };

    watcher.onDidChange(handleCommandTrigger);
    watcher.onDidCreate(handleCommandTrigger);

    context.subscriptions.push(disposableCmd, watcher);
}

/**
 * @param {string} command
 */
function runCommandInTerminal(command) {
    try {
        let terminal = vscode.window.terminals.find((t) => t.name === TERMINAL_NAME);

        if (!terminal) {
            terminal = vscode.window.createTerminal({
                name: TERMINAL_NAME,
                cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || undefined,
            });
        }

        terminal.show();
        terminal.sendText(process.platform === 'win32' ? 'cls' : 'clear');
        terminal.sendText(command);
    } catch (error) {
        console.error(error);
        vscode.window.showErrorMessage('AutoWRX: failed to run command: ' + error.message);
    }
}

function deactivate() { }

module.exports = {
    activate,
    deactivate,
};
