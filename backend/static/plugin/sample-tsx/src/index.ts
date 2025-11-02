import * as ReactDOM from 'react-dom/client'
import * as React from 'react'
import Page from './components/Page'

export const components = { Page }

export function mount(el: HTMLElement, props?: any) {
  const root = ReactDOM.createRoot(el)
  root.render(React.createElement(Page as any, props || {}))
  ;(el as any).__aw_root = root
}

export function unmount(el: HTMLElement) {
  const r = (el as any).__aw_root
  if (r && r.unmount) r.unmount()
  delete (el as any).__aw_root
}

// Optional global registration
if (typeof window !== 'undefined') {
  ;(window as any).DAPlugins = (window as any).DAPlugins || {}
  ;(window as any).DAPlugins['page-plugin'] = { components, mount, unmount }
}


