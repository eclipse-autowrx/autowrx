// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import * as React from 'react'
import { ModelLite } from '@/types/model.type'
import { getModelStatsByIds } from '@/services/model.service'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/atoms/tooltip'
import { Link } from 'react-router-dom'
import { TbAffiliate, TbCode, TbUsers } from 'react-icons/tb'
import { cn } from '@/lib/utils'

interface DaModelItemProps {
  model: Partial<ModelLite>
  className?: string
}

type ModelStats = NonNullable<ModelLite['stats']>

const modelStatsMemo = new Map<string, ModelStats>()

// Batch stats requests across multiple DaModelItem instances.
// Key idea: each visible card enqueues its `modelId`, then a single debounced
// request fetches stats for the whole queue (instead of N+1 requests).
const modelStatsPromises = new Map<string, Promise<ModelStats | undefined>>()
const modelStatsResolvers = new Map<string, (value: ModelStats | undefined) => void>()

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
  } catch (e) {
    // On error, resolve promises as `undefined` so UI won't be stuck.
    ids.forEach((id) => {
      const resolve = modelStatsResolvers.get(id)
      if (resolve) resolve(undefined)

      modelStatsPromises.delete(id)
      modelStatsResolvers.delete(id)
    })
  } finally {
    isBatchInFlight = false

    // If something was enqueued during the in-flight request, schedule another flush.
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

const DaModelItem = React.memo(({ model, className }: DaModelItemProps) => {
  const rootRef = React.useRef<HTMLDivElement | null>(null)
  const modelId = model?.id

  const [lazyStats, setLazyStats] = React.useState<ModelStats | undefined>(model?.stats)

  React.useEffect(() => {
    // If the parent already has stats (e.g. prefetch or cache), sync local state.
    setLazyStats(model?.stats)
  }, [modelId, model?.stats])

  const requestStats = React.useCallback(async () => {
    if (!modelId) return
    const result = await enqueueModelStats(modelId)
    setLazyStats(result)
  }, [modelId])

  React.useEffect(() => {
    // If we already have stats, or modelId missing, no need to lazy fetch.
    if (!modelId) return
    if (lazyStats) return
    if (!rootRef.current) return

    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
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
  }, [modelId, lazyStats])

  const stats = lazyStats
  const contributorsCount = stats?.collaboration?.contributors?.count ?? 0
  const membersCount = stats?.collaboration?.members?.count ?? 0
  const totalCount = contributorsCount + membersCount
  const hasStats = Boolean(stats)

  return (
    <div
      ref={rootRef}
      className={cn(
        'lg:w-full lg:h-full group bg-background rounded-lg cursor-pointer',
        className,
      )}
      id={model?.id ?? ''}
    >
      <div className="flex flex-col items-center space-y-1 text-muted-foreground overflow-hidden">
        <div className="flex w-full h-full relative overflow-hidden rounded-lg">
          <img
            src={
              model?.model_home_image_file
                ? model.model_home_image_file
                : '/imgs/default_prototype_cover.jpg'
            }
            alt={model?.name || 'Model image'}
            className="w-full h-full rounded-lg aspect-video object-cover shadow border"
            loading="lazy"
          />
          <div className="absolute bottom-0 w-full h-[30px] p-[1px] blur-xl bg-black/80 transition-opacity duration-200 ease-in-out opacity-0 group-hover:opacity-100"></div>
          <div className="absolute bottom-0 w-full h-[50px] p-[1px] transition-opacity duration-200 ease-in-out opacity-0 group-hover:opacity-100">
            <div className="flex h-full w-full px-3 items-center justify-between text-white rounded-b-lg ">
              <div className="flex w-fit justify-end items-center gap-2 ml-2">
                COVESA VSS {model.api_version}
              </div>
              <div className="grow"></div>
            </div>
          </div>
        </div>
        <div className="flex items-center w-full px-1 pt-0.5">
          <h3 className="text-base font-semibold line-clamp-1 text-foreground">
            {model?.name ?? ''}
          </h3>
          <div className="grow"></div>
          <div className="flex text-sm items-center gap-3">
            <TooltipProvider>
              {totalCount > 0 && (
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <div className="flex items-center font-semibold ">
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
                    <div className="flex items-center font-semibold ">
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
          </div>
        </div>
      </div>
    </div>
  )
})

DaModelItem.displayName = 'DaModelItem'

export default DaModelItem
