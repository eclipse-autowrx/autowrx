let apiMap = new Map();

const getApiValue = (apiName) => {
  if (!apiName) return null;
  // console.log(`on get apiName ${apiName}`)
  return apiMap.get(apiName);
};

const setApiValue = (apiName, value) => {
  notifyParentApiChange(apiName, value);
};

const notifyParentApiChange = (apiName, value) => {
  if (!parent) return;
  parent.postMessage(
    JSON.stringify({
      cmd: "set-api-value",
      api: apiName,
      value: value,
    }),
    "*"
  );
};

const initHandle = () => {
  let listenForApis = [];
  let VSSs = document.querySelectorAll('[vss="true"]');
  VSSs.forEach((vss) => {
    let apiName = vss.getAttribute("vss-name");
    let actionFullStr = vss.getAttribute("action");

    if (apiName) {
      let matchApi = apiMap.get(apiName);
      if (!matchApi) {
        matchApi = {
          value: 0,
          lastSetValue: 0,
          listeners: [],
        };
        apiMap.set(apiName, matchApi);
      }

      if (!actionFullStr) {
        listenForApis.push(apiName);
        matchApi.listeners.push(vss);
      } else {
        vss.addEventListener("click", () => {
          console.log(`[${apiName}] action ${actionFullStr} on clicked `)
          let arrActions = actionFullStr.split("::");
          let matchApi = apiMap.get(apiName);
          if (arrActions.length > 0 && matchApi) {
            let strValue = arrActions[1] || "0";
            let value = 0;
            if (strValue.toLowerCase() == "false") {
              value = false;
            } else if (strValue.toLowerCase() == "true") {
              value = true;
            } else {
              value = Number(strValue);
            }
            switch (arrActions[0]) {
              case "set":
                // console.log(`[${apiName}] set ${value}`)
                // matchApi.value = value
                // matchApi.lastSetValue = new Date().getTime()
                notifyParentApiChange(apiName, value);
                break;
              case "inc":
                break;
              case "dec":
                break;
              case "invert":
                break;
            }
          }
        });
      }
    }
    listenForApis = [...new Set(listenForApis)];
    console.log('listenForApis')
    console.log(listenForApis)

    if (parent && listenForApis && listenForApis.length > 0) {
      parent.postMessage(
        JSON.stringify({
          cmd: "listen-for-apis",
          apis: listenForApis,
        }),
        "*"
      );
    }
  });

  let interval = null;
  interval = setInterval(() => {
    apiMap.forEach((api, key) => {
      if (api.listeners) {
        api.listeners.forEach(listeners => listeners.innerText = api.value)
        api.listeners.forEach((listener) => {
          let displayValueStr = listener.getAttribute(
            "display_when_value_equal"
          );
          if (displayValueStr != null && displayValueStr != undefined) {
            if (
              String(api.value).toLowerCase() === displayValueStr.toLowerCase()
            ) {
              listener.style.display = "block";
            } else {
              listener.style.display = "none";
            }
            return;
          }
          if (isNaN(api.value)) {
            listener.innerText = api.value;
          } else {
            listener.innerText = Math.round(api.value * 1000) / 1000;
          }
        });
      }
    });
  }, 200);
  window.addEventListener("unload", () => {
    if (onWidgetUnloaded != undefined) {
      onWidgetUnloaded();
    }
    clearInterval(interval);
  });
};

let widgetOptions = null;
let widgetLoaded = false;

window.addEventListener("load", () => {
  console.log("syncer: on window loaded");
  widgetLoaded = true;
  
  // Try to get options from URL parameters first (for non-builtin widgets)
  try {
    let urlParams = new URLSearchParams(window.location.search);
    let urlOptions = JSON.parse(decodeURIComponent(urlParams.get("options")));
    if (urlOptions) {
      widgetOptions = urlOptions;
      // If we got options from URL, call onWidgetLoaded immediately
      if (onWidgetLoaded != undefined) {
        onWidgetLoaded(widgetOptions);
      }
    }
  } catch (e) {
    // No URL options, wait for postMessage
    console.log("No URL options, waiting for postMessage...");
  }

  setTimeout(() => {
    initHandle();
  }, 100);
});

const applyNewVssDataFromSyncer = (vssDataIncome) => {
  if (!vssDataIncome) return;
  // console.log("vssDataIncome", typeof(vssDataIncome) ,vssDataIncome)
  let vssMap = new Map(Object.entries(vssDataIncome));
  // console.log(vssMap)

  apiMap.forEach((api, key) => {
    let inComeValue = vssMap.get(key);
    if (inComeValue != undefined && inComeValue != null) {
      api.value = inComeValue;
    }
  });

  vssMap.forEach((incomeValue, key) => {
    if (!apiMap.get(key)) {
      apiMap.set(key, {
        value: incomeValue,
        lastSetValue: new Date(),
      });
    }
  });

  // console.log(apiMap)
};

window.addEventListener("message", function (e) {
  if (!e.data) return;
  // console.log(`onMessage`, e.data)
  let payload = JSON.parse(e.data);
  if (payload.cmd) {
    switch (payload.cmd) {
      case "widget-options":
        // Receive widget options from parent for built-in widgets
        if (payload.options && widgetLoaded && !widgetOptions) {
          widgetOptions = payload.options;
          console.log("Received widget options via postMessage:", widgetOptions);
          if (onWidgetLoaded != undefined) {
            onWidgetLoaded(widgetOptions);
          }
        }
        break;
      case "vss-tree":
        if (!payload.vssTree) return;
        window.VSS_TREE = payload.vssTree
        break;
      case "vss-sync":
        if (!payload.vssData) return;
        applyNewVssDataFromSyncer(payload.vssData);
        break;
      case "app-log":
        if (!payload.log) return;
        if (appendLog) {
          appendLog(payload.log)
        }
        break;
      default:
        break;
    }
  }
});
