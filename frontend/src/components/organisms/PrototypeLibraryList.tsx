// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useState, useEffect, useMemo } from 'react'
import { Prototype } from '@/types/model.type'
import { useListModelPrototypes } from '@/hooks/usePrototypeQueries'
import useCurrentModel from '@/hooks/useCurrentModel'
import { useParams, useNavigate } from 'react-router-dom'
import { DaPrototypeCard } from '../molecules/DaPrototypeCard'
import DaErrorDisplay from '../molecules/DaErrorDisplay'
import DaSkeletonGrid from '../molecules/DaSkeletonGrid'
import { sortPrototypesByViewed } from '@/utils/prototypeSort'
import { getVisiblePageItems } from '@/utils/pagination'
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

interface PrototypeLibraryListProps {
  selectedFilters?: string[]
  searchInput?: string
}

const PrototypeLibraryList = ({
  selectedFilters,
  searchInput,
}: PrototypeLibraryListProps) => {
  const { data: model } = useCurrentModel()
  const { data: fetchedPrototypes } = useListModelPrototypes(
    model ? model.id : '',
  )
  const [selectedPrototype, setSelectedPrototype] = useState<Prototype>()
  const [filteredPrototypes, setFilteredPrototypes] = useState<Prototype[]>()
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [timeoutReached, setTimeoutReached] = useState(false)
  const navigate = useNavigate()
  const { prototype_id } = useParams()
  const filterResetKey = `${searchInput ?? ''}|${(selectedFilters ?? []).join(',')}`
  const [pageResetKey, setPageResetKey] = useState(filterResetKey)

  useEffect(() => {
    if (!selectedPrototype) return
    navigate(`/model/${model?.id}/library/list/${selectedPrototype.id}`)
  }, [selectedPrototype])

  useEffect(() => {
    if (!fetchedPrototypes) return
    if (prototype_id) {
      const prototype = fetchedPrototypes.find(
        (prototype) => prototype.id === prototype_id,
      )
      if (prototype) {
        setSelectedPrototype(prototype)
      }
    }
  }, [prototype_id, fetchedPrototypes])

  useEffect(() => {
    if (!fetchedPrototypes) return

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
  }, [searchInput, selectedFilters, fetchedPrototypes])

  if (filterResetKey !== pageResetKey) {
    setPageResetKey(filterResetKey)
    setCurrentPage(1)
  }

  const totalFiltered = filteredPrototypes?.length ?? 0
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const visiblePageItems = useMemo(
    () => getVisiblePageItems(safePage, totalPages),
    [safePage, totalPages],
  )

  const pagedPrototypes = useMemo(() => {
    if (!filteredPrototypes) return []
    const start = (safePage - 1) * PAGE_SIZE
    return filteredPrototypes.slice(start, start + PAGE_SIZE)
  }, [filteredPrototypes, safePage])

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!model || !fetchedPrototypes) {
        setTimeoutReached(true)
      }
      setLoading(false)
    }, 15000)

    if (fetchedPrototypes) {
      setLoading(false)
      clearTimeout(timeout)
    }

    return () => clearTimeout(timeout)
  }, [model, fetchedPrototypes])

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

  if (timeoutReached) {
    return (
      <DaErrorDisplay
        error="Failed to load prototype library or access denied"
        className="-mt-24"
      />
    )
  }

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex flex-col h-full">
        {filteredPrototypes && filteredPrototypes.length > 0 ? (
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
                    existingPrototypeNames={fetchedPrototypes
                      ?.filter((p) => p.id !== prototype.id)
                      .map((p) => p.name)}
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
                      href={`#${safePage - 1}`}
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
                          href={`#${item}`}
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
                      href={`#${safePage + 1}`}
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
