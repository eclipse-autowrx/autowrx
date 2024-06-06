import { useState, useEffect, useCallback } from 'react'
import { DaApiList } from '../molecules/DaApiList'
import { DaInput } from '../atoms/DaInput'
import DaFilter from '../atoms/DaFilter'
import { debounce } from '@/lib/utils'
import useModelStore from '@/stores/modelStore'
import { useParams } from 'react-router-dom'
import { ApiItem, VehicleApi, CustomApi } from '@/types/model.type'
import { shallow } from 'zustand/shallow'
import { DaButton } from '../atoms/DaButton'
import { TbPlus } from 'react-icons/tb'
import DaPopup from '../atoms/DaPopup'
import FormCreateWishlistApi from '../molecules/forms/FormCreateWishlistApi'
import useCurrentModel from '@/hooks/useCurrentModel'

interface ModelApiListProps {
  onApiClick?: (details: any) => void
  onApiSelected?: (selectedApi: any) => void
}

const ModelApiList = ({ onApiClick, onApiSelected }: ModelApiListProps) => {
  const { model_id, api } = useParams()
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
  const [selectedApi, setSelectedApi] = useState<ApiItem | null>(null)
  const [isOpenPopup, setIsOpenPopup] = useState(false)

  const { data: model } = useCurrentModel()

  useEffect(() => {
    if (api) {
      const foundApi = activeModelApis.find((apiItem) => apiItem.api === api)
      if (foundApi) {
        setSelectedApi(foundApi)
      }
    }
  }, [api, activeModelApis])

  useEffect(() => {
    if (onApiSelected) {
      onApiSelected(selectedApi)
    }
  }, [selectedApi, onApiSelected])

  useEffect(() => {
    let combinedApis = [
      ...activeModelApis,
      ...(model?.custom_apis?.map((wishlistApi: CustomApi) => ({
        ...wishlistApi,
        api: wishlistApi.name,
        isWishlist: true,
      })) || []),
    ]

    let filteredList = combinedApis.filter((apiItem) =>
      apiItem.api.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    if (selectedFilters.length > 0) {
      filteredList = filteredList.filter((apiItem) => {
        const isDefault = !apiItem.isWishlist
        const isWishlist = !!apiItem.isWishlist
        return (
          (selectedFilters.includes('default') && isDefault) ||
          (selectedFilters.includes('wishlist') && isWishlist)
        )
      })

      filteredList = filteredList.filter((apiItem) =>
        selectedFilters.includes(apiItem.type.toLowerCase()),
      )
    }

    setFilteredApiList(filteredList)
  }, [searchTerm, selectedFilters, activeModelApis, model?.custom_apis])

  const handleSearchChange = useCallback(
    debounce((term: string) => {
      setSearchTerm(term)
    }, 500),
    [],
  )

  const handleFilterChange = (selectedOptions: string[]) => {
    const updatedFilters = selectedOptions.map((option) => option.toLowerCase())
    setSelectedFilters(updatedFilters)
  }

  return (
    <div className="flex flex-col h-full w-full p-4">
      <div className="flex items-center mb-2">
        <DaInput
          placeholder="Search API"
          className="mr-2 w-full"
          onChange={(e) => handleSearchChange(e.target.value)}
        />
        <DaFilter
          options={[
            'Default',
            'Wishlist',
            'Branch',
            'Sensor',
            'Actuator',
            'Attribute',
          ]}
          onChange={handleFilterChange}
          className="w-full"
        />
      </div>
      <div className="py-1">
        <DaPopup
          state={[isOpenPopup, setIsOpenPopup]}
          trigger={
            <DaButton variant="plain" size="sm">
              <TbPlus className="w-4 h-4 mr-1" /> Add Wishlist API
            </DaButton>
          }
        >
          {model_id && model && (
            <FormCreateWishlistApi
              modelId={model_id}
              existingCustomApis={model.custom_apis as any}
              onClose={() => setIsOpenPopup(false)}
            />
          )}
        </DaPopup>
      </div>
      <div className="flex-grow overflow-y-auto">
        <DaApiList
          apis={filteredApiList}
          onApiClick={onApiClick}
          selectedApi={selectedApi}
        />
      </div>
    </div>
  )
}

export default ModelApiList
