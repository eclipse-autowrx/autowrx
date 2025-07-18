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
import { DaInput } from '../atoms/DaInput'
import DaFilter from '../atoms/DaFilter'
import { debounce } from '@/lib/utils'
import useModelStore from '@/stores/modelStore'
import { VehicleApi } from '@/types/model.type'
import { shallow } from 'zustand/shallow'
import { DaButton } from '../atoms/DaButton'
import { TbPlus, TbSearch } from 'react-icons/tb'
import DaPopup from '../atoms/DaPopup'
import FormCreateWishlistApi from '../molecules/forms/FormCreateWishlistApi'
import useCurrentModel from '@/hooks/useCurrentModel'
import usePermissionHook from '@/hooks/usePermissionHook'
import { PERMISSIONS } from '@/data/permission'
import { DaText } from '../atoms/DaText'
import DaLoading from '../atoms/DaLoading'
import { DaHierarchicalView } from '@/components/molecules/DaApiHierarchicalView'

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
        <DaInput
          placeholder="Search Signal"
          dataId='search-signal-input'
          className="mr-2 w-full"
          Icon={TbSearch}
          iconBefore={true}
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
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
          <DaPopup
            state={[isOpenPopup, setIsOpenPopup]}
            trigger={
              <DaButton variant="plain" size="sm">
                <TbPlus className="mr-1 h-4 w-4" /> Add Wishlist Signal
              </DaButton>
            }
          >
            {model_id && model && (
              <FormCreateWishlistApi
                modelId={model_id}
                existingCustomApis={model.custom_apis as VehicleApi[]}
                onClose={() => {
                  setIsOpenPopup(false)
                }}
                onApiCreate={(api) => {
                  onApiClick?.(api)
                  // window.location.reload() // Try to optimize later
                }}
              />
            )}
          </DaPopup>
        )}
      </div>
      <div className="flex h-full w-full flex-col overflow-y-auto">
        {filteredApiList ? (
          filteredApiList.length > 0 ? (
            viewMode === 'list' ? (
              <DaApiList
                apis={filteredApiList}
                onApiClick={onApiClick}
                selectedApi={selectedApi}
              />
            ) : (
              <DaHierarchicalView
                apis={filteredApiList}
                onApiClick={onApiClick}
                selectedApi={selectedApi}
              />
            )
          ) : (
            <div className="flex w-full h-full items-center justify-center mb-24">
              <DaText
                variant="regular-bold"
                className="flex justify-center mt-6"
              >
                No signal found
              </DaText>
            </div>
          )
        ) : (
          <DaLoading
            text="Loading API List..."
            timeoutText="No API found."
            showRetry={false}
            timeout={5}
          />
        )}
      </div>
    </div>
  )
}

export default ModelApiList
