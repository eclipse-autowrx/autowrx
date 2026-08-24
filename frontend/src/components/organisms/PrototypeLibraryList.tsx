// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Prototype } from '@/types/model.type'
import {
  useListModelPrototypes,
  useModelPrototypesPaged,
} from '@/hooks/usePrototypeQueries'
import useCurrentModel from '@/hooks/useCurrentModel'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { DaPrototypeCard } from '../molecules/DaPrototypeCard'
import DaErrorDisplay from '../molecules/DaErrorDisplay'
import DaSkeletonGrid from '../molecules/DaSkeletonGrid'
import { sortPrototypesByViewed } from '@/utils/prototypeSort'
import { getVisiblePageItems } from '@/utils/pagination'
import { PROTOTYPE_LIBRARY_SORT_BY } from '@/services/prototype.service'
import {
  DaPaging,
  DaPaginationContent,
  DaPaginationItem,
  DaPaginationLink,
  DaPaginationPrevious,
  DaPaginationNext,
  DaPaginationEllipsis,
} from '../atoms/DaPaging'

const PAGE_SIZE = 50
const CLIENT_ONLY_SORTS = ['Last view', 'First view', 'Rating']

interface PrototypeLibraryListProps {
  selectedFilters?: string[]
  searchInput?: string
}

const parsePageParam = (raw: string | null) => {
  const parsed = parseInt(raw || '1', 10)
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : 1
}

