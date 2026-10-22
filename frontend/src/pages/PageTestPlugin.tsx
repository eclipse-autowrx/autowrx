// Copyright (c) 2025 Eclipse Foundation.
// SPDX-License-Identifier: MIT

import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react'

export default function PageTestPlugin() {
  const PLUGIN_URL = '/plugin/sample-tsx/index.js'
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pluginReadyRef = useRef<Promise<void> | null>(null)

  useEffect(() => {
    let cancelled = false
    const log = (...args: any[]) => console.log('[test-plugin]', ...args)
    const ensureGlobals = async () => {
      log('ensureGlobals: start')
      // Ensure React and ReactDOM are available BEFORE loading plugin
      if (!(window as any).React) {
        const ReactMod = await import('react')
        ;(window as any).React = (ReactMod as any).default || ReactMod
        log('ensureGlobals: React attached to window')
      } else {
        log('ensureGlobals: React already present')
      }
      if (!(window as any).ReactDOM) {
        const ReactDOMClient = await import('react-dom/client')
        ;(window as any).ReactDOM = ReactDOMClient
        log('ensureGlobals: ReactDOM attached to window')
      } else {
        log('ensureGlobals: ReactDOM already present')
      }
      // For IIFE plugins that use require(), expose modules
      if (!(window as any).require) {
        const ReactMod = await import('react')
        const ReactDOMMod = await import('react-dom/client')
        const JSXRuntime = await import('react/jsx-runtime')

        const requireShim = function (id: string) {
          log('require() called for:', id)
          if (id === 'react') return ReactMod
          if (id === 'react-dom/client') return ReactDOMMod
          if (id === 'react/jsx-runtime') return JSXRuntime
          throw new Error(`Module ${id} not found`)
        }

        ;(window as any).require = requireShim
        ;(globalThis as any).require = requireShim
        log('ensureGlobals: require() shim added to window and globalThis')
      }
    }

    const waitFor = (
      predicate: () => any,
      label: string,
      maxMs = 6000,
      interval = 50,
    ) => {
      const start = Date.now()
      return new Promise<void>((resolve, reject) => {
        const check = () => {
          if (cancelled) return reject(new Error('cancelled'))
          try {
            if (predicate()) {
              log(`ready: ${label} in ${Date.now() - start}ms`)
              return resolve()
            }
          } catch {}
          if (Date.now() - start > maxMs) {
            log(`timeout: ${label}`)
            return reject(new Error(`timeout: ${label}`))
          }
          setTimeout(check, interval)
        }
        check()
      })
    }

    const loadAndMount = async () => {
      try {
        await ensureGlobals()
        let script: HTMLScriptElement | null = document.querySelector(
          `script[data-aw-plugin="${PLUGIN_URL}"]`,
        )
        if (!script) {
          log('injecting script', PLUGIN_URL)
          script = document.createElement('script')
          script.src = PLUGIN_URL
          script.async = true
          script.defer = true
          script.crossOrigin = 'anonymous'
          script.dataset.awPlugin = PLUGIN_URL
          await new Promise<void>((resolve, reject) => {
            script!.onload = () => {
              log('script loaded')
              resolve()
            }
            script!.onerror = () => {
              log('script error')
              reject(new Error('Failed to load plugin script'))
            }
            document.body.appendChild(script!)
          })
        } else {
          log('script already present, reusing')
        }
        await waitFor(
          () => !!(window as any).DAPlugins?.['sample-tsx'],
          'DAPlugins.sample-tsx ready',
        )
        pluginReadyRef.current = Promise.resolve()
        await waitFor(() => !!containerRef.current, 'containerRef')
        if (cancelled) return
        // @ts-ignore
        log('plugin ready for lazy consumption')
        setLoaded(true)
      } catch (e: any) {
        if (e?.message === 'cancelled') {
          log('loadAndMount aborted (React strict mode double-invoke)')
          return
        }
        log('loadAndMount error', e)
        setError(e?.message || 'Plugin load error')
      }
    }

    loadAndMount()

    return () => {
      cancelled = true
      try {
        // @ts-ignore
        window?.DAPlugins?.sample?.unmount?.(containerRef.current)
      } catch {}
    }
  }, [PLUGIN_URL])

  // Typing for the remote component
  type RemotePageProps = { data?: any; config?: any }

  const RemotePage = useMemo(
    () =>
      React.lazy(
        async (): Promise<{
          default: React.ComponentType<RemotePageProps>
        }> => {
          // wait until ensure/load completes
          if (pluginReadyRef.current) {
            try {
              await pluginReadyRef.current
            } catch {}
          }
          // @ts-ignore
          const comp = (window as any).DAPlugins?.['sample-tsx']?.components
            ?.Page
          if (!comp) throw new Error('Remote Page component missing')
          return { default: comp as React.ComponentType<RemotePageProps> }
        },
      ),
    [],
  )

  return (
    <div className="min-h-screen w-full" ref={containerRef}>
      {error && <div className="p-3 text-red-600">{error}</div>}
      {loaded && (
        <Suspense
          fallback={<div className="p-4">Loading remote component…</div>}
        >
          <RemotePage
            data={{ count: 0 }}
            config={{ title: 'External Plugin (TSX)' }}
          />
        </Suspense>
      )}
    </div>
  )
}
