// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useState, useEffect, useCallback } from 'react'
import { useLocation, useParams, useNavigate } from 'react-router-dom'
import { DaApiList } from '../molecules/DaApiList'
import { Input } from '@/components/atoms/input'
import DaFilter from '../atoms/DaFilter'
import { debounce } from '@/lib/utils'
import useModelStore from '@/stores/modelStore'
import { VehicleApi } from '@/types/model.type'
import { shallow } from 'zustand/shallow'
import { Button } from '@/components/atoms/button'
import { TbPlus, TbSearch } from 'react-icons/tb'
import { Dialog, DialogContent } from '@/components/atoms/dialog'
import FormCreateWishlistApi from '../molecules/forms/FormCreateWishlistApi'
import useCurrentModel from '@/hooks/useCurrentModel'
import usePermissionHook from '@/hooks/usePermissionHook'
import { PERMISSIONS } from '@/data/permission'
import { Spinner } from '@/components/atoms/spinner'

interface ModelApiListProps {
  onApiClick?: (details: any) => void
  readOnly?: boolean
  viewMode?: 'list' | 'hierarchical'
}

const ModelApiList = ({
  onApiClick,
  readOnly,
  viewMode = 'list',
}: ModelApiListProps) => {
  const { model_id, api } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [activeModelApis] = useModelStore(
    (state) => [state.activeModelApis],
    shallow,
  )
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredApiList, setFilteredApiList] = useState<VehicleApi[]>([])
  const [selectedFilters, setSelectedFilters] = useState<string[]>([
    'default',
    'wishlist',
    'branch',
    'sensor',
    'actuator',
    'attribute',
  ])
  const [selectedApi, setSelectedApi] = useState<VehicleApi>()
  const [isOpenPopup, setIsOpenPopup] = useState(false)
  const { data: model } = useCurrentModel()
  const [isAuthorized] = usePermissionHook([PERMISSIONS.WRITE_MODEL, model_id])

  useEffect(() => {
    if (readOnly) return

    let foundApi
    if (api) {
      foundApi = activeModelApis?.find((apiItem) => apiItem.name === api) // set active api from params
    }

    if (!foundApi && activeModelApis && activeModelApis.length > 0) {
      foundApi = activeModelApis && activeModelApis[0] // set "Vehicle" as active if no api found in params
    }

    const querys = new URLSearchParams(location.search) // set search term from query params
    const searchQuery = querys.get('search')
    if (searchQuery) {
      setSearchTerm(searchQuery)
    }

    if (foundApi && (!selectedApi || selectedApi.name !== foundApi.name)) {
      setSelectedApi(foundApi)
      onApiClick?.(foundApi)
    }
  }, [api, activeModelApis, readOnly, location.search])

  const debouncedFilter = useCallback(
    debounce(
      (searchTerm, selectedFilters, activeModelApis, setFilteredApiList) => {
        if (!activeModelApis) return

        let filteredList =
          activeModelApis?.filter((apiItem: any) =>
            apiItem.name.toLowerCase().includes(searchTerm.toLowerCase()),
          ) || []

        if (selectedFilters.length > 0) {
          filteredList = filteredList.filter((apiItem: any) => {
            const isDefault = !apiItem.isWishlist
            const isWishlist = !!apiItem.isWishlist
            return (
              (selectedFilters.includes('default') && isDefault) ||
              (selectedFilters.includes('wishlist') && isWishlist)
            )
          })

          filteredList = filteredList.filter((apiItem: any) =>
            selectedFilters.includes(apiItem.type?.toLowerCase()),
          )
        }

        setFilteredApiList(filteredList)
      },
      400,
    ),
    [],
  )

  useEffect(() => {
    debouncedFilter(
      searchTerm,
      selectedFilters,
      activeModelApis,
      setFilteredApiList,
    )
  }, [searchTerm, selectedFilters, activeModelApis])

  const handleSearchChange = (searchTerm: string) => {
    setSearchTerm(searchTerm)
    const querys = new URLSearchParams(location.search)
    if (searchTerm) {
      querys.set('search', searchTerm)
    } else {
      querys.delete('search')
    }
    navigate({ search: querys.toString() }, { replace: true })
  }

  const handleFilterChange = (selectedOptions: string[]) => {
    const updatedFilters = selectedOptions.map((option) => option.toLowerCase())
    setSelectedFilters(updatedFilters)
  }

  return (
    <div className="flex h-full w-full flex-col p-3">
      <div className="mb-2 flex items-center">
        <div className="relative w-full mr-2">
          <TbSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search Signal"
            data-id='search-signal-input'
            className="pl-9 w-full"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        {viewMode !== 'hierarchical' && (
          <DaFilter
            categories={{
              Signal: ['Default', 'Wishlist'],
              Type: ['Branch', 'Sensor', 'Actuator', 'Attribute'],
            }}
            onChange={handleFilterChange}
            className="w-full"
          />
        )}
      </div>
      <div className="py-1">
        {isAuthorized && (
          <Dialog open={isOpenPopup} onOpenChange={setIsOpenPopup}>
            <Button variant="ghost" size="sm" onClick={() => setIsOpenPopup(true)}>
              <TbPlus className="mr-1 h-4 w-4" /> Add Wishlist Signal
            </Button>
            <DialogContent>
              {model_id && model && (
                <FormCreateWishlistApi
                  modelId={model_id}
                  existingCustomApis={model.custom_apis as VehicleApi[]}
                  onClose={() => {
                    setIsOpenPopup(false)
                  }}
                  onApiCreate={(api) => {
                    onApiClick?.(api)
                  }}
                />
              )}
            </DialogContent>
          </Dialog>
        )}
      </div>
      <div className="flex h-full w-full flex-col overflow-y-auto">
        {filteredApiList ? (
          filteredApiList.length > 0 ? (
            <DaApiList
              apis={filteredApiList}
              onApiClick={onApiClick}
              selectedApi={selectedApi}
            />
          ) : (
            <div className="flex w-full h-full items-center justify-center mb-24">
              <div className="text-sm font-medium flex justify-center mt-6">
                No signal found
              </div>
            </div>
          )
        ) : (
          <div className="flex items-center justify-center h-[200px]">
            <Spinner className="mr-2" />
            <span className="text-sm font-medium text-muted-foreground">Loading API List...</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default ModelApiList
