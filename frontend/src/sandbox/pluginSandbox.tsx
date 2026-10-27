// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

/**
 * Sandbox runtime for untrusted plugins. This document runs in an iframe with
 * an opaque origin (sandbox="allow-scripts ..." without allow-same-origin) and
 * talks to the host app exclusively via postMessage. The host delivers this
 * page via iframe srcdoc and the plugin code in aw-plugin:init (pluginSource),
 * so the sandbox issues no requests of its own (an opaque-origin frame carries
 * no cookies, which auth gateways in front of the app reject):
 * - host -> sandbox: aw-plugin:init / aw-plugin:props / aw-plugin:runtime /
 *   aw-plugin:rpc-result / aw-plugin:event
 * - sandbox -> host: aw-plugin:ready / aw-plugin:error / aw-plugin:rpc /
 *   aw-plugin:subscribe / aw-plugin:unsubscribe
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import '../index.css'
import '../functional.css'
import {
  ensurePluginShims,
  loadPluginRegistration,
  GLOBAL_KEY,
} from '@/lib/pluginHost'
import type { PluginAPI, PluginRuntimeState } from '@/types/plugin.types'

const AW_PREFIX = 'aw-plugin:'

/** Methods served synchronously from the latest runtime snapshot pushed by the host */
const SYNC_METHODS = new Set<string>(['getRuntimeState', 'getRuntimeApiValues'])
/** Void methods posted fire-and-forget (still via RPC, but not awaited) */
const FIRE_AND_FORGET_METHODS = new Set<string>([
  'setActiveTab',
  'notifyTab',
  'setRuntimeState',
  'setRuntimeApiValues',
  'notifyWidgets',
  'reportPrototypeRun',
  'remountWidgets',
])

interface SandboxProps {
  data?: any
  editable?: boolean
  config?: any
}

const postToParent = (message: any) => {
  try {
    window.parent.postMessage(message, '*')
  } catch (e: any) {
    if (e?.name === 'DataCloneError') {
      window.parent.postMessage(JSON.parse(JSON.stringify(message)), '*')
    } else {
      throw e
    }
  }
}

let rpcSeq = 0
const pendingRpc = new Map<
  number,
  { resolve: (v: any) => void; reject: (e: any) => void }
>()

const callRpc = (method: string, args: any[]): Promise<any> =>
  new Promise((resolve, reject) => {
    const id = ++rpcSeq
    pendingRpc.set(id, { resolve, reject })
    postToParent({ type: `${AW_PREFIX}rpc`, id, method, args })
  })

let subSeq = 0
const subscriptions = new Map<number, (payload: any) => void>()

let runtimeState: PluginRuntimeState | undefined
let runtimeValues: Record<string, any> | undefined

const createProxiedApi = (methods: string[]): PluginAPI => {
  const api: any = {}
  for (const name of methods) {
    if (SYNC_METHODS.has(name)) {
      api[name] = () =>
        name === 'getRuntimeState' ? runtimeState : runtimeValues
    } else if (FIRE_AND_FORGET_METHODS.has(name)) {
      api[name] = (...args: any[]) => {
        callRpc(name, args).catch(() => {})
      }
    } else if (name === 'onWidgetSignalWrite') {
      api[name] = (callback: (values: Record<string, any>) => void) => {
        const subId = ++subSeq
        subscriptions.set(subId, callback)
        postToParent({
          type: `${AW_PREFIX}subscribe`,
          subId,
          method: 'onWidgetSignalWrite',
        })
        return () => {
          subscriptions.delete(subId)
          postToParent({ type: `${AW_PREFIX}unsubscribe`, subId })
        }
      }
    } else {
      api[name] = async (...args: any[]) => callRpc(name, args)
    }
  }
  return api
}

let root: ReactDOM.Root | null = null
let pluginComponent: React.ComponentType<any> | null = null
let proxiedApi: PluginAPI | null = null
let currentProps: SandboxProps | null = null
let initialized = false

