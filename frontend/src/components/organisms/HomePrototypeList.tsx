// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueries, useQuery } from '@tanstack/react-query'
import { Prototype } from '@/types/model.type'
import {
  listPrototypesPaged,
  listAllPrototypesFiltered,
  PROTOTYPE_LIST_CARD_FIELDS,
} from '@/services/prototype.service'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { useUrlQueryParam } from '@/hooks/useUrlQueryParam'
import {
  TbChevronLeft,
  TbChevronRight,
  TbInfoCircle,
} from 'react-icons/tb'
import { HiPlus } from 'react-icons/hi'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../atoms/tooltip'
import { Button } from '../atoms/button'
import DaFilter from '../atoms/DaFilter'
import DaDialog from '../molecules/DaDialog'
import useAuthStore from '@/stores/authStore'
import { DaPrototypeCard, DaPrototypeCardSkeleton } from '../molecules/DaPrototypeCard'
import { useAuthConfigs } from '@/hooks/useAuthConfigs'
import { cn } from '@/lib/utils'
import { sortPrototypesByViewed } from '@/utils/prototypeSort'
import { prototypeQueryKeys } from '@/hooks/usePrototypeQueries'

type HomePrototypeListProps = {
  requiredLogin?: boolean
  title?: string
}

type PrototypeSortOption =
  | 'newest'
  | 'oldest'
  | 'name-az'
  | 'name-za'
  | 'last-viewed'
  | 'first-viewed'

type PrototypeCategory = 'all' | 'mine'

const PROTOTYPE_CATEGORIES: readonly PrototypeCategory[] = ['all', 'mine']
const PROTOTYPE_SORT_OPTIONS: readonly PrototypeSortOption[] = [
  'newest',
  'oldest',
  'name-az',
  'name-za',
  'last-viewed',
  'first-viewed',
]

const SORT_LABELS: Record<PrototypeSortOption, string> = {
  newest: 'Newest',
  oldest: 'Oldest',
  'name-az': 'Name A-Z',
  'name-za': 'Name Z-A',
  'last-viewed': 'Last Viewed',
  'first-viewed': 'First Viewed',
}

const SORT_LABEL_TO_OPTION = Object.fromEntries(
  Object.entries(SORT_LABELS).map(([key, label]) => [label, key]),
) as Record<string, PrototypeSortOption>

const SORT_FILTER_OPTIONS = [
  'Last Viewed',
  'First Viewed',
  'Newest',
  'Oldest',
  'Name A-Z',
  'Name Z-A',
]

const SORT_BY_PARAM: Record<PrototypeSortOption, string> = {
  newest: 'createdAt:desc',
  oldest: 'createdAt:asc',
  'name-az': 'name:asc',
  'name-za': 'name:desc',
  'last-viewed': 'createdAt:desc',
  'first-viewed': 'createdAt:desc',
}

const SWIPE_THRESHOLD = 40
const SWIPE_LOCK_THRESHOLD = 8

