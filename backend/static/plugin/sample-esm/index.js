// ESM-style plugin structured by files (no bundler required)
// Host must expose window.React and window.ReactDOM

import App from './components/App.js'

const ReactDOM = globalThis.ReactDOM

export const components = { App }

export function mount(el, props) {
  if (!el || !ReactDOM) return
  const root = ReactDOM.createRoot(el)
  root.render(App(props || {}))
  el.__aw_root = root
}

export function unmount(el) {
  if (el && el.__aw_root) {
    el.__aw_root.unmount()
    delete el.__aw_root
  }
}

// Also register to global namespace for backwards compatibility
globalThis.DAPlugins = globalThis.DAPlugins || {}
globalThis.DAPlugins['page-plugin'] = { components, mount, unmount }