const createMountWrapper = (registration: any): React.FC<SandboxProps> => {
  const Wrapper: React.FC<SandboxProps> = (props) => {
    const ref = React.useRef<HTMLDivElement | null>(null)
    React.useEffect(() => {
      const el = ref.current
      if (el) {
        try {
          registration.mount(el, props)
        } catch (e) {
          console.error('[plugin-sandbox] mount error', e)
        }
      }
      return () => {
        try {
          registration.unmount?.(el)
        } catch (e) {
          console.error('[plugin-sandbox] unmount error', e)
        }
      }
    }, [props])
    return <div ref={ref} className="w-full h-full" />
  }
  return Wrapper
}

const rerender = () => {
  if (!root || !pluginComponent || !proxiedApi) return
  const props = (currentProps ?? {}) as SandboxProps
  const Component = pluginComponent
  root.render(
    <Component
      data={props.data}
      editable={props.editable}
      config={props.config}
      api={proxiedApi}
    />,
  )
}

const handleInit = async (msg: any) => {
  if (initialized) return
  initialized = true
  try {
    currentProps = {
      data: msg.props?.data,
      editable: msg.props?.editable,
      config: msg.props?.config,
    }
    runtimeState = msg.runtime?.state
    runtimeValues = msg.runtime?.values
    proxiedApi = createProxiedApi(Array.isArray(msg.methods) ? msg.methods : [])

    // Install the same shims the trusted path uses, then load the plugin script
    await ensurePluginShims()
    const { registration } = await loadPluginRegistration({
      scriptNonce: document.querySelector<HTMLMetaElement>(
        'meta[name="csp-nonce"]',
      )?.content,
      pluginId: msg.pluginUrl,
      pluginUrl: msg.pluginUrl,
      // Source fetched by the host (the sandbox itself has no cookies/network
      // access to the app); absent -> load pluginUrl via <script src>.
      pluginSource:
        typeof msg.pluginSource === 'string' ? msg.pluginSource : undefined,
    })

    const component = registration?.components?.Page || null
    if (component) {
      pluginComponent = component
    } else if (registration?.mount) {
      pluginComponent = createMountWrapper(registration)
    } else {
      throw new Error(
        `window.DAPlugins['${GLOBAL_KEY}'] has no components.Page or mount() function`,
      )
    }

    if (!root) root = ReactDOM.createRoot(document.getElementById('root')!)
    rerender()
  } catch (e: any) {
    postToParent({
      type: `${AW_PREFIX}error`,
      message: e?.message || 'Failed to load plugin',
    })
  }
}

const handleMessage = (event: MessageEvent) => {
  if (event.source !== window.parent) return
  const msg: any = event.data
  if (!msg || typeof msg !== 'object' || typeof msg.type !== 'string') return
  if (!msg.type.startsWith(AW_PREFIX)) return

  switch (msg.type) {
    case `${AW_PREFIX}init`:
      void handleInit(msg)
      break
    case `${AW_PREFIX}props`:
      currentProps = {
        data: msg.props?.data,
        editable: msg.props?.editable,
        config: msg.props?.config,
      }
      rerender()
      break
    case `${AW_PREFIX}runtime`:
      runtimeState = msg.state
      runtimeValues = msg.values
      break
    case `${AW_PREFIX}rpc-result`: {
      const pending = pendingRpc.get(msg.id)
      if (pending) {
        pendingRpc.delete(msg.id)
        if (msg.ok) {
          pending.resolve(msg.result)
        } else {
          pending.reject(
            new Error(msg.error?.message || 'Plugin API call failed'),
          )
        }
      }
      break
    }
    case `${AW_PREFIX}event`: {
      const callback = subscriptions.get(msg.subId)
      if (callback) {
        try {
          callback(msg.payload)
        } catch (e) {
          console.error('[plugin-sandbox] subscription callback error', e)
        }
      }
      break
    }
  }
}

window.addEventListener('message', handleMessage)
postToParent({ type: `${AW_PREFIX}ready` })
