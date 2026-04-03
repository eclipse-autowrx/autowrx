const vscode = require('vscode');

function activate(context) {
    console.log('AutoWRX Extension is now active!');

    // Register command
    let disposable = vscode.commands.registerCommand('autowrx-extension.triggerFromWeb', () => {
        runPythonMain();
    });

    // Handle URI from website
    let uriHandler = vscode.window.registerUriHandler({
        handleUri(uri) {
            console.log('Received URI from website:', uri.toString());

            const params = new URLSearchParams(uri.query);
            const action = params.get('action');

            if (action === 'runPython') {
                runPythonMain();
            }
        }
    });

    context.subscriptions.push(disposable, uriHandler);
}

/**
 * Run python3 main.py in terminal.
 * Reuses existing terminal if available, otherwise creates a new one.
 */
function runPythonMain() {
    try {
        const terminalName = "AutoWRX - Run Python";

        // Find existing terminal with the same name
        let terminal = vscode.window.terminals.find(t => t.name === terminalName);

        // Create new terminal if not found
        if (!terminal) {
            terminal = vscode.window.createTerminal({
                name: terminalName,
                cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || undefined
            });
            console.log('Created new terminal:', terminalName);
        } else {
            console.log('Reusing existing terminal:', terminalName);
        }

        // Show the terminal
        terminal.show();

        // Clear terminal before running
        if (process.platform === 'win32') {
            terminal.sendText('cls');
        } else {
            terminal.sendText('clear');
        }

        // Run the python command
        terminal.sendText('python3 main.py');

        vscode.window.showInformationMessage('Running: python3 main.py');

    } catch (error) {
        console.error(error);
        vscode.window.showErrorMessage('Failed to run python3 main.py: ' + error.message);
    }
}

function deactivate() { }

module.exports = {
    activate,
    deactivate
};