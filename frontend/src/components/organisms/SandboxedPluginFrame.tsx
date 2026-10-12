// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Spinner } from '@/components/atoms/spinner'
import useRuntimeStore from '@/stores/runtimeStore'
import type { PluginAPI } from '@/types/plugin.types'

/**
 * API methods never exposed to untrusted plugins (user-data / destructive
 * vehicle-model operations that must stay admin-only in practice).
 */
export const UNTRUSTED_PLUGIN_API_DENYLIST = [
  'shareAsset',
  'removeAssetAccess',
  'searchUserByEmail',
  'getAssetUsers',
  'replaceAPIs',
  'replaceVss',
  'replaceSignalMapping',
]

const DENYLIST_SET = new Set<string>(UNTRUSTED_PLUGIN_API_DENYLIST)
const SANDBOX_PAGE_URL = '/sandbox-plugin.html'
const READY_TIMEOUT_MS = 30000

interface SandboxedPluginFrameProps {
  pluginUrl: string
  api: PluginAPI
  data?: any
  editable?: boolean
  config?: any
}

/**
 * Host side of the plugin sandbox: renders an opaque-origin iframe running
 * sandbox-plugin.html and bridges PluginAPI calls to it via postMessage.
 * The iframe must NEVER get allow-same-origin (fail closed).
 */
