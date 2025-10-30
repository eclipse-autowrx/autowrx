// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useState, useEffect } from 'react'
import { Prototype } from '@/types/model.type'
import useListModelPrototypes from '@/hooks/useListModelPrototypes'
import useCurrentModel from '@/hooks/useCurrentModel'
import { useParams, useNavigate } from 'react-router-dom'
import { DaPrototypeItem } from '../molecules/DaPrototypeItem'
import DaErrorDisplay from '../molecules/DaErrorDisplay'
import DaSkeletonGrid from '../molecules/DaSkeletonGrid'

interface PrototypeLibraryListProps {
  selectedFilters?: string[]
  searchInput?: string
}

const PrototypeLibraryList = ({
  selectedFilters,
  searchInput,
}: PrototypeLibraryListProps) => {
  const { data: model } = useCurrentModel()
  const { data: fetchedPrototypes, refetch } = useListModelPrototypes(
    model ? model.id : '',
  )
  const [selectedPrototype, setSelectedPrototype] = useState<Prototype>()
  const [filteredPrototypes, setFilteredPrototypes] = useState<Prototype[]>()
  const [loading, setLoading] = useState(true)
  const [timeoutReached, setTimeoutReached] = useState(false)
  const navigate = useNavigate()
  const { prototype_id } = useParams()

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
    setFilteredPrototypes(
      fetchedPrototypes
        .filter((prototype) => {
          if (!searchInput) return true
          return prototype.name
            .toLowerCase()
            .includes(searchInput.toLowerCase())
        })
        .sort((a: Prototype, b: Prototype) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0

          if (selectedFilters?.includes('Newest')) {
            return dateB - dateA
          } else if (selectedFilters?.includes('Oldest')) {
            return dateA - dateB
          } else if (selectedFilters?.includes('Name A-Z')) {
            return a.name.localeCompare(b.name)
          }
          return 0
        }),
    )
  }, [searchInput, selectedFilters, fetchedPrototypes])

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
          <div className="w-full grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPrototypes.map((prototype, index) => (
              <div
                key={prototype.id}
                onClick={() =>
                  navigate(
                    `/model/${model!.id}/library/prototype/${prototype.id}/view`,
                  )
                }
                className="flex w-full cursor-pointer mb-2 prototype-grid-item-wrapper"
              >
                <DaPrototypeItem prototype={prototype} />
              </div>
            ))}
          </div>
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
