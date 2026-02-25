// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { Spinner } from '@/components/atoms/spinner'
import { getPluginById, getPluginBySlug } from '@/services/plugin.service'
import { updateModelService, getComputedAPIs, getApiDetailService, replaceAPIsService } from '@/services/model.service'
import { updatePrototypeService } from '@/services/prototype.service'
import { listVSSVersionsService } from '@/services/api.service'
import {
  createExtendedApi,
  updateExtendedApi,
  deleteExtendedApi,
  getExtendedApi,
  listExtendedApis
} from '@/services/extendedApis.service'
import useRuntimeStore from '@/stores/runtimeStore'
import type { PluginAPI } from '@/types/plugin.types'
import type { Model, Prototype } from '@/types/model.type'
import type { CVI, VehicleAPI, VSSRelease, ExtendedApi, ExtendedApiCreate, ExtendedApiRet } from '@/types/api.type'
import type { List } from '@/types/common.type'

interface PluginPageRenderProps {
  plugin_id: string
  data?: any
  onSetActiveTab?: (tab: string, pluginSlug?: string) => void
}

const GLOBAL_KEY = 'page-plugin'
const REGISTER_TIMEOUT_MS = 15000
const POLL_INTERVAL_MS = 100
const YIELD_AFTER_LOAD_MS = 200

/** Module-level: survives unmount so we know when user comes back to same plugin (refs would be reset). */
let lastInjectedPluginUrl: string | null = null
/** Track which plugin_id owns the current registration - prevents reusing wrong plugin when switching tabs. */
let lastInjectedPluginId: string | null = null
/** Store plugin registrations per plugin_id since all plugins register under the same 'page-plugin' key */
const pluginRegistrations = new Map<string, any>()
/** Map plugin URLs to plugin_ids so we can match registrations even when multiple plugins load simultaneously */
const urlToPluginId = new Map<string, string>()

