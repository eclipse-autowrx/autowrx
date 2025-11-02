(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // src/index.ts
  var ReactDOM = __toESM(__require("react-dom/client"), 1);
  var React2 = __toESM(__require("react"), 1);

  // src/components/Page.tsx
  var import_jsx_runtime = __require("react/jsx-runtime");
  var React = globalThis.React;
  function Page({ data, config }) {
    const [localCount, setLocalCount] = React.useState(data?.count || 0);
    const [currentTime, setCurrentTime] = React.useState((/* @__PURE__ */ new Date()).toLocaleString());
    React.useEffect(() => {
      const intervalId = setInterval(() => {
        setLocalCount((prevCount) => prevCount + 1);
        setCurrentTime((/* @__PURE__ */ new Date()).toLocaleString());
      }, 1e3);
      return () => {
        clearInterval(intervalId);
      };
    }, []);
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "min-h-screen w-full flex items-center justify-center bg-slate-500 text-black", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "text-center space-y-4", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "text-2xl font-bold", children: [
        "Local Count: ",
        localCount
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "text-lg", children: [
        "Current Time: ",
        currentTime
      ] })
    ] }) });
  }

  // src/index.ts
  var components = { Page };
  function mount(el, props) {
    const root = ReactDOM.createRoot(el);
    root.render(React2.createElement(Page, props || {}));
    el.__aw_root = root;
  }
  function unmount(el) {
    const r = el.__aw_root;
    if (r && r.unmount) r.unmount();
    delete el.__aw_root;
  }
  if (typeof window !== "undefined") {
    ;
    window.DAPlugins = window.DAPlugins || {};
    window.DAPlugins["page-plugin"] = { components, mount, unmount };
  }
})();
//# sourceMappingURL=index.js.map
