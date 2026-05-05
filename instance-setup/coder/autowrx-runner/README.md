# AutoWRX Runner

VS Code / code-server extension for Coder workspaces: runs commands from the AutoWRX web app inside a dedicated terminal (**AutoWRX Console**).

## Behavior

- Connects to backend WebSocket channel (`/v2/system/coder/runner/ws`) and listens for run commands.
- Executes commands inside the workspace through the extension process (not from backend spawn), then streams `stdout/stderr` back over WebSocket.
- Supports `run.stdin` messages for interactive programs (`input()` etc.).
- Command **`autowrx-runner.triggerFromWeb`** remains available for local/manual smoke tests.

## Required Environment Variables

- `CODER_WORKSPACE_ID`: Workspace ID to bind this extension runner session.
- `AUTOWRX_RUNNER_WS_URL` (optional): WebSocket base URL for backend (default `ws://127.0.0.1:3200/v2/system/coder/runner/ws`).
- `AUTOWRX_RUNNER_KEY` (optional): Shared key if backend enforces runner authentication.

In the provided Coder template (`instance-setup/coder/docker-template.tf`), `CODER_WORKSPACE_ID` and `AUTOWRX_RUNNER_WS_URL` are injected into the workspace container environment automatically.

## Build

From this folder:

```bash
yarn vsix
```

Produces a `.vsix` for installing into the workspace image (see `instance-setup/coder/start.sh`).
