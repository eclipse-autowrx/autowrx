// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import * as React from 'react'
import { ModelLite } from '@/types/model.type'
import {
  getModelStatsByIds,
  updateModelService,
  getComputedAPIs,
} from '@/services/model.service'
import { uploadFileService } from '@/services/upload.service'
import { downloadModelZip } from '@/lib/zipUtils'
import DaImportFile from '@/components/atoms/DaImportFile'
import { TbLoader } from 'react-icons/tb'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/atoms/tooltip'
import {
  TbAffiliate,
  TbApi,
  TbCode,
  TbDotsVertical,
  TbDownload,
  TbEdit,
  TbHistoryToggle,
  TbPhotoEdit,
  TbTrashX,
  TbUsers,
} from 'react-icons/tb'
import { HiPlus } from 'react-icons/hi'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/atoms/context-menu'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import usePermissionHook from '@/hooks/usePermissionHook'
import { PERMISSIONS } from '@/data/permission'
import { useDefaultModelImage } from '@/utils/siteConfig'
import { useToast } from '@/components/molecules/toaster/use-toast'
import { DaImage } from '@/components/atoms/DaImage'

export interface DaModelCardProps {
  model: Partial<ModelLite>
  className?: string
  variant?: 'default' | 'home'
  isDeleting?: boolean
  onAction?: (action: string, modelId: string) => void
}

type ModelStats = NonNullable<ModelLite['stats']>

const modelStatsMemo = new Map<string, ModelStats>()

const modelStatsPromises = new Map<string, Promise<ModelStats | undefined>>()
const modelStatsResolvers = new Map<
  string,
  (value: ModelStats | undefined) => void
>()

const pendingIds = new Set<string>()
let batchTimer: ReturnType<typeof setTimeout> | undefined
let isBatchInFlight = false

const STATS_DEBOUNCE_MS = 150
const MAX_BATCH_SIZE = 25

const flushStatsQueue = async () => {
  if (isBatchInFlight) return
  if (batchTimer) {
    clearTimeout(batchTimer)
    batchTimer = undefined
  }

  const ids = Array.from(pendingIds)
  pendingIds.clear()
  if (ids.length === 0) return

  isBatchInFlight = true
  try {
    const statsById = await getModelStatsByIds(ids)
    ids.forEach((id) => {
      const stats = statsById?.[id]
      if (stats) modelStatsMemo.set(id, stats)

      const resolve = modelStatsResolvers.get(id)
      if (resolve) resolve(stats)

      modelStatsPromises.delete(id)
      modelStatsResolvers.delete(id)
    })
  } catch {
    ids.forEach((id) => {
      const resolve = modelStatsResolvers.get(id)
      if (resolve) resolve(undefined)

      modelStatsPromises.delete(id)
      modelStatsResolvers.delete(id)
    })
  } finally {
    isBatchInFlight = false

    if (pendingIds.size > 0) {
      batchTimer = setTimeout(() => {
        void flushStatsQueue()
      }, STATS_DEBOUNCE_MS)
    }
  }
}

const enqueueModelStats = (id: string) => {
  const cached = modelStatsMemo.get(id)
  if (cached) return Promise.resolve(cached)

  const existing = modelStatsPromises.get(id)
  if (existing) return existing

  const p = new Promise<ModelStats | undefined>((resolve) => {
    modelStatsResolvers.set(id, resolve)
  })
  modelStatsPromises.set(id, p)
  pendingIds.add(id)

  if (pendingIds.size >= MAX_BATCH_SIZE) {
    void flushStatsQueue()
    return p
  }

  if (!batchTimer) {
    batchTimer = setTimeout(() => {
      void flushStatsQueue()
    }, STATS_DEBOUNCE_MS)
  }

  return p
}