const SandboxedPluginFrame: React.FC<SandboxedPluginFrameProps> = ({
  pluginUrl,
  api,
  data,
  editable,
  config,
}) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const subscriptionsRef = useRef(new Map<number, () => void>())
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const apiRef = useRef(api)
  const propsRef = useRef({ data, editable, config })
  const methodsRef = useRef<string[]>([])

  const methods = useMemo(
    () =>
      Object.keys(api || {}).filter(
        (name) =>
          typeof (api as any)[name] === 'function' && !DENYLIST_SET.has(name),
      ),
    [api],
  )

  // Refs are refreshed after every render so the stable listeners/effects
  // below always see the latest api/props without being torn down.
  useEffect(() => {
    apiRef.current = api
    propsRef.current = { data, editable, config }
    methodsRef.current = methods
  })

  // Outbound payloads must be structured-clone-safe; fall back to a JSON
  // round-trip when the plugin returned something non-cloneable.
  const postToFrame = useCallback((message: any) => {
    const win = iframeRef.current?.contentWindow
    if (!win) return
    try {
      win.postMessage(message, '*')
    } catch (e: any) {
      if (e?.name === 'DataCloneError') {
        win.postMessage(JSON.parse(JSON.stringify(message)), '*')
      } else {
        throw e
      }
    }
  }, [])

  const handleRpc = useCallback(
    async (msg: any) => {
      const id = msg?.id
      const method = typeof msg?.method === 'string' ? msg.method : ''
      const args = Array.isArray(msg?.args) ? msg.args : []
      const fn = (apiRef.current as any)?.[method]
      if (!method || typeof fn !== 'function' || DENYLIST_SET.has(method)) {
        postToFrame({
          type: 'aw-plugin:rpc-result',
          id,
          ok: false,
          error: {
            message: `Plugin API method "${method || 'unknown'}" is not available`,
          },
        })
        return
      }
      try {
        const result = await fn(...args)
        postToFrame({ type: 'aw-plugin:rpc-result', id, ok: true, result })
      } catch (e: any) {
        postToFrame({
          type: 'aw-plugin:rpc-result',
          id,
          ok: false,
          error: { message: e?.message || String(e) },
        })
      }
    },
    [postToFrame],
  )

  // Single message channel to the sandbox; accepts only messages from our frame.
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return
      const msg: any = event.data
      if (!msg || typeof msg !== 'object' || typeof msg.type !== 'string')
        return
      if (!msg.type.startsWith('aw-plugin:')) return

      switch (msg.type) {
        case 'aw-plugin:ready':
          setReady(true)
          break
        case 'aw-plugin:error':
          setError(msg.message || 'Plugin failed to load')
          break
        case 'aw-plugin:rpc':
          void handleRpc(msg)
          break
        case 'aw-plugin:subscribe': {
          if (msg.method === 'onWidgetSignalWrite') {
            const subscribe = apiRef.current?.onWidgetSignalWrite
            if (typeof subscribe === 'function') {
              const subId = msg.subId
              const unsubscribe = subscribe((payload: Record<string, any>) => {
                postToFrame({ type: 'aw-plugin:event', subId, payload })
              })
              subscriptionsRef.current.set(subId, unsubscribe)
            }
          }
          break
        }
        case 'aw-plugin:unsubscribe': {
          const unsubscribe = subscriptionsRef.current.get(msg.subId)
          if (unsubscribe) {
            try {
              unsubscribe()
            } catch (e) {
              console.error('[sandboxed-plugin] unsubscribe error', e)
            }
            subscriptionsRef.current.delete(msg.subId)
          }
          break
        }
      }
    }
    const subscriptions = subscriptionsRef.current
    window.addEventListener('message', handler)
    return () => {
      window.removeEventListener('message', handler)
      subscriptions.forEach((unsubscribe) => {
        try {
          unsubscribe()
        } catch (e) {
          console.error('[sandboxed-plugin] unsubscribe error', e)
        }
      })
      subscriptions.clear()
    }
  }, [handleRpc, postToFrame])

  // Once the sandbox is listening, hand over everything it needs to load the plugin.
  useEffect(() => {
    if (!ready) return
    postToFrame({
      type: 'aw-plugin:init',
      pluginUrl,
      props: propsRef.current,
      methods: methodsRef.current,
      runtime: {
        state: apiRef.current?.getRuntimeState?.(),
        values: apiRef.current?.getRuntimeApiValues?.(),
      },
    })
  }, [ready, pluginUrl, postToFrame])

  // Push prop changes into the sandbox (init already sent the initial props).
  useEffect(() => {
    if (!ready) return
    postToFrame({ type: 'aw-plugin:props', props: { data, editable, config } })
  }, [ready, data, editable, config, postToFrame])

  // Push runtime snapshots when they change. The zustand runtime store hook is
  // the subscription mechanism: this effect re-runs whenever the store updates,
  // and a cheap JSON signature skips redundant posts.
  const runtimeStore = useRuntimeStore()
  const lastRuntimeSigRef = useRef('')
  useEffect(() => {
    if (!ready) return
    const state = apiRef.current?.getRuntimeState?.()
    const values = apiRef.current?.getRuntimeApiValues?.()
    let sig: string
    try {
      sig = JSON.stringify([state, values])
    } catch {
      sig = String(Date.now())
    }
    if (sig !== lastRuntimeSigRef.current) {
      lastRuntimeSigRef.current = sig
      postToFrame({ type: 'aw-plugin:runtime', state, values })
    }
  }, [ready, runtimeStore, postToFrame])

  // If the sandbox never comes up, surface an error instead of spinning forever.
  useEffect(() => {
    if (ready || error) return
    const timer = setTimeout(() => {
      setError('Plugin sandbox did not start in time')
    }, READY_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [ready, error])

  return (
    <div className="w-full h-full relative">
      <iframe
        ref={iframeRef}
        src={SANDBOX_PAGE_URL}
        // Opaque origin on purpose - never add allow-same-origin here.
        sandbox="allow-scripts allow-forms allow-popups allow-downloads"
        className="w-full h-full border-0"
        title={pluginUrl}
      />

      {error && (
        <div className="flex flex-col items-center justify-center w-full h-full gap-4 absolute inset-0 bg-background">
          <p className="text-base text-destructive">{error}</p>
        </div>
      )}

      {!ready && !error && (
        <div className="flex flex-col items-center justify-center w-full h-full gap-4 absolute inset-0 bg-background">
          <Spinner size={32} />
          <p className="text-sm text-muted-foreground">Loading plugin...</p>
        </div>
      )}
    </div>
  )
}

export default SandboxedPluginFrame
