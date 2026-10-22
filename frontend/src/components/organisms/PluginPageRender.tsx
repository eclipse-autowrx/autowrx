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
import {
  updateModelService,
  getComputedAPIs,
  getApiDetailService,
  replaceAPIsService,
} from '@/services/model.service'
import config from '@/configs/config'
import { io } from 'socket.io-client'
import {
  listAssetsService,
  createAssetService,
  updateAssetService,
  deleteAssetService,
  shareMyAsset,
  removeUserFromShareList,
  getAssetById,
} from '@/services/asset.service'
import { searchUserByEmailService } from '@/services/search.service'
import {
  updatePrototypeService,
  countCodeExecution,
} from '@/services/prototype.service'
import { addLog } from '@/services/log.service'
import { listVSSVersionsService } from '@/services/api.service'
import { uploadFileService } from '@/services/upload.service'
import {
  createExtendedApi,
  updateExtendedApi,
  deleteExtendedApi,
  getExtendedApi,
  listExtendedApis,
} from '@/services/extendedApis.service'
import useRuntimeStore from '@/stores/runtimeStore'
import { configManagementService } from '@/services/configManagement.service'
import usePermissionHook from '@/hooks/usePermissionHook'
import useCanEditPrototype from '@/hooks/useCanEditPrototype'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import {
  parseReadFileReply,
  prepareKitFileContentForWrite,
} from '@/utils/kitReply'
import { PERMISSIONS } from '@/data/permission'
import {
  ensurePluginShims,
  getCachedPluginRegistration,
  loadPluginRegistration,
  GLOBAL_KEY,
} from '@/lib/pluginHost'
import SandboxedPluginFrame from '@/components/organisms/SandboxedPluginFrame'
import type { PluginAPI, PluginRuntimeState } from '@/types/plugin.types'
import type { Model, Prototype } from '@/types/model.type'
import type {
  CVI,
  VehicleAPI,
  VSSRelease,
  ExtendedApi,
  ExtendedApiCreate,
  ExtendedApiRet,
} from '@/types/api.type'
import type { List } from '@/types/common.type'
import { useSiteConfig } from '@/utils/siteConfig'

interface PluginPageRenderProps {
  plugin_id: string
  data?: any
  onSetActiveTab?: (tab: string, pluginSlug?: string) => void
  onNotifyTab?: (tab: string, pluginSlug?: string) => void
}