export const DaModelCard = React.memo(
  ({
    model,
    className,
    variant = 'default',
    isDeleting = false,
    onAction,
  }: DaModelCardProps) => {
    const rootRef = React.useRef<HTMLDivElement | null>(null)
    const modelId = model?.id

    const { data: user } = useSelfProfileQuery()
    const defaultModelImage = useDefaultModelImage()
    const { toast } = useToast()
    const createdBy = model?.created_by as unknown as
      | string
      | { id?: string }
      | undefined
    const createdById =
      typeof createdBy === 'string' ? createdBy : createdBy?.id
    const isCreator = !!user && !!createdById && user.id === createdById
    const [hasWritePermission] = usePermissionHook([
      PERMISSIONS.WRITE_MODEL,
      model?.id,
    ])
    const isOwner = isCreator || hasWritePermission

    const [lazyStats, setLazyStats] = React.useState<ModelStats | undefined>(
      model?.stats,
    )

    React.useEffect(() => {
      setLazyStats(model?.stats)
    }, [modelId, model?.stats])

    const requestStats = React.useCallback(async () => {
      if (!modelId) return
      const result = await enqueueModelStats(modelId)
      setLazyStats(result)
    }, [modelId])

    React.useEffect(() => {
      if (variant !== 'default') return
      if (!modelId) return
      if (lazyStats) return
      if (!rootRef.current) return

      if (
        typeof window === 'undefined' ||
        !('IntersectionObserver' in window)
      ) {
        void requestStats()
        return
      }

      let isMounted = true
      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0]
          if (!entry?.isIntersecting) return
          observer.disconnect()
          void (async () => {
            const result = await enqueueModelStats(modelId)
            if (isMounted) setLazyStats(result)
          })()
        },
        {
          root: null,
          rootMargin: '200px 0px',
          threshold: 0.01,
        },
      )

      observer.observe(rootRef.current)
      return () => {
        isMounted = false
        observer.disconnect()
      }
    }, [modelId, lazyStats, requestStats, variant])

    const [isExporting, setIsExporting] = React.useState(false)
    const [isDownloading, setIsDownloading] = React.useState(false)
    const [isUploading, setIsUploading] = React.useState(false)
    const [dotsMenuOpen, setDotsMenuOpen] = React.useState(false)
    const suppressClickRef = React.useRef(false)
    const suppressTimeoutRef = React.useRef<ReturnType<typeof setTimeout>>()

    const runAfterMenuClose = React.useCallback((action: () => void) => {
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      )
      suppressClickRef.current = true
      clearTimeout(suppressTimeoutRef.current)
      suppressTimeoutRef.current = setTimeout(() => {
        suppressClickRef.current = false
      }, 200)
      window.setTimeout(action, 0)
    }, [])

    const runAfterDropdownClose = React.useCallback((action: () => void) => {
      setDotsMenuOpen(false)
      suppressClickRef.current = true
      clearTimeout(suppressTimeoutRef.current)
      suppressTimeoutRef.current = setTimeout(() => {
        suppressClickRef.current = false
      }, 200)
      window.setTimeout(action, 0)
    }, [])

    const handleImageFileChange = React.useCallback(
      async (file: File) => {
        if (!modelId) return
        document.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
        )
        setIsUploading(true)
        try {
          const { url } = await uploadFileService(file)
          await updateModelService(modelId, {
            model_home_image_file: url,
          } as any)
          onAction?.('imageUpdated', modelId)
        } catch (error) {
          console.error('Failed to update model image:', error)
        } finally {
          setIsUploading(false)
        }
      },
      [modelId, onAction],
    )

    const handleExport = React.useCallback(async () => {
      if (!model) return
      setIsExporting(true)
      try {
        await downloadModelZip(model as any)
      } catch (error) {
        console.error('Failed to export model:', error)
      } finally {
        setIsExporting(false)
      }
    }, [model])

    const handleDownload = React.useCallback(async () => {
      if (!modelId || !model?.name) return
      setIsDownloading(true)
      try {
        const data = await getComputedAPIs(modelId)
        const link = document.createElement('a')
        link.href = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 4))}`
        link.download = `${model.name}_vss.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } catch (error) {
        console.error('Failed to download signal data:', error)
      } finally {
        setIsDownloading(false)
      }
    }, [modelId, model?.name])

    const stats = lazyStats
    const contributorsCount = stats?.collaboration?.contributors?.count ?? 0
    const membersCount = stats?.collaboration?.members?.count ?? 0
    const totalCount = contributorsCount + membersCount
    const hasStats = Boolean(stats)

    const renderMenuItems = (
      MenuItem: React.ComponentType<any>,
      MenuSeparator: React.ComponentType<any>,
      wrapAction: (action: () => void) => void = (action) => action(),
    ) => (
      <>
        <MenuItem
          className="gap-2 cursor-pointer"
          onSelect={() =>
            wrapAction(() => onAction?.('rename', model?.id ?? ''))
          }
        >
          <TbEdit className="size-4" /> Rename
        </MenuItem>
        <MenuItem
          className="gap-2 cursor-pointer p-0!"
          onSelect={(e: Event) => e.preventDefault()}
        >
          <DaImportFile
            onFileChange={handleImageFileChange}
            accept=".png,.jpg,.jpeg"
            className="flex w-full items-center gap-2 px-2 py-1.5 text-sm cursor-pointer"
          >
            <TbPhotoEdit className="size-4 shrink-0" /> Update Image
          </DaImportFile>
        </MenuItem>
        <MenuSeparator />
        <MenuItem
          className="gap-2 cursor-pointer"
          disabled={isDownloading}
          onSelect={handleDownload}
        >
          {isDownloading ? (
            <TbLoader className="size-4 animate-spin" />
          ) : (
            <TbApi className="size-4" />
          )}
          {isDownloading ? 'Downloading Vehicle API...' : 'Download Vehicle API'}
        </MenuItem>
        <MenuItem
          className="gap-2 cursor-pointer"
          disabled={isExporting}
          onSelect={handleExport}
        >
          {isExporting ? (
            <TbLoader className="size-4 animate-spin" />
          ) : (
            <TbDownload className="size-4" />
          )}
          {isExporting ? 'Exporting...' : 'Export Model'}
        </MenuItem>
        <MenuItem
          className="gap-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
          onSelect={() =>
            wrapAction(() => onAction?.('delete', model?.id ?? ''))
          }
        >
          <TbTrashX className="size-4" /> Delete Model
        </MenuItem>
      </>
    )

    const cardContent = (
      <div
        ref={rootRef}
        className={cn(
          'lg:w-full lg:h-full group rounded-lg cursor-pointer bg-white p-3 border',
          className,
        )}
        id={model?.id ?? ''}
        aria-label={model?.name || 'Model'}
      >
        <div className="flex flex-col items-center space-y-1 text-muted-foreground overflow-hidden">
          <div className="flex w-full h-full relative overflow-hidden aspect-video rounded-lg">
            {(isUploading || isDeleting) && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-black/40">
                <TbLoader className="size-6 animate-spin text-white" />
              </div>
            )}
            <DaImage
              src={model?.model_home_image_file}
              fallbackSrc={defaultModelImage}
              alt={model?.name || 'Model image'}
              className="w-full h-full rounded-lg aspect-video object-cover"
            />
            <div className="absolute bottom-0 w-full h-[30px] blur-xl bg-black/80 transition-opacity duration-200 ease-in-out opacity-0 group-hover:opacity-100" />
            <div className="absolute bottom-0 w-full h-[50px] transition-opacity duration-200 ease-in-out opacity-0 group-hover:opacity-100">
              <div className="flex h-full w-full px-3 items-center justify-between text-white rounded-b-lg">
                <div className="flex w-fit justify-end items-center gap-2 ml-2">
                  COVESA VSS {model.api_version}
                </div>
                <div className="grow" />
              </div>
            </div>
          </div>
          <div className="flex items-center w-full pt-0.5">
            <h3 className="text-base font-semibold overflow-hidden text-ellipsis text-foreground whitespace-nowrap min-w-0">
              {model?.name ?? ''}
            </h3>
            <div className="grow" />
            <div className="flex text-sm items-center gap-3">
              {variant === 'home' ? (
                <div className="flex items-center gap-1">
                  <button
                    title="Add new Prototype"
                    type="button"
                    tabIndex={-1}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      onAction?.('add', model?.id ?? '')
                    }}
                    className="p-1 rounded-md shrink-0 cursor-pointer border border-transparent hover:border-[#7B838B] active:bg-gray-300 transition-all duration-150 focus-visible:outline-none"
                  >
                    <HiPlus className="size-4 text-[#7B838B]" />
                  </button>
                  <button
                    title="Open recently Prototype"
                    type="button"
                    tabIndex={-1}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      onAction?.('history', model?.id ?? '')
                    }}
                    className="p-1 rounded-md shrink-0 cursor-pointer border border-transparent hover:border-[#7B838B] active:bg-gray-300 transition-all duration-150 focus-visible:outline-none"
                  >
                    <TbHistoryToggle className="size-4 text-[#7B838B]" />
                  </button>
                  <DropdownMenu open={dotsMenuOpen} onOpenChange={setDotsMenuOpen}>
                    <DropdownMenuTrigger asChild disabled={!isOwner}>
                      <button
                        title="Menu"
                        type="button"
                        tabIndex={-1}
                        disabled={!isOwner}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                        className="p-1 rounded-md shrink-0 cursor-pointer border border-transparent hover:border-[#7B838B] active:bg-gray-300 transition-all duration-150 focus-visible:outline-none disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
                      >
                        <TbDotsVertical className="size-4 text-[#7B838B]" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-52"
                      align="end"
                      onClick={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      {renderMenuItems(
                        DropdownMenuItem,
                        DropdownMenuSeparator,
                        runAfterDropdownClose,
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <TooltipProvider>
                  {totalCount > 0 && (
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <div className="flex items-center font-semibold">
                          <TbUsers className="text-primary size-4 mr-1" />
                          {totalCount}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Contributors</p>
                      </TooltipContent>
                    </Tooltip>
                  )}

                  {hasStats && (
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <div className="flex items-center font-semibold">
                          <TbAffiliate className="text-primary size-4 mr-1" />
                          {stats?.apis?.used?.count || 0}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Utilized VSS Signals</p>
                      </TooltipContent>
                    </Tooltip>
                  )}

                  {hasStats && (
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <div className="flex items-center font-semibold">
                          <TbCode className="text-primary size-4 mr-1" />
                          {stats?.prototypes?.count || 0}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Prototypes</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </TooltipProvider>
              )}
            </div>
          </div>
        </div>
      </div>
    )

    if (!user) {
      return cardContent
    }

    return (
      <div
        className="overflow-hidden"
        onClick={(e) => {
          if (dotsMenuOpen || suppressClickRef.current) {
            e.stopPropagation()
          }
        }}
      >
        {isOwner ? (
          <ContextMenu>
            <ContextMenuTrigger asChild>{cardContent}</ContextMenuTrigger>
            <ContextMenuContent
              className="w-52"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              {renderMenuItems(
                ContextMenuItem,
                ContextMenuSeparator,
                runAfterMenuClose,
              )}
            </ContextMenuContent>
          </ContextMenu>
        ) : (
          <div
            onContextMenu={(e) => {
              e.preventDefault()
              toast({
                title: 'Permission denied',
                description: `You do not have permission to edit "${model?.name ?? 'this model'}".`,
                duration: 3000,
              })
            }}
          >
            {cardContent}
          </div>
        )}
      </div>
    )
  },
)

DaModelCard.displayName = 'DaModelCard'