function useItemsPerPage(): number {
  const getCount = () => {
    const w = window.innerWidth
    if (w >= 1280) return 5
    if (w >= 1024) return 3
    if (w >= 768) return 2
    return 1
  }
  const [count, setCount] = useState(getCount)
  useEffect(() => {
    const onResize = () => setCount(getCount())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return count
}

const HomePrototypeList = ({
  requiredLogin,
  title,
}: HomePrototypeListProps) => {
  const { data: user, isLoading: userLoading } = useSelfProfileQuery()
  const { authConfigs } = useAuthConfigs()
  const navigate = useNavigate()
  const itemsPerView = useItemsPerPage()
  // Advance a full page on every Next/Prev click so all items shown are new,
  // matching the behaviour of HomePrototypePopular.
  const pageStep = itemsPerView
  const [activeCategory, setActiveCategory] = useUrlQueryParam(
    'prototype-category',
    PROTOTYPE_CATEGORIES,
    'all',
  )
  const [sortBy, setSortBy] = useUrlQueryParam(
    'prototype-sort',
    PROTOTYPE_SORT_OPTIONS,
    'newest',
  )

  const [currentItemIndex, setCurrentItemIndex] = useState<number>(0)

  const [openRemindDialog, setOpenRemindDialog] = useState(false)
  const [selectedPrototype, setSelectedPrototype] = useState<Prototype | null>(
    null,
  )
  const [infoOpen, setInfoOpen] = useState(false)
  const { setOpenLoginDialog } = useAuthStore()

  useEffect(() => {
    if (!userLoading && !user && activeCategory === 'mine') {
      setActiveCategory('all')
    }
  }, [userLoading, user, activeCategory, setActiveCategory])

  useEffect(() => {
    setCurrentItemIndex(0)
  }, [itemsPerView, sortBy, activeCategory])

  const isClientViewSort =
    sortBy === 'last-viewed' || sortBy === 'first-viewed'

  const viewSortFilterParams = useMemo(
    () => ({
      category: activeCategory,
      fields: PROTOTYPE_LIST_CARD_FIELDS,
      ...(activeCategory === 'mine' && user ? { created_by: user.id } : {}),
    }),
    [activeCategory, user],
  )

  const allForViewSortQuery = useQuery({
    queryKey: prototypeQueryKeys.allForViewSort(viewSortFilterParams),
    queryFn: () =>
      listAllPrototypesFiltered({
        fields: PROTOTYPE_LIST_CARD_FIELDS,
        ...(activeCategory === 'mine' && user
          ? { created_by: user.id }
          : {}),
      }),
    enabled: !userLoading && isClientViewSort,
  })

  const sortedItems = useMemo(() => {
    if (!isClientViewSort || !allForViewSortQuery.data) return []
    if (sortBy !== 'last-viewed' && sortBy !== 'first-viewed') return []
    return sortPrototypesByViewed(allForViewSortQuery.data, sortBy)
  }, [isClientViewSort, allForViewSortQuery.data, sortBy])

  const baseParams = useMemo(
    () => ({
      limit: itemsPerView,
      sortBy: SORT_BY_PARAM[sortBy],
      fields: PROTOTYPE_LIST_CARD_FIELDS,
      ...(activeCategory === 'mine' && user ? { created_by: user.id } : {}),
    }),
    [itemsPerView, sortBy, activeCategory, user],
  )

  const pagedQueryKeyParams = useMemo(
    () => ({ ...baseParams, category: activeCategory }),
    [baseParams, activeCategory],
  )

  const page0Query = useQuery({
    queryKey: prototypeQueryKeys.paged({ ...pagedQueryKeyParams, page: 1 }),
    queryFn: () => listPrototypesPaged({ ...baseParams, page: 1 }),
    enabled: !userLoading && !isClientViewSort,
  })

  const pagedTotalResults = page0Query.data?.totalResults
  const totalResults = isClientViewSort
    ? allForViewSortQuery.data?.length
    : pagedTotalResults

  const additionalPageIndices = useMemo(() => {
    if (
      isClientViewSort ||
      userLoading ||
      pagedTotalResults === undefined ||
      pagedTotalResults === 0
    ) {
      return []
    }
    const start = Math.max(0, currentItemIndex - pageStep)
    const end = Math.min(
      pagedTotalResults,
      currentItemIndex + itemsPerView + pageStep,
    )
    const minPage = Math.floor(start / itemsPerView)
    const maxPage = Math.floor((end - 1) / itemsPerView)
    const indices: number[] = []
    for (let p = minPage; p <= maxPage; p++) {
      if (p !== 0) indices.push(p)
    }
    return indices
  }, [
    isClientViewSort,
    userLoading,
    pagedTotalResults,
    currentItemIndex,
    pageStep,
    itemsPerView,
  ])

  const additionalPageQueries = useQueries({
    queries: additionalPageIndices.map((pageIndex) => ({
      queryKey: prototypeQueryKeys.paged({
        ...pagedQueryKeyParams,
        page: pageIndex + 1,
      }),
      queryFn: () =>
        listPrototypesPaged({
          ...baseParams,
          page: pageIndex + 1,
        }),
      enabled:
        !isClientViewSort &&
        !userLoading &&
        pagedTotalResults !== undefined &&
        pageIndex * itemsPerView < pagedTotalResults,
    })),
  })

  const pagesCache = useMemo(() => {
    const cache: Record<number, Prototype[]> = {}
    if (page0Query.data) cache[0] = page0Query.data.results
    additionalPageIndices.forEach((pageIndex, i) => {
      const data = additionalPageQueries[i]?.data
      if (data) cache[pageIndex] = data.results
    })
    return cache
  }, [page0Query.data, additionalPageIndices, additionalPageQueries])

  const maxItemIndex =
    totalResults !== undefined ? Math.max(0, totalResults - itemsPerView) : 0
  const canGoLeft = currentItemIndex > 0
  const canGoRight =
    totalResults !== undefined && currentItemIndex < maxItemIndex

  const clampIndex = (n: number) => Math.max(0, Math.min(maxItemIndex, n))

  const goLeft = () => {
    if (canGoLeft) setCurrentItemIndex((i) => clampIndex(i - pageStep))
  }
  const goRight = () => {
    if (canGoRight) setCurrentItemIndex((i) => clampIndex(i + pageStep))
  }

  // Touch-swipe navigation for the carousel: live track drag + snap-to-page on release
  const trackWrapperRef = useRef<HTMLDivElement>(null)
  const touchStartXRef = useRef<number | null>(null)
  const touchStartYRef = useRef<number | null>(null)
  const touchSwipingRef = useRef<boolean>(false)
  const [dragDeltaPx, setDragDeltaPx] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const t = e.touches[0]
    if (!t) return
    touchStartXRef.current = t.clientX
    touchStartYRef.current = t.clientY
    touchSwipingRef.current = false
    setDragDeltaPx(0)
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const t = e.touches[0]
    if (
      !t ||
      touchStartXRef.current === null ||
      touchStartYRef.current === null
    )
      return
    const dx = t.clientX - touchStartXRef.current
    const dy = t.clientY - touchStartYRef.current
    if (!touchSwipingRef.current) {
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_LOCK_THRESHOLD) {
        touchSwipingRef.current = true
        setIsDragging(true)
      } else {
        return
      }
    }
    // Resist over-drag at edges so user gets visual feedback that there's nothing beyond
    let effectiveDx = dx
    if (!canGoLeft && dx > 0) effectiveDx = dx * 0.3
    if (!canGoRight && dx < 0) effectiveDx = dx * 0.3
    setDragDeltaPx(effectiveDx)
  }

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartXRef.current !== null && touchSwipingRef.current) {
      const t = e.changedTouches[0]
      const wrapperWidth = trackWrapperRef.current?.clientWidth ?? 0
      const slotWidthPx = wrapperWidth > 0 ? wrapperWidth / itemsPerView : 0
      const dx = t ? t.clientX - touchStartXRef.current : 0
      // Snap if dragged at least the smaller of 40px and 40% of one slot.
      const dynamicThreshold = Math.min(
        SWIPE_THRESHOLD,
        slotWidthPx > 0 ? slotWidthPx * 0.4 : SWIPE_THRESHOLD,
      )
      if (dx <= -dynamicThreshold && canGoRight) {
        setCurrentItemIndex((i) => clampIndex(i + pageStep))
      } else if (dx >= dynamicThreshold && canGoLeft) {
        setCurrentItemIndex((i) => clampIndex(i - pageStep))
      }
    }
    touchStartXRef.current = null
    touchStartYRef.current = null
    touchSwipingRef.current = false
    setDragDeltaPx(0)
    setIsDragging(false)
  }

  if (requiredLogin && !user) {
    return null
  }

  const isEmpty = totalResults === 0

  const handleSortFilterChange = (selected: string[]) => {
    const label = selected[0]
    if (!label) return
    const option = SORT_LABEL_TO_OPTION[label]
    if (option) setSortBy(option)
  }

  const handlePrototypeClick = (prototype: Prototype) => {
    if (authConfigs.PUBLIC_VIEWING || user) {
      navigate(
        `/model/${prototype.model_id}/library/prototype/${prototype.id}/view`,
      )
    } else {
      setSelectedPrototype(prototype)
      setOpenRemindDialog(true)
    }
  }

  const categoryButtons: { label: string; value: PrototypeCategory }[] = user
    ? [
        { label: 'All', value: 'all' },
        { label: 'My Prototypes', value: 'mine' },
      ]
    : []

  const isInitialLoading = isClientViewSort
    ? allForViewSortQuery.isLoading
    : page0Query.isLoading

  // Number of item slots to render in the flex strip. Before the first response (initial
  // loading) render `itemsPerView` placeholder slots so the carousel reserves the right
  // visual footprint immediately.
  const stripCount =
    totalResults !== undefined && totalResults > 0 ? totalResults : itemsPerView

  // Inline skeleton mirrors DaPrototypeCard layout pixel-for-pixel.
  const renderSkeletonCard = (key: React.Key) => (
    <DaPrototypeCardSkeleton key={key} />
  )

  return (
    <div className="flex flex-col w-full container">
      <div className="flex flex-wrap items-center justify-between gap-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="flex items-center gap-1.5 text-lg font-semibold text-primary">
            {title || 'All Prototypes'}
            <TooltipProvider>
              <Tooltip open={infoOpen} onOpenChange={setInfoOpen}>
                <TooltipTrigger asChild>
                  <span
                    className="inline-flex"
                    onPointerDown={(e) => {
                      e.preventDefault()
                    }}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setInfoOpen(!infoOpen)
                    }}
                  >
                    <TbInfoCircle className="size-5 shrink-0 cursor-pointer text-muted-foreground" />
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm text-xs">
                  Browse all prototypes available on the platform. Navigate
                  using the arrows to load more.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </h2>
          {categoryButtons.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {categoryButtons.map((cat) => (
                <Button
                  key={cat.value}
                  variant="ghost"
                  disabled={isEmpty}
                  className={cn(
                    activeCategory === cat.value
                      ? 'border-[#7B838B]'
                      : 'border-transparent hover:border-[#7B838B]',
                    'border hover:border text-base bg-transparent!',
                  )}
                  size="sm"
                  onClick={() => setActiveCategory(cat.value)}
                >
                  {cat.label}
                </Button>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DaFilter
            key={sortBy}
            categories={{ 'Sort By': SORT_FILTER_OPTIONS }}
            onChange={handleSortFilterChange}
            singleSelect
            showCategory={false}
            defaultValue={[SORT_LABELS[sortBy]]}
            label={SORT_LABELS[sortBy]}
            disabled={isEmpty}
            className="mr-0 h-8 shadow-none border-transparent bg-transparent px-2 text-base font-normal hover:bg-accent"
          />

          {/* Add prototype button */}
          <Button
            variant="outline"
            size="sm"
            className="border-primary bg-transparent text-primary max-[1080px]:px-[7px]!"
            onClick={() => navigate('/new-prototype')}
          >
            <HiPlus className="text-base" />
            <span className="inline max-[1080px]:hidden">Add Prototype</span>
          </Button>
        </div>
      </div>

      <div className="relative mt-2">
        <button
          type="button"
          onClick={goLeft}
          disabled={!canGoLeft}
          className="absolute -left-4 min-[1440px]:-left-12 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center size-9 rounded-full bg-primary text-white hover:bg-primary/90 shadow-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
        >
          <TbChevronLeft className="size-5" />
        </button>
        <div
          ref={trackWrapperRef}
          className="overflow-hidden mx-12 min-[1440px]:mx-0 touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {!isInitialLoading && totalResults === 0 ? (
            <div className="flex items-center justify-center min-h-[168px] text-sm text-muted-foreground">
              No prototypes found
            </div>
          ) : (
            <div
              className={cn(
                'flex gap-2.5',
                !isDragging && 'transition-transform duration-300 ease-out',
              )}
              style={{
                // Each slot pitch = slotWidth + gap = (100% + 0.625rem) / itemsPerView,
                // since slotWidth = (100% - (N-1) * 0.625rem) / N.
                transform: `translate3d(calc((100% + 0.625rem) * ${-currentItemIndex} / ${itemsPerView} + ${dragDeltaPx}px), 0, 0)`,
              }}
            >
              {Array.from({ length: stripCount }).map((_, i) => {
                const page = Math.floor(i / itemsPerView)
                const offset = i % itemsPerView
                const pageItems = pagesCache[page]
                const prototype = isClientViewSort
                  ? sortedItems[i]
                  : pageItems?.[offset]
                const itemWidth = `calc((100% - ${itemsPerView - 1} * 0.625rem) / ${itemsPerView})`
                return (
                  <div
                    key={i}
                    className="flex-none"
                    style={{
                      width: itemWidth,
                    }}
                  >
                    {prototype ? (
                      <div
                        onClick={() => handlePrototypeClick(prototype)}
                        className="cursor-pointer"
                      >
                        <DaPrototypeCard
                          prototype={prototype}
                          variant="home"
                        />
                      </div>
                    ) : (
                      renderSkeletonCard(`sk-${i}`)
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={goRight}
          disabled={!canGoRight}
          className="absolute -right-4 min-[1440px]:-right-12 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center size-9 rounded-full bg-primary text-white hover:bg-primary/90 shadow-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
        >
          <TbChevronRight className="size-5" />
        </button>
      </div>

      {/* Popup Dialog */}
      <DaDialog open={openRemindDialog} onOpenChange={setOpenRemindDialog}>
        <div className="flex flex-col max-w-xl">
          <h3 className="text-lg font-semibold text-primary">
            Sign In Required
          </h3>
          <p className="mt-4 text-base text-muted-foreground">
            You must first sign in to explore SDV idea about
            <span className="text-primary px-1 font-semibold">
              {selectedPrototype?.name}
            </span>
          </p>
          <div className="flex justify-end mt-6">
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                setOpenRemindDialog(false)
                setOpenLoginDialog(true)
              }}
              className="w-20"
            >
              Sign In
            </Button>
          </div>
        </div>
      </DaDialog>
    </div>
  )
}

export default HomePrototypeList