const PluginPageRender: React.FC<PluginPageRenderProps> = ({
  plugin_id,
  data,
  onSetActiveTab,
  onNotifyTab,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const injectedScriptRef = useRef<HTMLScriptElement | null>(null)
  const loadIdRef = useRef(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [PluginComponent, setPluginComponent] =
    useState<React.ComponentType<any> | null>(null)
  const [loadedPluginName, setLoadedPluginName] = useState<string | null>(null)
  const [untrustedPluginUrl, setUntrustedPluginUrl] = useState<string | null>(
    null,
  )
  const [siteConfigs, setSiteConfigs] = useState<{
    public: Record<string, any>
  }>({ public: {} })
  const [pluginMetaConfig, setPluginMetaConfig] = useState<Record<string, any>>(
    {},
  )
  const runtimeServerUrl = useSiteConfig(
    'RUNTIME_SERVER_URL',
    config?.runtime?.url,
  )

  // NewPrototypeLayout uses id "preview-template" as a synthetic model when
  // previewing a template with no real model. That sentinel is not a Mongo
  // ObjectId — do not send it to /permissions/has-permission.
  const rawModelId = data?.model?.id as string | undefined
  const isPreviewTemplate = rawModelId === 'preview-template'
  const model_id = isPreviewTemplate ? undefined : rawModelId
  const prototype_id = data?.prototype?.id

  const writeModelPermission: [string, string?][] = isPreviewTemplate
    ? []
    : [[PERMISSIONS.WRITE_MODEL, model_id]]
  const [isAuthorized = false] = usePermissionHook(...writeModelPermission)
  const canEditPrototype = useCanEditPrototype(data?.prototype)
  const { data: currentUser } = useSelfProfileQuery()

  // Access runtime store for API values
  const { apisValue, setActiveApis } = useRuntimeStore()
  const queryClient = useQueryClient()

  // Create API callbacks for plugin to interact with host
  const handleUpdateModel = useCallback(
    async (updates: Partial<Model>): Promise<Model> => {
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
    },
    [model_id],
  )

  const handleUpdatePrototype = useCallback(
    async (
      updates: Partial<Prototype>,
      options?: { silent?: boolean },
    ): Promise<Prototype> => {
      const { silent = false } = options ?? {}
      if (!prototype_id) {
        const errorMsg =
          'Cannot update prototype: prototype_id not available in data'
        toast.error(errorMsg)
        throw new Error(errorMsg)
      }
      try {
        const updatedPrototype = await updatePrototypeService(
          prototype_id,
          updates,
        )
        // Invalidate React Query cache so parent re-fetches and passes fresh data.prototype to the plugin
        await queryClient.invalidateQueries({
          queryKey: ['prototype', prototype_id],
        })
        if (!silent) {
          toast.success('Prototype updated successfully')
        }
        return updatedPrototype
      } catch (err: any) {
        const errorMsg = err?.message || 'Failed to update prototype'
        toast.error(errorMsg)
        throw err
      }
    },
    [prototype_id, queryClient],
  )

  // Vehicle API operations (read-only)
  const handleGetComputedAPIs = useCallback(
    async (targetModelId?: string): Promise<CVI> => {
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
    },
    [model_id],
  )

  const handleGetApiDetail = useCallback(
    async (api_name: string, targetModelId?: string): Promise<VehicleAPI> => {
      const modelIdToUse = targetModelId || model_id
      if (!modelIdToUse) {
        const errorMsg = 'Cannot get API detail: model_id not available'
        toast.error(errorMsg)
        throw new Error(errorMsg)
      }
      try {
        return await getApiDetailService(modelIdToUse, api_name)
      } catch (err: any) {
        const errorMsg =
          err?.message || `Failed to get API detail for ${api_name}`
        toast.error(errorMsg)
        throw err
      }
    },
    [model_id],
  )

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
  const handleReplaceAPIs = useCallback(
    async (api_data_url: string, targetModelId?: string): Promise<void> => {
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
    },
    [model_id],
  )

  const handleSetRuntimeApiValues = useCallback(
    (values: Record<string, any>): void => {
      try {
        setActiveApis(values)
        toast.success('Runtime API values updated')
      } catch (err: any) {
        const errorMsg = err?.message || 'Failed to set runtime API values'
        toast.error(errorMsg)
        throw err
      }
    },
    [setActiveApis],
  )

  const handleGetRuntimeApiValues = useCallback((): Record<string, any> => {
    return (apisValue as Record<string, any>) || {}
  }, [apisValue])

  // Wishlist API operations
  const handleCreateWishlistApi = useCallback(
    async (data: ExtendedApiCreate): Promise<ExtendedApiRet> => {
      try {
        const result = await createExtendedApi(data)
        toast.success('Wishlist API created successfully')
        return result
      } catch (err: any) {
        const errorMsg = err?.message || 'Failed to create wishlist API'
        toast.error(errorMsg)
        throw err
      }
    },
    [],
  )

  const handleUpdateWishlistApi = useCallback(
    async (
      id: string,
      data: Partial<ExtendedApiCreate>,
    ): Promise<Partial<ExtendedApiCreate>> => {
      try {
        const result = await updateExtendedApi(data, id)
        toast.success('Wishlist API updated successfully')
        return result
      } catch (err: any) {
        const errorMsg = err?.message || 'Failed to update wishlist API'
        toast.error(errorMsg)
        throw err
      }
    },
    [],
  )

  const handleDeleteWishlistApi = useCallback(
    async (id: string): Promise<void> => {
      try {
        await deleteExtendedApi(id)
        toast.success('Wishlist API deleted successfully')
      } catch (err: any) {
        const errorMsg = err?.message || 'Failed to delete wishlist API'
        toast.error(errorMsg)
        throw err
      }
    },
    [],
  )

  const handleGetWishlistApi = useCallback(
    async (name: string, targetModelId?: string): Promise<ExtendedApi> => {
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
    },
    [model_id],
  )

  const handleListWishlistApis = useCallback(
    async (targetModelId?: string): Promise<List<ExtendedApi>> => {
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
    },
    [model_id],
  )

  // Asset operations
  const handleListAssets = useCallback(
    async (params?: { type?: string | string[]; name?: string }) => {
      try {
        return await listAssetsService(params)
      } catch (err: any) {
        const errorMsg = err?.message || 'Failed to list assets'
        toast.error(errorMsg)
        throw err
      }
    },
    [],
  )

  const handleUpdateAsset = useCallback(
    async (
      assetId: string,
      payload: { name?: string; type?: string; data?: string },
    ) => {
      try {
        return await updateAssetService(assetId, payload)
      } catch (err: any) {
        const errorMsg = err?.message || 'Failed to update asset'
        toast.error(errorMsg)
        throw err
      }
    },
    [],
  )

  const handleCreateAsset = useCallback(
    async (payload: { name: string; type: string; data?: string }) => {
      try {
        return await createAssetService({
          name: payload.name,
          type: payload.type,
          data: payload.data ?? '',
        })
      } catch (err: any) {
        const errorMsg = err?.message || 'Failed to create asset'
        toast.error(errorMsg)
        throw err
      }
    },
    [],
  )

  const handleDeleteAsset = useCallback(
    async (assetId: string): Promise<void> => {
      try {
        await deleteAssetService(assetId)
      } catch (err: any) {
        const errorMsg = err?.message || 'Failed to delete asset'
        toast.error(errorMsg)
        throw err
      }
    },
    [],
  )

  const handleSearchUserByEmail = useCallback(async (email: string) => {
    try {
      return await searchUserByEmailService(email)
    } catch {
      return null
    }
  }, [])

  const handleGetAssetUsers = useCallback(async (assetId: string) => {
    try {
      const asset = await getAssetById(assetId)
      return asset?.readAccessUsers ?? []
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to load asset users'
      toast.error(errorMsg)
      throw err
    }
  }, [])

  const handleShareAsset = useCallback(
    async (assetId: string, userId: string): Promise<void> => {
      try {
        await shareMyAsset(assetId, { userId, role: 'read_asset' })
      } catch (err: any) {
        const errorMsg = err?.message || 'Failed to share asset'
        toast.error(errorMsg)
        throw err
      }
    },
    [],
  )

  const handleRemoveAssetAccess = useCallback(
    async (assetId: string, userId: string): Promise<void> => {
      try {
        await removeUserFromShareList(assetId, userId, 'read_asset')
      } catch (err: any) {
        const errorMsg = err?.message || 'Failed to remove asset access'
        toast.error(errorMsg)
        throw err
      }
    },
    [],
  )

  // File operations
  const handleUploadFile = useCallback(
    async (file: File): Promise<{ url: string }> => {
      try {
        const result = await uploadFileService(file)
        return result
      } catch (err: any) {
        const errorMsg = err?.message || 'Failed to upload file'
        toast.error(errorMsg)
        throw err
      }
    },
    [],
  )

  // Kit / Runtime operations
  const SIGNAL_CONFIG_PATH =
    config.runtime?.signalConfigPath || '/app/remote_access/signal-config.json'
  const VSS_PATH = config.runtime?.vssPath || '/app/remote_access/vss.json'
  const KIT_SERVER_URL =
    runtimeServerUrl || config.runtime?.url || 'https://kit.digitalauto.tech'
  // Name/id only — Kit-Manager exposes CLIENTS via public GET /listAllClient
  const kitRegisterPayload = {
    username: currentUser?.name || 'plugin',
    user_id: currentUser?.id || 'plugin',
    domain: 'domain',
  }
  const handleFetchSignalMapping = useCallback(
    (kitName: string): Promise<string> => {
      return new Promise((resolve, reject) => {
        const socket = io(KIT_SERVER_URL)
        const kitId = kitName
        let settled = false

        const finish = (fn: () => void) => {
          if (settled) return
          settled = true
          socket.disconnect()
          fn()
        }

        const timeout = setTimeout(() => {
          finish(() =>
            reject(
              new Error('Timeout: no response from device within 10 seconds'),
            ),
          )
        }, 10000)

        socket.on('connect', () => {
          socket.emit('register_client', kitRegisterPayload)
          socket.emit('messageToKit', {
            cmd: 'read-file',
            to_kit_id: kitId,
            data: '',
            file_path: SIGNAL_CONFIG_PATH,
            prototype: {
              name: data?.prototype?.name || 'no-name',
              id: prototype_id || 'no-id',
            },
            username: currentUser?.name || 'no',
          })
        })

        socket.on('messageToKit-kitReply', (payload: any) => {
          if (payload?.cmd === 'read-file') {
            const reply = parseReadFileReply(payload)
            if (!reply) return
            clearTimeout(timeout)
            if (reply.hasError) {
              finish(() => reject(new Error(reply.error || 'Read file failed')))
              return
            }
            finish(() => resolve(reply.content))
          }
        })

        socket.on('connect_error', (err: Error) => {
          clearTimeout(timeout)
          finish(() => reject(new Error(`Connection failed: ${err.message}`)))
        })
      })
    },
    [
      KIT_SERVER_URL,
      data?.prototype?.name,
      prototype_id,
      currentUser?.id,
      currentUser?.email,
      currentUser?.name,
    ],
  )

  const handleFetchVss = useCallback(
    (kitName: string): Promise<string> => {
      return new Promise((resolve, reject) => {
        const socket = io(KIT_SERVER_URL)
        const kitId = kitName
        let settled = false

        const finish = (fn: () => void) => {
          if (settled) return
          settled = true
          socket.disconnect()
          fn()
        }

        const timeout = setTimeout(() => {
          finish(() =>
            reject(
              new Error('Timeout: no response from device within 10 seconds'),
            ),
          )
        }, 10000)

        socket.on('connect', () => {
          socket.emit('register_client', kitRegisterPayload)
          socket.emit('messageToKit', {
            cmd: 'read-file',
            to_kit_id: kitId,
            data: '',
            file_path: VSS_PATH,
            prototype: {
              name: data?.prototype?.name || 'no-name',
              id: prototype_id || 'no-id',
            },
            username: currentUser?.name || 'no',
          })
        })

        socket.on('messageToKit-kitReply', (payload: any) => {
          if (payload?.cmd === 'read-file') {
            const reply = parseReadFileReply(payload)
            if (!reply) return
            clearTimeout(timeout)
            if (reply.hasError) {
              finish(() => reject(new Error(reply.error || 'Read file failed')))
              return
            }
            finish(() => resolve(reply.content))
          }
        })

        socket.on('connect_error', (err: Error) => {
          clearTimeout(timeout)
          finish(() => reject(new Error(`Connection failed: ${err.message}`)))
        })
      })
    },
    [
      KIT_SERVER_URL,
      data?.prototype?.name,
      prototype_id,
      currentUser?.id,
      currentUser?.email,
      currentUser?.name,
    ],
  )

  const handleReplaceVss = useCallback(
    (kitName: string, vssContent: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const socket = io(KIT_SERVER_URL)
        const kitId = kitName
        let settled = false

        const finish = (fn: () => void) => {
          if (settled) return
          settled = true
          socket.disconnect()
          fn()
        }

        socket.on('connect', () => {
          socket.emit('register_client', kitRegisterPayload)
          socket.emit('messageToKit', {
            cmd: 'write-file',
            to_kit_id: kitId,
            prototype: {
              name: data?.prototype?.name || 'no-name',
              id: prototype_id || 'no-id',
            },
            username: currentUser?.name || 'no',
            file_path: VSS_PATH,
            file_content: prepareKitFileContentForWrite(vssContent),
            data: '',
          })
          setTimeout(() => {
            socket.emit('messageToKit', {
              cmd: 'generate_vehicle_model',
              to_kit_id: kitId,
              data: vssContent,
            })
            finish(() => resolve())
          }, 3000)
        })

        socket.on('connect_error', (err: Error) => {
          finish(() => reject(new Error(`Connection failed: ${err.message}`)))
        })
      })
    },
    [
      KIT_SERVER_URL,
      data?.prototype?.name,
      prototype_id,
      currentUser?.id,
      currentUser?.email,
      currentUser?.name,
    ],
  )

  const handleReplaceSignalMapping = useCallback(
    async (kitName: string, fileContent: string): Promise<void> => {
      if (!model_id) throw new Error('No model available for VSS upload')

      return new Promise((resolve, reject) => {
        const socket = io(KIT_SERVER_URL)
        const kitId = kitName
        let settled = false

        const finish = (fn: () => void) => {
          if (settled) return
          settled = true
          socket.disconnect()
          fn()
        }

        socket.on('connect', async () => {
          try {
            socket.emit('register_client', kitRegisterPayload)

            // 1. Write signal mapping
            socket.emit('messageToKit', {
              cmd: 'write-file',
              to_kit_id: kitId,
              prototype: {
                name: data?.prototype?.name || 'no-name',
                id: prototype_id || 'no-id',
              },
              username: currentUser?.name || 'no',
              file_path: SIGNAL_CONFIG_PATH,
              file_content: prepareKitFileContentForWrite(fileContent),
              data: '',
            })

            // 2. Fetch current model's VSS and write it
            const vssData = await getComputedAPIs(model_id)
            const vssJson = JSON.stringify(vssData)

            socket.emit('messageToKit', {
              cmd: 'write-file',
              to_kit_id: kitId,
              prototype: {
                name: data?.prototype?.name || 'no-name',
                id: prototype_id || 'no-id',
              },
              username: currentUser?.name || 'no',
              file_path: VSS_PATH,
              file_content: prepareKitFileContentForWrite(vssJson),
              data: '',
            })

            // 3. Trigger vehicle model rebuild after 3s (mirrors original implementation)
            setTimeout(() => {
              socket.emit('messageToKit', {
                cmd: 'generate_vehicle_model',
                to_kit_id: kitId,
                data: vssJson,
              })
              finish(() => resolve())
            }, 3000)
          } catch (err: any) {
            finish(() => reject(err))
          }
        })

        socket.on('connect_error', (err: Error) => {
          finish(() => reject(new Error(`Connection failed: ${err.message}`)))
        })
      })
    },
    [
      model_id,
      KIT_SERVER_URL,
      data?.prototype?.name,
      prototype_id,
      currentUser?.id,
      currentUser?.email,
      currentUser?.name,
    ],
  )

  const handleSetActiveTab = useCallback(
    (targetTab: string, targetPluginSlug?: string) => {
      if (!onSetActiveTab) return

      if (model_id && prototype_id) {
        const prototypeDetailPath = `/model/${model_id}/library/prototype/${prototype_id}`
        const pathname = window.location.pathname
        const isOnPrototypeDetail = pathname.startsWith(prototypeDetailPath)
        const isOnNewPrototypeFlow =
          pathname === '/new-prototype' ||
          pathname.startsWith('/new-prototype/')

        if (!isOnPrototypeDetail && !isOnNewPrototypeFlow) return
      }

      onSetActiveTab(targetTab, targetPluginSlug)
    },
    [onSetActiveTab, model_id, prototype_id],
  )

  // Runtime bridge - lets a runtime panel plugin drive the dashboard like DaRuntimeControl does
  const handleSetRuntimeState = useCallback(
    (state: Partial<PluginRuntimeState>): void => {
      if (!state) return
      const store = useRuntimeStore.getState()
      if ('apisValue' in state) store.setActiveApis(state.apisValue)
      if ('traceVars' in state) store.setTraceVars(state.traceVars)
      if ('appLog' in state) store.setAppLog(state.appLog || '')
      if ('isAppRunning' in state) store.setIsAppRunning(!!state.isAppRunning)
      if ('activeRuntimeName' in state)
        store.setActiveRuntimeName(state.activeRuntimeName)
      if ('isRuntimeBusyByOther' in state)
        store.setIsRuntimeBusyByOther(!!state.isRuntimeBusyByOther)
    },
    [],
  )

  const handleGetRuntimeState = useCallback((): PluginRuntimeState => {
    const { apisValue, traceVars, appLog, isAppRunning, activeRuntimeName } =
      useRuntimeStore.getState()
    return {
      apisValue: (apisValue as Record<string, any>) || {},
      traceVars: (traceVars as Record<string, any>) || {},
      appLog: appLog || '',
      isAppRunning,
      activeRuntimeName,
    }
  }, [])

  const handleOnWidgetSignalWrite = useCallback(
    (callback: (values: Record<string, any>) => void): (() => void) => {
      const listener = (e: MessageEvent) => {
        if (!e.data || typeof e.data !== 'string') return
        try {
          const payload = JSON.parse(e.data)
          if (payload.cmd === 'set-api-value' && payload.api) {
            callback({ [`${payload.api}`]: payload.value })
          }
        } catch (err) {
          // Silent fail for invalid JSON
        }
      }
      window.addEventListener('message', listener)
      return () => window.removeEventListener('message', listener)
    },
    [],
  )

  const handleNotifyWidgets = useCallback((message: any): void => {
    document.querySelectorAll('iframe').forEach((iframe) => {
      iframe.contentWindow?.postMessage(JSON.stringify(message), '*')
    })
  }, [])

  const handleRemountWidgets = useCallback((): void => {
    useRuntimeStore.getState().incrementRemountCountByRuntime()
  }, [])

  const handleReportPrototypeRun = useCallback((): void => {
    const prototype = data?.prototype
    if (!prototype?.id) return
    const userId = currentUser?.id || 'Anonymous'
    addLog({
      name: `User ${userId} run prototype`,
      description: `User ${userId} run prototype ${prototype.name || 'Unknown'} with id ${prototype.id}`,
      type: 'run-prototype',
      create_by: userId,
    })
    countCodeExecution(prototype.id)
  }, [data?.prototype, currentUser?.id])

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
    setRuntimeState: handleSetRuntimeState,
    getRuntimeState: handleGetRuntimeState,
    onWidgetSignalWrite: handleOnWidgetSignalWrite,
    notifyWidgets: handleNotifyWidgets,
    reportPrototypeRun: prototype_id ? handleReportPrototypeRun : undefined,
    remountWidgets: handleRemountWidgets,

    // Navigation
    setActiveTab: onSetActiveTab ? handleSetActiveTab : undefined,
    notifyTab: onNotifyTab,

    // Wishlist API operations
    createWishlistApi: handleCreateWishlistApi,
    updateWishlistApi: handleUpdateWishlistApi,
    deleteWishlistApi: handleDeleteWishlistApi,
    getWishlistApi: model_id ? handleGetWishlistApi : undefined,
    listWishlistApis: model_id ? handleListWishlistApis : undefined,

    // Asset operations
    listAssets: handleListAssets,
    createAsset: handleCreateAsset,
    updateAsset: handleUpdateAsset,
    deleteAsset: handleDeleteAsset,
    searchUserByEmail: handleSearchUserByEmail,
    getAssetUsers: handleGetAssetUsers,
    shareAsset: handleShareAsset,
    removeAssetAccess: handleRemoveAssetAccess,

    // File operations
    uploadFile: handleUploadFile,

    // Kit / Runtime operations
    fetchSignalMapping: handleFetchSignalMapping,
    replaceSignalMapping: model_id ? handleReplaceSignalMapping : undefined,
    fetchVss: handleFetchVss,
    replaceVss: handleReplaceVss,
  }

  // Fetch public site configs only — never expose secrets to plugins
  useEffect(() => {
    configManagementService
      .getPublicConfigs('site')
      .then((publicConfigs) => {
        setSiteConfigs({ public: publicConfigs })
      })
      .catch((err) => {
        console.error('Failed to fetch site configs for plugin:', err)
      })
  }, [])

  // Log when component mounts/remounts
  useEffect(() => {
    return () => {}
  }, [])

  useEffect(() => {
    let cancelled = false
    loadIdRef.current += 1
    const myLoadId = loadIdRef.current
    const log = (..._args: any[]) => {}

    const loadPlugin = async () => {
      try {
        setLoading(true)
        setError(null)
        setPluginComponent(null)
        setLoadedPluginName(null)
        setPluginMetaConfig({})

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

        setPluginMetaConfig(
          pluginMeta.config &&
            typeof pluginMeta.config === 'object' &&
            !Array.isArray(pluginMeta.config)
            ? pluginMeta.config
            : {},
        )

        // Tiered trust: only admin-created plugins run same-origin. Everything
        // else (flag missing => untrusted, fail closed) is loaded in the sandbox.
        if (pluginMeta.is_trusted !== true) {
          if (cancelled || myLoadId !== loadIdRef.current) return
          setLoadedPluginName(plugin_id)
          setUntrustedPluginUrl(pluginMeta.url)
          setLoading(false)
          return
        }

        const PLUGIN_URL = pluginMeta.url
        log('Plugin URL:', PLUGIN_URL)

        // Step 2: Ensure global dependencies (React, ReactDOM) - MUST be available BEFORE script executes
        log('Ensuring global dependencies')
        await ensurePluginShims()
        if (cancelled) return

        // Step 3: Load plugin script and wait for global registration under a fixed key.
        // Since components now stay mounted (show/hide), we don't need versioning - use base URL for proper caching.
        // IMPORTANT: All plugins register under the same 'page-plugin' key, so we intercept and store per plugin_id

        // Check if this plugin is already registered in our map
        const existingRegistration = getCachedPluginRegistration(plugin_id)
        if (existingRegistration) {
          // Registration exists for this plugin_id - use it directly (instant, no re-injection needed)
          log('Reusing cached plugin registration for plugin_id:', plugin_id)
          const component = existingRegistration?.components?.Page || null
          if (component || existingRegistration?.mount) {
            if (cancelled || myLoadId !== loadIdRef.current) return
            setLoadedPluginName(plugin_id)
            setPluginComponent(
              () =>
                component ||
                (() => {
                  const mountFn = existingRegistration.mount
                  const unmountFn = existingRegistration.unmount
                  const Wrapper: React.FC<any> = (props) => {
                    const ref = React.useRef<HTMLDivElement | null>(null)
                    React.useEffect(() => {
                      if (ref.current) {
                        try {
                          mountFn(ref.current, props)
                        } catch (e) {
                          console.error(
                            `[plugin-render:${plugin_id}] mount error`,
                            e,
                          )
                        }
                      }
                      return () => {
                        try {
                          unmountFn?.(ref.current)
                        } catch (e) {
                          console.error(
                            `[plugin-render:${plugin_id}] unmount error`,
                            e,
                          )
                        }
                      }
                    }, [props])
                    return <div ref={ref} className="w-full h-full" />
                  }
                  return Wrapper
                })(),
            )
            setLoading(false)
            return // Skip injection, use cached registration
          }
        }

        // Map this URL to plugin_id so we can match registrations even when multiple plugins load simultaneously
        const { registration: pluginObj } = await loadPluginRegistration({
          pluginId: plugin_id,
          pluginUrl: PLUGIN_URL,
          onScriptInjected: (scriptEl) => {
            injectedScriptRef.current = scriptEl
          },
          isCancelled: () => cancelled,
        })
        if (cancelled || pluginObj == null) return

        let component: React.ComponentType<any> | null =
          pluginObj?.components?.Page || null
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
          throw new Error(
            `window.DAPlugins['${GLOBAL_KEY}'] has no components.Page or mount() function`,
          )
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
      // Note: for mount()/unmount()-style plugins, the `Wrapper` component (see
      // above) owns calling unmount() on the exact node it mounted into, as part
      // of its own useEffect cleanup. Calling registration.unmount() again here
      // against containerRef.current (a different, outer, React-managed node)
      // raced with React's own unmount of that subtree and could remove DOM
      // nodes out from under React, causing an intermittent
      // "Failed to execute 'removeChild'" error when switching tabs.
      if (injectedScriptRef.current?.parentNode) {
        injectedScriptRef.current.remove()
      }
      injectedScriptRef.current = null
      // Don't clear pluginRegistrations - keep registrations in map for reuse
      setPluginComponent(null)
      setLoadedPluginName(null)
      setUntrustedPluginUrl(null)
    }
  }, [plugin_id])

  // Only render when we have a component and it was loaded for this exact plugin_id (deep check)
  const shouldRenderPlugin =
    !loading && !error && !!PluginComponent && loadedPluginName === plugin_id
  const pluginConfig = {
    plugin_id: loadedPluginName,
    ...siteConfigs,
    ...pluginMetaConfig,
  }

  // Log what we're about to render
  useEffect(() => {}, [shouldRenderPlugin, loadedPluginName, plugin_id])

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
        <div
          key={`plugin-${plugin_id}-${loadedPluginName}`}
          className="w-full h-full"
        >
          <PluginComponent
            data={data}
            editable={canEditPrototype}
            config={pluginConfig}
            api={pluginAPI}
          />
        </div>
      )}

      {!loading && !error && untrustedPluginUrl && (
        <div key={`sandboxed-plugin-${plugin_id}`} className="w-full h-full">
          <SandboxedPluginFrame
            pluginUrl={untrustedPluginUrl}
            api={pluginAPI}
            data={data}
            editable={canEditPrototype}
            config={pluginConfig}
          />
        </div>
      )}

      {!loading && !error && !PluginComponent && !untrustedPluginUrl && (
        <div className="flex flex-col items-center justify-center w-full h-full gap-4">
          <p className="text-base text-destructive">
            Plugin component not found
          </p>
        </div>
      )}
    </div>
  )
}

export default PluginPageRender
