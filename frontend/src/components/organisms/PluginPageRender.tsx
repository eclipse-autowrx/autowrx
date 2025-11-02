// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Spinner } from '@/components/atoms/spinner'
import { listPlugins, Plugin } from '@/services/plugin.service'

interface PluginPageRenderProps {
  plugin_id: string
  data?: any
}

const PluginPageRender: React.FC<PluginPageRenderProps> = ({ plugin_id, data }) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [plugin, setPlugin] = useState<Plugin | null>(null)
  const pluginReadyRef = useRef<Promise<void> | null>(null)

  // First, fetch plugin data by slug
  useEffect(() => {
    let cancelled = false
    const log = (...args: any[]) => console.log(`[plugin-render:${plugin_id}]`, ...args)

    const fetchPlugin = async () => {
      try {
        log('Fetching plugin by slug:', plugin_id)
        const response = await listPlugins({ page: 1, limit: 100 })
        const foundPlugin = response.results.find((p) => p.slug === plugin_id)

        if (!foundPlugin) {
          throw new Error(`Plugin with slug "${plugin_id}" not found`)
        }

        if (!foundPlugin.url) {
          throw new Error(`Plugin "${plugin_id}" has no URL configured`)
        }

        log('Plugin found:', foundPlugin)
        log('Plugin URL:', foundPlugin.url)

        if (!cancelled) {
          setPlugin(foundPlugin)
        }
      } catch (e: any) {
        log('Failed to fetch plugin:', e)
        if (!cancelled) {
          setError(e?.message || 'Failed to fetch plugin')
        }
      }
    }

    fetchPlugin()

    return () => {
      cancelled = true
    }
  }, [plugin_id])

  // Then, load the plugin script
  useEffect(() => {
    if (!plugin || !plugin.url) return

    let cancelled = false
    const log = (...args: any[]) => console.log(`[plugin-render:${plugin_id}]`, ...args)

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

        const requireShim = function(id: string) {
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

    const waitFor = (predicate: () => any, label: string, maxMs = 6000, interval = 50) => {
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
        const PLUGIN_URL = plugin.url!
        log('Loading plugin from URL:', PLUGIN_URL)

        // Get list of plugins before loading
        const pluginsBefore = Object.keys((window as any).DAPlugins || {})
        log('DAPlugins before loading:', pluginsBefore)

        let script: HTMLScriptElement | null = document.querySelector(`script[data-aw-plugin="${PLUGIN_URL}"]`)
        if (!script) {
          log('injecting script', PLUGIN_URL)
          script = document.createElement('script')
          script.src = PLUGIN_URL
          script.async = true
          script.defer = true
          script.crossOrigin = 'anonymous'
          script.dataset.awPlugin = PLUGIN_URL
          await new Promise<void>((resolve, reject) => {
            script!.onload = () => { log('script loaded'); resolve() }
            script!.onerror = () => { log('script error'); reject(new Error('Failed to load plugin script')) }
            document.body.appendChild(script!)
          })
        } else {
          log('script already present, reusing')
        }

        // Wait for a new plugin to be registered (any new key in DAPlugins)
        let detectedPluginName: string | null = null
        await waitFor(() => {
          const pluginsAfter = Object.keys((window as any).DAPlugins || {})
          const newPlugins = pluginsAfter.filter(p => !pluginsBefore.includes(p))
          if (newPlugins.length > 0) {
            detectedPluginName = newPlugins[0]
            return true
          }
          return false
        }, 'New plugin registration detected')

        log('Detected plugin registered as:', detectedPluginName)

        if (!detectedPluginName) {
          throw new Error('Plugin did not register itself in window.DAPlugins')
        }

        // Store the detected name for later use
        ;(window as any).__lastLoadedPlugin = detectedPluginName
        pluginReadyRef.current = Promise.resolve()
        await waitFor(() => !!containerRef.current, 'containerRef')
        if (cancelled) return
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
        const pluginName = (window as any).__lastLoadedPlugin
        if (pluginName) {
          // @ts-ignore
          window?.DAPlugins?.[pluginName]?.unmount?.(containerRef.current)
        }
      } catch {}
    }
  }, [plugin_id, plugin])

  // Typing for the remote component
  type RemotePageProps = { data?: any; config?: any }

  const RemotePage = useMemo(() =>
    React.lazy(async (): Promise<{ default: React.ComponentType<RemotePageProps> }> => {
      // wait until ensure/load completes
      if (pluginReadyRef.current) {
        try { await pluginReadyRef.current } catch {}
      }
      // Use the detected plugin name from loading
      const pluginRegistrationName = (window as any).__lastLoadedPlugin
      if (!pluginRegistrationName) {
        throw new Error('No plugin was detected')
      }
      // @ts-ignore
      const comp = (window as any).DAPlugins?.[pluginRegistrationName]?.components?.Page
      if (!comp) throw new Error('Remote Page component missing')
      return { default: comp as React.ComponentType<RemotePageProps> }
    }),
  [plugin_id, plugin])

  return (
    <div className="w-full h-full" ref={containerRef}>
      {error && (
        <div className="flex flex-col items-center justify-center w-full h-full gap-4">
          <p className="text-base text-destructive">{error}</p>
        </div>
      )}
      {!error && !loaded && (
        <div className="flex flex-col items-center justify-center w-full h-full gap-4">
          <Spinner size={32} />
          <p className="text-sm text-muted-foreground">Loading plugin...</p>
        </div>
      )}
      {!error && loaded && (
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center w-full h-full gap-4">
            <Spinner size={32} />
            <p className="text-sm text-muted-foreground">Initializing plugin...</p>
          </div>
        }>
          <RemotePage data={data} config={{ plugin_id }} />
        </Suspense>
      )}
    </div>
  )
}

export default PluginPageRender
