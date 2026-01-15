// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useCallback, useEffect, useRef, useState } from 'react'
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
}

const PluginPageRender: React.FC<PluginPageRenderProps> = ({ plugin_id, data }) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [PluginComponent, setPluginComponent] = useState<React.ComponentType<any> | null>(null)
  const [loadedPluginName, setLoadedPluginName] = useState<string | null>(null)

  // Extract IDs from data
  const model_id = data?.model?.id
  const prototype_id = data?.prototype?.id

  // Access runtime store for API values
  const { apisValue, setActiveApis } = useRuntimeStore()

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
      toast.success('Prototype updated successfully')
      return updatedPrototype
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to update prototype'
      toast.error(errorMsg)
      throw err
    }
  }, [prototype_id])

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

    // Wishlist API operations
    createWishlistApi: handleCreateWishlistApi,
    updateWishlistApi: handleUpdateWishlistApi,
    deleteWishlistApi: handleDeleteWishlistApi,
    getWishlistApi: model_id ? handleGetWishlistApi : undefined,
    listWishlistApis: model_id ? handleListWishlistApis : undefined,
  }

  // Log when component mounts/remounts
  useEffect(() => {
    return () => {}
  }, [])

  useEffect(() => {
    let cancelled = false
    const log = (..._args: any[]) => {}

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
        const GLOBAL_KEY = 'page-plugin'
        const registerTimeoutMs = 5000
        log('Plugin URL:', PLUGIN_URL)

        // Step 2: Ensure global dependencies (React, ReactDOM)
        log('Ensuring global dependencies')
        if (!(window as any).React) {
          const ReactMod = await import('react')
          ;(window as any).React = (ReactMod as any).default || ReactMod
          log('React attached to window')
        }
        if (!(window as any).ReactDOM) {
          const ReactDOMClient = await import('react-dom/client')
          ;(window as any).ReactDOM = ReactDOMClient
          log('ReactDOM attached to window')
        }
        if (!(window as any).require) {
          const ReactMod = await import('react')
          const ReactDOMMod = await import('react-dom/client')
          const JSXRuntime = await import('react/jsx-runtime')

          const requireShim = function(id: string) {
            if (id === 'react') return ReactMod
            if (id === 'react-dom/client') return ReactDOMMod
            if (id === 'react/jsx-runtime') return JSXRuntime
            throw new Error(`Module ${id} not found`)
          }

          ;(window as any).require = requireShim
          ;(globalThis as any).require = requireShim
          log('require() shim added')
        }
        if (cancelled) return

        // Step 3: Load plugin script and wait for global registration under a fixed key
        async function injectAndWait(asModule: boolean): Promise<any> {
          // Use the original URL without cache-busting to allow preloaded cache to be used
          const script = document.createElement('script')
          script.src = PLUGIN_URL
          script.async = true
          script.defer = true
          script.crossOrigin = 'anonymous'
          if (asModule) script.type = 'module'
          await new Promise<void>((resolve, reject) => {
            script.onload = () => resolve()
            script.onerror = () => reject(new Error('Failed to load plugin script'))
            document.body.appendChild(script)
          })
          const maxAttempts = Math.ceil(registerTimeoutMs / 100)
          let attempts = 0
          while (attempts < maxAttempts) {
            const obj = (window as any).DAPlugins?.[GLOBAL_KEY]
            if (obj) return obj
            await new Promise((r) => setTimeout(r, 100))
            attempts++
          }
          throw new Error(`Plugin did not register at window.DAPlugins['${GLOBAL_KEY}'] in ${registerTimeoutMs}ms`)
        }

        let pluginObj: any = null
        try {
          pluginObj = await injectAndWait(false)
        } catch (e1) {
          log('Classic script load failed or not registered in time, retrying as module')
          pluginObj = await injectAndWait(true)
        }

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

        if (cancelled) return

        setLoadedPluginName(GLOBAL_KEY)
        setPluginComponent(() => component)
        setLoading(false)
        log('Plugin ready to render for plugin_id:', plugin_id)

      } catch (e: any) {
        log('Error loading plugin:', e)
        if (!cancelled) {
          setError(e?.message || 'Failed to load plugin')
          setLoading(false)
        }
      }
    }

    loadPlugin()

    // Cleanup function
    return () => {
      cancelled = true
      log('Cleanup - unmounting global page-plugin if possible')
      try {
        const el = containerRef.current
        // Prefer plugin-provided unmount if it exists
        // @ts-ignore
        ;(window as any)?.DAPlugins?.['page-plugin']?.unmount?.(el)
      } catch {}
      setPluginComponent(null)
      setLoadedPluginName(null)
    }
  }, [plugin_id])

  // Only render the plugin component if it matches the current plugin_id
  const shouldRenderPlugin = !loading && !error && PluginComponent && loadedPluginName

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
