# Kit message hooks

A per-deployment hook for the `messageToKit` socket messages the frontend sends to the runtime / kit server. It works the same way as `sync-handlers/default.handler.js`: autowrx ships a no-op, and each deployment replaces the file.

- `default.hook.js` is the hook in use. The shipped version sends every message unchanged. Replace it per deployment, by editing it in your image or mounting it as a volume.
- `default.hook.example.js` is a starting point showing how to rename a command, add fields, and send one message as several.

The backend serves the file at `/kit-hooks/hook.js`. `frontend/index.html` loads it before the app starts. It runs in the browser, so write plain JavaScript without `require`/`import`.

## Contract

```js
window.autowrxKitHook = {
  name: 'my-deployment',
  // Return the messages to send instead of `payload`, in order.
  transform(payload, ctx) {
    return [payload]
  },
}
```

- `payload` is a copy of the message (`{ cmd, to_kit_id, ... }`).
- `ctx` has the shape `{ source, prototypeId, userId, userName }`. `source` is one of:
  - `connector`: the runtime panel, Deploy, and Manage Hardware Kit.
  - `plugin-helper`: the VSS and signal-mapping helpers offered to plugins.
- The hook applies only to `messageToKit` emits from host sockets. Other events (`register_client`, `list-all-kits`, ...) and plugins that open their own sockets are not affected.
- The original message is sent unchanged in any of these cases, with one console warning:
  - the hook is missing;
  - it throws;
  - it returns anything other than a non-empty array of objects.

A broken hook can reshape messages wrongly, but it can never drop them.

After replacing the file, reload the browser; the response is served with `Cache-Control: no-cache`.