const PluginPageRender: React.FC<PluginPageRenderProps> = ({ plugin_id, data, onSetActiveTab }) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const injectedScriptRef = useRef<HTMLScriptElement | null>(null)
  const loadIdRef = useRef(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [PluginComponent, setPluginComponent] = useState<React.ComponentType<any> | null>(null)
  const [loadedPluginName, setLoadedPluginName] = useState<string | null>(null)

  // Extract IDs from data
  const model_id = data?.model?.id
  const prototype_id = data?.prototype?.id

  // Access runtime store for API values
  const { apisValue, setActiveApis } = useRuntimeStore()
  const queryClient = useQueryClient()

  // Create API callbacks for plugin to interact with host
  const handleUpdateModel = useCallback(async (updates: Partial<Model>): Promise<Model> => {
    if (!model_id) {
      const errorMsg = 'Cannot update model: model_id not available in data'
      toast.error(errorMsg)
      throw new Error(errorMsg)
    }
    try {
      const updatedModel = await updateModelService(model_id, updates)
      toast.success('Model updated successfully')
      return updatedModel
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to update model'
      toast.error(errorMsg)
      throw err
    }
  }, [model_id])

  const handleUpdatePrototype = useCallback(async (updates: Partial<Prototype>): Promise<Prototype> => {
    if (!prototype_id) {
      const errorMsg = 'Cannot update prototype: prototype_id not available in data'
      toast.error(errorMsg)
      throw new Error(errorMsg)
    }
    try {
      const updatedPrototype = await updatePrototypeService(prototype_id, updates)
      // Invalidate React Query cache so parent re-fetches and passes fresh data.prototype to the plugin
      await queryClient.invalidateQueries({ queryKey: ['prototype', prototype_id] })
      toast.success('Prototype updated successfully')
      return updatedPrototype
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to update prototype'
      toast.error(errorMsg)
      throw err
    }
  }, [prototype_id, queryClient])

  // Vehicle API operations (read-only)
  const handleGetComputedAPIs = useCallback(async (targetModelId?: string): Promise<CVI> => {
    const modelIdToUse = targetModelId || model_id
    if (!modelIdToUse) {
      const errorMsg = 'Cannot get computed APIs: model_id not available'
      toast.error(errorMsg)
      throw new Error(errorMsg)
    }
    try {
      return await getComputedAPIs(modelIdToUse)
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to get computed APIs'
      toast.error(errorMsg)
      throw err
    }
  }, [model_id])

  const handleGetApiDetail = useCallback(async (api_name: string, targetModelId?: string): Promise<VehicleAPI> => {
    const modelIdToUse = targetModelId || model_id
    if (!modelIdToUse) {
      const errorMsg = 'Cannot get API detail: model_id not available'
      toast.error(errorMsg)
      throw new Error(errorMsg)
    }
    try {
      return await getApiDetailService(modelIdToUse, api_name)
    } catch (err: any) {
      const errorMsg = err?.message || `Failed to get API detail for ${api_name}`
      toast.error(errorMsg)
      throw err
    }
  }, [model_id])

  const handleListVSSVersions = useCallback(async (): Promise<string[]> => {
    try {
      const versions = await listVSSVersionsService()
      return versions.map((v: VSSRelease) => v.name)
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to list VSS versions'
      toast.error(errorMsg)
      throw err
    }
  }, [])

  // Vehicle API write operations
  const handleReplaceAPIs = useCallback(async (api_data_url: string, targetModelId?: string): Promise<void> => {
    const modelIdToUse = targetModelId || model_id
    if (!modelIdToUse) {
      const errorMsg = 'Cannot replace APIs: model_id not available'
      toast.error(errorMsg)
      throw new Error(errorMsg)
    }
    try {
      await replaceAPIsService(modelIdToUse, api_data_url)
      toast.success('Vehicle APIs replaced successfully')
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to replace APIs'
      toast.error(errorMsg)
      throw err
    }
  }, [model_id])

  const handleSetRuntimeApiValues = useCallback((values: Record<string, any>): void => {
    try {
      setActiveApis(values)
      toast.success('Runtime API values updated')
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to set runtime API values'
      toast.error(errorMsg)
      throw err
    }
  }, [setActiveApis])

  const handleGetRuntimeApiValues = useCallback((): Record<string, any> => {
    return (apisValue as Record<string, any>) || {}
  }, [apisValue])

  // Wishlist API operations
  const handleCreateWishlistApi = useCallback(async (data: ExtendedApiCreate): Promise<ExtendedApiRet> => {
    try {
      const result = await createExtendedApi(data)
      toast.success('Wishlist API created successfully')
      return result
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to create wishlist API'
      toast.error(errorMsg)
      throw err
    }
  }, [])

  const handleUpdateWishlistApi = useCallback(async (id: string, data: Partial<ExtendedApiCreate>): Promise<Partial<ExtendedApiCreate>> => {
    try {
      const result = await updateExtendedApi(data, id)
      toast.success('Wishlist API updated successfully')
      return result
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to update wishlist API'
      toast.error(errorMsg)
      throw err
    }
  }, [])

  const handleDeleteWishlistApi = useCallback(async (id: string): Promise<void> => {
    try {
      await deleteExtendedApi(id)
      toast.success('Wishlist API deleted successfully')
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to delete wishlist API'
      toast.error(errorMsg)
      throw err
    }
  }, [])

  const handleGetWishlistApi = useCallback(async (name: string, targetModelId?: string): Promise<ExtendedApi> => {
    const modelIdToUse = targetModelId || model_id
    if (!modelIdToUse) {
      const errorMsg = 'Cannot get wishlist API: model_id not available'
      toast.error(errorMsg)
      throw new Error(errorMsg)
    }
    try {
      return await getExtendedApi(name, modelIdToUse)
    } catch (err: any) {
      const errorMsg = err?.message || `Failed to get wishlist API: ${name}`
      toast.error(errorMsg)
      throw err
    }
  }, [model_id])

  const handleListWishlistApis = useCallback(async (targetModelId?: string): Promise<List<ExtendedApi>> => {
    const modelIdToUse = targetModelId || model_id
    if (!modelIdToUse) {
      const errorMsg = 'Cannot list wishlist APIs: model_id not available'
      toast.error(errorMsg)
      throw new Error(errorMsg)
    }
    try {
      return await listExtendedApis(modelIdToUse)
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to list wishlist APIs'
      toast.error(errorMsg)
      throw err
    }
  }, [model_id])

  const pluginAPI: PluginAPI = {
    // Model & Prototype updates
    updateModel: model_id ? handleUpdateModel : undefined,
    updatePrototype: prototype_id ? handleUpdatePrototype : undefined,

    // Vehicle API operations (read)
    getComputedAPIs: model_id ? handleGetComputedAPIs : undefined,
    getApiDetail: model_id ? handleGetApiDetail : undefined,
    listVSSVersions: handleListVSSVersions,

    // Vehicle API operations (write)
    replaceAPIs: model_id ? handleReplaceAPIs : undefined,
    setRuntimeApiValues: handleSetRuntimeApiValues,
    getRuntimeApiValues: handleGetRuntimeApiValues,

    // Navigation
    setActiveTab: onSetActiveTab,

    // Wishlist API operations
    createWishlistApi: handleCreateWishlistApi,
    updateWishlistApi: handleUpdateWishlistApi,
    deleteWishlistApi: handleDeleteWishlistApi,
    getWishlistApi: model_id ? handleGetWishlistApi : undefined,
    listWishlistApis: model_id ? handleListWishlistApis : undefined,
  }

  // Log when component mounts/remounts
  useEffect(() => {
    return () => { }
  }, [])

  useEffect(() => {
    let cancelled = false
    loadIdRef.current += 1
    const myLoadId = loadIdRef.current
    const log = (..._args: any[]) => { }

    const loadPlugin = async () => {
      try {
        setLoading(true)
        setError(null)
        setPluginComponent(null)
        setLoadedPluginName(null)

        log('Starting plugin load')

        // Step 1: Fetch plugin metadata
        log('Fetching plugin metadata')
        let pluginMeta: any | null = null
        try {
          pluginMeta = await getPluginBySlug(plugin_id)
          log('Fetched by slug')
        } catch (e) {
          log('Fetch by slug failed, attempting by id')
          try {
            pluginMeta = await getPluginById(plugin_id)
            log('Fetched by id')
          } catch (e2) {
            log('Fetch by id failed')
          }
        }
        if (cancelled) return

        if (!pluginMeta) {
          throw new Error(`Plugin with slug "${plugin_id}" not found`)
        }

        if (!pluginMeta.url) {
          throw new Error(`Plugin "${plugin_id}" has no URL configured`)
        }



        const PLUGIN_URL = pluginMeta.url
        log('Plugin URL:', PLUGIN_URL)

        // Step 2: Ensure global dependencies (React, ReactDOM) - MUST be available BEFORE script executes
        log('Ensuring global dependencies')

        // Always ensure React is available (plugins might check for it)
        const ReactMod = await import('react')
          ; (window as any).React = (ReactMod as any).default || ReactMod
        log('React attached to window')

        // Always ensure ReactDOM is available (plugins need this)
        const ReactDOMClient = await import('react-dom/client')
          ; (window as any).ReactDOM = ReactDOMClient
          ; (window as any).ReactDOMClient = ReactDOMClient // Some plugins might look for this
        log('ReactDOM attached to window')

        // Ensure require shim is available and handles all React-related modules
        const ReactDOMMod = await import('react-dom/client')
        const JSXRuntime = await import('react/jsx-runtime')

        // Create a synchronous module registry that loaders can query
        // Some module loaders (like webpack) check module availability synchronously
        const moduleRegistry: Record<string, any> = {
          'react': ReactMod,
          'react-dom': ReactDOMMod,
          'react-dom/client': ReactDOMMod,
          'react/jsx-runtime': JSXRuntime,
          'react/jsx-dev-runtime': JSXRuntime,
        }

          // Make module registry available synchronously
          ; (window as any).__PLUGIN_MODULES__ = moduleRegistry

        const requireShim = function (id: string) {
          if (moduleRegistry[id]) {
            return moduleRegistry[id]
          }
          throw new Error(`Module ${id} not found`)
        }

          ; (window as any).require = requireShim
          ; (globalThis as any).require = requireShim

        // Some loaders might check for webpack-style module cache
        if (!(window as any).__webpack_require__) {
          ; (window as any).__webpack_require__ = {
            cache: moduleRegistry,
            resolve: (id: string) => {
              if (moduleRegistry[id]) return id
              throw new Error(`Cannot resolve module: ${id}`)
            },
          }
        } else {
          // Merge with existing webpack cache if it exists
          Object.assign((window as any).__webpack_require__.cache || {}, moduleRegistry)
        }

        log('require() shim added with react-dom/client support and module registry')

        // Small delay to ensure module registry is fully set up before script executes
        // Some loaders check module availability synchronously during script evaluation
        await new Promise((r) => setTimeout(r, 50))
        if (cancelled) return

        // Step 3: Load plugin script and wait for global registration under a fixed key.
        // Since components now stay mounted (show/hide), we don't need versioning - use base URL for proper caching.
        // IMPORTANT: All plugins register under the same 'page-plugin' key, so we intercept and store per plugin_id

        // Check if this plugin is already registered in our map
        const existingRegistration = pluginRegistrations.get(plugin_id)
        if (existingRegistration) {
          // Registration exists for this plugin_id - use it directly (instant, no re-injection needed)
          log('Reusing cached plugin registration for plugin_id:', plugin_id)
          const component = existingRegistration?.components?.Page || null
          if (component || existingRegistration?.mount) {
            if (cancelled || myLoadId !== loadIdRef.current) return
            setLoadedPluginName(plugin_id)
            setPluginComponent(() => component || (() => {
              const mountFn = existingRegistration.mount
              const unmountFn = existingRegistration.unmount
              const Wrapper: React.FC<any> = (props) => {
                const ref = React.useRef<HTMLDivElement | null>(null)
                React.useEffect(() => {
                  if (ref.current) {
                    try {
                      mountFn(ref.current, props)
                    } catch (e) {
                      console.error(`[plugin-render:${plugin_id}] mount error`, e)
                    }
                  }
                  return () => {
                    try {
                      unmountFn?.(ref.current)
                    } catch (e) {
                      console.error(`[plugin-render:${plugin_id}] unmount error`, e)
                    }
                  }
                }, [props])
                return <div ref={ref} className="w-full h-full" />
              }
              return Wrapper
            })())
            setLoading(false)
            return // Skip injection, use cached registration
          }
        }

        // Map this URL to plugin_id so we can match registrations even when multiple plugins load simultaneously
        urlToPluginId.set(PLUGIN_URL, plugin_id)
          ; (window as any).DAPlugins = (window as any).DAPlugins || {}

        // Always use base URL (no versioning) - components stay mounted so script only loads once per component
        // Browser caching will work properly with the same URL
        const scriptUrl = PLUGIN_URL

        async function injectAndWait(asModule: boolean): Promise<any> {
          // Clear the global slot so plugin can register fresh
          ; (window as any).DAPlugins = (window as any).DAPlugins || {}
            ; (window as any).DAPlugins[GLOBAL_KEY] = undefined

          // Remove any existing script tags with this URL to force fresh execution
          const existingScripts = Array.from(document.querySelectorAll(`script[src="${scriptUrl}"], script[src="${PLUGIN_URL}"]`))
          existingScripts.forEach((s) => {
            const scriptEl = s as HTMLScriptElement
            log('Removing existing script tag:', scriptEl.src)
            s.remove()
          })

          const script = document.createElement('script')
          script.src = scriptUrl
          script.async = true
          // For ES modules, defer is automatic and redundant - don't set it
          // For classic scripts, defer helps with execution order
          if (!asModule) {
            script.defer = true
          }
          script.crossOrigin = 'anonymous'
          if (asModule) script.type = 'module'

          if (injectedScriptRef.current) {
            injectedScriptRef.current.remove()
            injectedScriptRef.current = null
          }
          injectedScriptRef.current = script

          let scriptLoadError: Error | null = null
          let scriptExecutionError: any = null

          // Capture script execution errors
          const originalErrorHandler = window.onerror
          const errorHandler: OnErrorEventHandler = (event, source, lineno, colno, error) => {
            const sourceStr = typeof source === 'string' ? source : ''
            const eventStr = typeof event === 'string' ? event : event?.toString() || 'Unknown error'
            if (sourceStr === scriptUrl || sourceStr.includes(PLUGIN_URL)) {
              scriptExecutionError = error || new Error(`${eventStr} at ${sourceStr}:${lineno}:${colno}`)
              log('Script execution error:', scriptExecutionError)
            }
            if (originalErrorHandler) {
              return originalErrorHandler(event, source, lineno, colno, error)
            }
            return false
          }
          window.onerror = errorHandler

          try {
            await new Promise<void>((resolve, reject) => {
              script.onload = () => {
                log('Script loaded successfully:', scriptUrl)
                // Check immediately if script registered synchronously (especially for cached scripts)
                const immediateRegistration = (window as any).DAPlugins?.[GLOBAL_KEY]
                if (immediateRegistration) {
                  const mappedPluginId = urlToPluginId.get(PLUGIN_URL)
                  if (mappedPluginId === plugin_id) {
                    log('Plugin registered synchronously on script load (cached script)')
                    pluginRegistrations.set(plugin_id, immediateRegistration)
                  }
                }
                resolve()
              }
              script.onerror = (e) => {
                scriptLoadError = new Error(`Failed to load plugin script: ${scriptUrl}`)
                log('Script load error:', scriptLoadError)
                reject(scriptLoadError)
              }
              document.body.appendChild(script)
              log('Script tag appended to DOM:', scriptUrl)
            })
          } finally {
            window.onerror = originalErrorHandler
          }

          if (scriptLoadError) {
            throw scriptLoadError
          }

          lastInjectedPluginUrl = PLUGIN_URL
          lastInjectedPluginId = plugin_id

          // Yield so the script has a chance to run (especially important for module scripts).
          // For modules, onload fires when module is loaded, but evaluation happens asynchronously.
          await new Promise((r) => setTimeout(r, YIELD_AFTER_LOAD_MS))
          if (cancelled) return null

          if (scriptExecutionError) {
            throw new Error(`Plugin script execution error: ${scriptExecutionError.message}`)
          }

          // Check immediately after yield - script might have registered already
          // Check our plugin-specific registration map first
          let obj = pluginRegistrations.get(plugin_id)
          if (obj) {
            log('Plugin registered immediately after yield (from map)')
            return obj
          }

          // Check global registration - match by URL to plugin_id mapping
          obj = (window as any).DAPlugins?.[GLOBAL_KEY]
          if (obj) {
            const mappedPluginId = urlToPluginId.get(PLUGIN_URL)
            if (mappedPluginId === plugin_id) {
              log('Plugin registered immediately after yield (capturing for plugin_id:', plugin_id, ')')
              pluginRegistrations.set(plugin_id, obj) // Store in map for this plugin_id
              return obj
            } else {
              log('Found registration but URL mapping mismatch. Mapped:', mappedPluginId, 'Expected:', plugin_id)
            }
          }

          // For debugging: log what's in DAPlugins
          log('DAPlugins state:', Object.keys((window as any).DAPlugins || {}))
          log('Checking for registration for plugin_id:', plugin_id)
          log('Registered plugin IDs:', Array.from(pluginRegistrations.keys()))

          const maxAttempts = Math.ceil(REGISTER_TIMEOUT_MS / POLL_INTERVAL_MS)
          let attempts = 0
          while (attempts < maxAttempts) {
            if (cancelled) return null

            // Check our plugin-specific map first
            obj = pluginRegistrations.get(plugin_id)
            if (obj) {
              log(`Plugin registered after ${attempts * POLL_INTERVAL_MS}ms (from map)`)
              return obj
            }

            // Check global - match by URL to plugin_id mapping
            obj = (window as any).DAPlugins?.[GLOBAL_KEY]
            if (obj) {
              const mappedPluginId = urlToPluginId.get(PLUGIN_URL)
              if (mappedPluginId === plugin_id) {
                log(`Plugin registered after ${attempts * POLL_INTERVAL_MS}ms (capturing for plugin_id: ${plugin_id})`)
                pluginRegistrations.set(plugin_id, obj) // Store in map
                return obj
              }
            }

            // Log every 10 attempts (1 second) for debugging
            if (attempts > 0 && attempts % 10 === 0) {
              log(`Still waiting for registration... ${attempts * POLL_INTERVAL_MS}ms elapsed`)
              log('Current DAPlugins keys:', Object.keys((window as any).DAPlugins || {}))
              log('Registered plugin IDs:', Array.from(pluginRegistrations.keys()))
              log('URL to plugin_id mapping:', Array.from(urlToPluginId.entries()))
            }
            await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
            attempts++
          }

          // Final check before throwing
          obj = pluginRegistrations.get(plugin_id)
          if (obj) {
            log('Plugin registered at final check (from map)')
            return obj
          }

          obj = (window as any).DAPlugins?.[GLOBAL_KEY]
          if (obj) {
            const mappedPluginId = urlToPluginId.get(PLUGIN_URL)
            if (mappedPluginId === plugin_id) {
              log('Plugin registered at final check (capturing for plugin_id)')
              pluginRegistrations.set(plugin_id, obj)
              return obj
            }
          }

          // Enhanced error message with debugging info
          const errorMsg = `Plugin did not register at window.DAPlugins['${GLOBAL_KEY}'] within ${REGISTER_TIMEOUT_MS}ms. ` +
            `Script URL: ${scriptUrl}, ` +
            `Plugin ID: ${plugin_id}, ` +
            `DAPlugins keys: [${Object.keys((window as any).DAPlugins || {}).join(', ')}], ` +
            `Registered plugin IDs: [${Array.from(pluginRegistrations.keys()).join(', ')}], ` +
            `Script execution error: ${scriptExecutionError ? scriptExecutionError.message : 'none'}`
          log('Registration timeout:', errorMsg)
          throw new Error(errorMsg)
        }

        // Try module first (most plugins are ESM); fall back to classic.
        let pluginObj: any = null
        try {
          pluginObj = await injectAndWait(true)
        } catch (e1) {
          if (cancelled) return
          if (injectedScriptRef.current?.parentNode) injectedScriptRef.current.remove()
          injectedScriptRef.current = null
          log('Module script load failed or not registered in time, retrying as classic')
          pluginObj = await injectAndWait(false)
        }
        if (cancelled || pluginObj == null) return

        let component: React.ComponentType<any> | null = pluginObj?.components?.Page || null
        if (!component && pluginObj?.mount) {
          const mountFn = pluginObj.mount
          const unmountFn = pluginObj.unmount
          const Wrapper: React.FC<any> = (props) => {
            const ref = React.useRef<HTMLDivElement | null>(null)
            React.useEffect(() => {
              if (ref.current) {
                try {
                  mountFn(ref.current, props)
                } catch (e) {
                  console.error(`[plugin-render:${plugin_id}] mount error`, e)
                }
              }
              return () => {
                try {
                  unmountFn?.(ref.current)
                } catch (e) {
                  console.error(`[plugin-render:${plugin_id}] unmount error`, e)
                }
              }
            }, [props])
            return <div ref={ref} className="w-full h-full" />
          }
          component = Wrapper
          log('Using mount/unmount wrapper from global plugin')
        }
        if (!component) {
          throw new Error(`window.DAPlugins['${GLOBAL_KEY}'] has no components.Page or mount() function`)
        }

        if (cancelled || myLoadId !== loadIdRef.current) return

        setLoadedPluginName(plugin_id)
        setPluginComponent(() => component)
        setLoading(false)
        log('Plugin ready to render for plugin_id:', plugin_id)

      } catch (e: any) {
        log('Error loading plugin:', e)
        if (!cancelled && myLoadId === loadIdRef.current) {
          setError(e?.message || 'Failed to load plugin')
          setLoading(false)
        }
      }
    }

    loadPlugin()

    // Cleanup function: remove injected script but keep registration in map for reuse
    return () => {
      cancelled = true
      log('Cleanup - unmounting plugin (keeping registration in map for cache)')
      try {
        const el = containerRef.current
        // Unmount using the plugin-specific registration if available
        const registration = pluginRegistrations.get(plugin_id)
        if (registration?.unmount) {
          registration.unmount(el)
        } else {
          ; (window as any)?.DAPlugins?.[GLOBAL_KEY]?.unmount?.(el)
        }
      } catch { }
      if (injectedScriptRef.current?.parentNode) {
        injectedScriptRef.current.remove()
      }
      injectedScriptRef.current = null
      // Don't clear pluginRegistrations - keep registrations in map for reuse
      setPluginComponent(null)
      setLoadedPluginName(null)
    }
  }, [plugin_id])

  // Only render when we have a component and it was loaded for this exact plugin_id (deep check)
  const shouldRenderPlugin =
    !loading && !error && !!PluginComponent && loadedPluginName === plugin_id

  // Log what we're about to render
  useEffect(() => {
  }, [shouldRenderPlugin, loadedPluginName, plugin_id])

  return (
    <div className="w-full h-full" ref={containerRef}>
      {error && (
        <div className="flex flex-col items-center justify-center w-full h-full gap-4">
          <p className="text-base text-destructive">{error}</p>
        </div>
      )}

      {loading && !error && (
        <div className="flex flex-col items-center justify-center w-full h-full gap-4">
          <Spinner size={32} />
          <p className="text-sm text-muted-foreground">Loading plugin...</p>
        </div>
      )}

      {shouldRenderPlugin && (
        <div key={`plugin-${plugin_id}-${loadedPluginName}`} className="w-full h-full">
          <PluginComponent data={data} config={{ plugin_id: loadedPluginName }} api={pluginAPI} />
        </div>
      )}

      {!loading && !error && !PluginComponent && (
        <div className="flex flex-col items-center justify-center w-full h-full gap-4">
          <p className="text-base text-destructive">Plugin component not found</p>
        </div>
      )}
    </div>
  )
}

export default PluginPageRender