const PrototypeLibraryList = ({
  selectedFilters,
  searchInput,
}: PrototypeLibraryListProps) => {
  const { data: model } = useCurrentModel()
  const modelId = model ? model.id : ''
  const [selectedPrototype, setSelectedPrototype] = useState<Prototype>()
  const [filteredPrototypes, setFilteredPrototypes] = useState<Prototype[]>()
  const [loading, setLoading] = useState(true)
  const [timeoutReached, setTimeoutReached] = useState(false)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { prototype_id } = useParams()
  const filterResetKey = `${searchInput ?? ''}|${(selectedFilters ?? []).join(',')}`
  const [pageResetKey, setPageResetKey] = useState(filterResetKey)

  const isClientSideMode =
    !!searchInput?.trim() ||
    (selectedFilters ?? []).some((filter) => CLIENT_ONLY_SORTS.includes(filter))

  const sortBy = PROTOTYPE_LIBRARY_SORT_BY[selectedFilters?.[0] ?? '']

  const urlPage = parsePageParam(searchParams.get('page'))

  // Reset to page 1 when search/sort changes (adjust state during render when inputs change).
  if (filterResetKey !== pageResetKey) {
    setPageResetKey(filterResetKey)
    if (searchParams.has('page')) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.delete('page')
          return next
        },
        { replace: true },
      )
    }
  }

  const requestedPage = filterResetKey !== pageResetKey ? 1 : urlPage

  const { data: fetchedPrototypes } = useListModelPrototypes(modelId, {
    enabled: isClientSideMode,
  })
  const pagedQuery = useModelPrototypesPaged(
    modelId,
    {
      page: requestedPage,
      limit: PAGE_SIZE,
      ...(sortBy ? { sortBy } : {}),
    },
    { enabled: !isClientSideMode && !!modelId },
  )

  useEffect(() => {
    if (!selectedPrototype) return
    navigate(`/model/${model?.id}/library/list/${selectedPrototype.id}`)
  }, [selectedPrototype])

  useEffect(() => {
    const source = isClientSideMode
      ? fetchedPrototypes
      : pagedQuery.data?.results
    if (!source || !prototype_id) return
    const prototype = source.find((item) => item.id === prototype_id)
    if (prototype) {
      setSelectedPrototype(prototype)
    }
  }, [prototype_id, fetchedPrototypes, pagedQuery.data, isClientSideMode])

  useEffect(() => {
    if (!isClientSideMode || !fetchedPrototypes) return

    const filtered = fetchedPrototypes.filter((prototype) => {
      if (!searchInput) return true
      return prototype.name.toLowerCase().includes(searchInput.toLowerCase())
    })

    if (selectedFilters?.includes('Last view')) {
      setFilteredPrototypes(sortPrototypesByViewed(filtered, 'last-viewed'))
      return
    }
    if (selectedFilters?.includes('First view')) {
      setFilteredPrototypes(sortPrototypesByViewed(filtered, 'first-viewed'))
      return
    }

    const compareNames = (a: Prototype, b: Prototype) =>
      a.name.localeCompare(b.name)

    setFilteredPrototypes(
      [...filtered].sort((a: Prototype, b: Prototype) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0

        if (selectedFilters?.includes('Newest')) {
          return dateB - dateA
        } else if (selectedFilters?.includes('Oldest')) {
          return dateA - dateB
        } else if (selectedFilters?.includes('Name A-Z')) {
          return compareNames(a, b)
        } else if (selectedFilters?.includes('Name Z-A')) {
          return compareNames(b, a)
        } else if (selectedFilters?.includes('Rating')) {
          return (b.avg_score ?? 0) - (a.avg_score ?? 0)
        }
        return 0
      }),
    )
  }, [isClientSideMode, searchInput, selectedFilters, fetchedPrototypes])

  const totalFiltered = isClientSideMode
    ? (filteredPrototypes?.length ?? 0)
    : (pagedQuery.data?.totalResults ?? 0)
  const totalPages = isClientSideMode
    ? Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE))
    : Math.max(1, pagedQuery.data?.totalPages ?? 1)
  const safePage = Math.min(requestedPage, totalPages)
  const visiblePageItems = useMemo(
    () => getVisiblePageItems(safePage, totalPages),
    [safePage, totalPages],
  )

  const pagedPrototypes = useMemo(() => {
    if (!isClientSideMode) {
      return pagedQuery.data?.results ?? []
    }
    if (!filteredPrototypes) return []
    const start = (safePage - 1) * PAGE_SIZE
    return filteredPrototypes.slice(start, start + PAGE_SIZE)
  }, [isClientSideMode, filteredPrototypes, pagedQuery.data, safePage])

  const handlePageChange = useCallback(
    (page: number) => {
      if (page < 1 || page > totalPages) return
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (page <= 1) {
            next.delete('page')
          } else {
            next.set('page', String(page))
          }
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams, totalPages],
  )

  useEffect(() => {
    if (isClientSideMode || !pagedQuery.data) return
    const serverTotalPages = Math.max(1, pagedQuery.data.totalPages)
    if (requestedPage > serverTotalPages) {
      handlePageChange(serverTotalPages)
    }
  }, [isClientSideMode, pagedQuery.data, requestedPage, handlePageChange])

  const listReady = isClientSideMode
    ? !!fetchedPrototypes && filteredPrototypes !== undefined
    : !!pagedQuery.data || pagedQuery.isError

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!model || !listReady) {
        setTimeoutReached(true)
      }
      setLoading(false)
    }, 15000)

    if (listReady) {
      setLoading(false)
      clearTimeout(timeout)
    } else {
      setLoading(true)
      setTimeoutReached(false)
    }

    return () => clearTimeout(timeout)
  }, [model, listReady])

  if (loading) {
    return (
      <div className="flex flex-col w-full h-full">
        <DaSkeletonGrid
          maxItems={{
            sm: 1,
            md: 2,
            lg: 3,
            xl: 8,
          }}
        />
      </div>
    )
  }

  if (timeoutReached || (!isClientSideMode && pagedQuery.isError)) {
    return (
      <DaErrorDisplay
        error="Failed to load prototype library or access denied"
        className="-mt-24"
      />
    )
  }

  const hasCards = isClientSideMode
    ? !!filteredPrototypes && filteredPrototypes.length > 0
    : pagedPrototypes.length > 0 || totalFiltered > 0

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex flex-col h-full">
        {hasCards && pagedPrototypes.length > 0 ? (
          <>
            <div className="w-full grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
              {pagedPrototypes.map((prototype) => (
                <div
                  key={prototype.id}
                  onClick={() =>
                    navigate(
                      `/model/${model!.id}/library/prototype/${prototype.id}/view`,
                    )
                  }
                  className="flex w-full cursor-pointer mb-2 prototype-grid-item-wrapper"
                >
                  <DaPrototypeCard
                    prototype={prototype}
                    existingPrototypeNames={
                      isClientSideMode
                        ? fetchedPrototypes
                            ?.filter((p) => p.id !== prototype.id)
                            .map((p) => p.name)
                        : undefined
                    }
                  />
                </div>
              ))}
            </div>
            {totalFiltered > PAGE_SIZE && (
              <DaPaging
                data-id="prototype-library-pagination"
                className="pt-4 pb-6"
              >
                <DaPaginationContent>
                  <DaPaginationItem>
                    <DaPaginationPrevious
                      href={safePage <= 2 ? '?' : `?page=${safePage - 1}`}
                      onClick={(e) => {
                        e.preventDefault()
                        handlePageChange(safePage - 1)
                      }}
                      disabled={safePage === 1}
                    />
                  </DaPaginationItem>
                  {visiblePageItems.map((item, index) => {
                    if (item === 'ellipsis') {
                      const ellipsisKey =
                        index < visiblePageItems.length / 2
                          ? 'ellipsis-before'
                          : 'ellipsis-after'
                      return (
                        <DaPaginationItem key={ellipsisKey}>
                          <DaPaginationEllipsis
                            data-id={`prototype-library-${ellipsisKey}`}
                          />
                        </DaPaginationItem>
                      )
                    }
                    return (
                      <DaPaginationItem key={item}>
                        <DaPaginationLink
                          data-id={`prototype-library-page-${item}`}
                          href={item === 1 ? '?' : `?page=${item}`}
                          isActive={safePage === item}
                          onClick={(e) => {
                            e.preventDefault()
                            handlePageChange(item)
                          }}
                        >
                          {item}
                        </DaPaginationLink>
                      </DaPaginationItem>
                    )
                  })}
                  <DaPaginationItem>
                    <DaPaginationNext
                      href={`?page=${safePage + 1}`}
                      onClick={(e) => {
                        e.preventDefault()
                        handlePageChange(safePage + 1)
                      }}
                      disabled={safePage === totalPages}
                    />
                  </DaPaginationItem>
                </DaPaginationContent>
              </DaPaging>
            )}
          </>
        ) : (
          <div className="flex w-full h-[70%] items-center justify-center">
            <h3 className="text-lg font-semibold text-primary">
              No prototype found. Please create a new prototype.
            </h3>
          </div>
        )}
      </div>
    </div>
  )
}

export default PrototypeLibraryList
