# AutoWRX Runner

VS Code / code-server extension for Coder workspaces: runs commands from the AutoWRX web app inside a dedicated terminal (**AutoWRX Console**).

## Behavior

- Watches **`.autowrx_run`** in the workspace. When the file is created or updated, its text is executed as a shell command in **AutoWRX Console**, then the file is cleared.
- Command **`autowrx-runner.triggerFromWeb`** (*Trigger from Website*) runs `python3 main.py` in that terminal.

## Build

From this folder:

```bash
yarn vsix
```

Produces a `.vsix` for installing into the workspace image (see `instance-setup/coder/start.sh`).
