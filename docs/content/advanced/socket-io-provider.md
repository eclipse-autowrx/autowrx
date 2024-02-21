---
title: "Socket.IO Integration"
date: 2023-08-03T06:48:16+07:00
draft: false
weight: 6
---


Connect digital.auto playground to third party system via socket.io

There is many ways to connect to digital.auto from 3rd systems/apps such as HTTP API, SOAP, etc., however those methods are just one-way request.
To support you fetch continuous data, 2-ways communication, we build up some socker.io servers below:
- EU: `https://bridge.digitalauto.tech`
- Asia: `https://bridge.digitalauto.asia`

(our server run socket.io version 4.x, no auth require)

For more infomation, visit there site: https://socket.io/

![socketio-overview](https://bestudio.digitalauto.tech/project/mgthm9sd3MDU/socketio-overview.png)

## How communication work

![socket-io-flow](https://bestudio.digitalauto.tech/project/mgthm9sd3MDU/socket-io-flow.png)

## Let's get started

### 1. Create new plugin, and add below code
- Step 01: Create an empty plugin
```js
const loadScript = (boxWindow, url) => {
    return new Promise(async (resolve, reject) => {
        try {
            const script = boxWindow.document.createElement("script");
            script.defer = true;
            script.referrerPolicy = "origin"

            script.src = url;
            boxWindow.document.head.appendChild(script);
            script.addEventListener("load", () => resolve(undefined));
        } catch (e) {
            reject();
        }
    });
}

const PROVIDER_ID = "PYTHON-CLIENT-SAMPLE"

const plugin = ({widgets, simulator, vehicle}) => {
  widgets.register("Client", async (box) => {
  })
  return {}
}
```
  
- Step 02: Load the socket.IO client
```js
  await loadScript(box.window, `https://cdn.socket.io/4.6.0/socket.io.min.js`)
```

- Step 03: connect to socket IO server, and register to the provider you want to communicate
```js
  const socket = box.window.io("https://bridge.digitalauto.tech");
  const onConnected = () => {
      console.log("Io connected")
      socket.emit("register_client", {
          master_provider_id: PROVIDER_ID
      })
  }

  socket.on("connect", onConnected);
```

From now on, when provider sends some data, you can get it. Now we define function to handle message from provider.

- Step 04: Handle incoming data from provider
```js
  const messageFromProvider = (payload) => {
      if(payload.cmd == 'showSpeed') {
          lblSpeed.innerText = payload.data
      }
  }
  socket.on('message_from_provider', messageFromProvider)
```

On provider side, when provider calls socket.emit("send_to_all_clients", payload) then the function `messageFromProvider` will be called with the `payload` data

- Step 05: Send a request to Provider
```js
  socket.emit("request_provider", {
      to_provider_id: PROVIDER_ID,
      cmd: "Start",  // cmd send to provider
      data: 1        // data for the cmd, data may be number, string, object or null depend on cmd
  })
  // now server will handle that cmd and reply to you (only reply to the requester, not other clients)
  // we add a function to handle data reply from provider
  const messageFromProvider = (payload) => {
      if(payload.cmd == 'showSpeed') {
          lblSpeed.innerText = payload.data
      }
  }
  socket.on('provider_reply', onProviderReply)
```

You have the free to define cmd set and data. On your provider code, handle commands and reply to client.

Full sample plugin code available here: https://media.digitalauto.tech/data/files/668377ef-41a9-4b36-af80-2ef4e4fc6666TestIO.js

### 2. Create a provider to answer to client request
- Sample python PROVIDER here https://github.com/nhan-orgs/python_provider
- Sample javascript PROVIDER here https://github.com/nhan-orgs/javascript_provider
- For other languages, please visit Socket.IO client document for sample code.

### 3. Build a prototype to test the above code
We have sample prototype at this link: https://digitalauto.netlify.app/model/1jNrd7yS32ZzFo3WXrJy/library/prototype/3qgZS366ARQaCkPEBtuk/view/run

Dashboard config:
```json
[
    {
        "boxes": [1,2],
        "plugin": "SocketIO",
        "widget": "Client"
    }
]
```
