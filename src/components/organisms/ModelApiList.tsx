import { useState, useEffect, useCallback } from 'react'
import { DaApiList } from '../molecules/DaApiList'
import { DaInput } from '../atoms/DaInput'
import DaFilter from '../atoms/DaFilter'
import { debounce } from '@/lib/utils'
import useModelStore from '@/stores/modelStore'
import { useParams } from 'react-router-dom'
import { ApiItem } from '@/types/model.type'
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
  const [filteredApiList, setFilteredApiList] = useState<any[]>([])
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
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
    console.log('selectedApi', selectedApi)
    if (onApiSelected) {
      onApiSelected(selectedApi)
    }
  }, [selectedApi, onApiSelected])

  useEffect(() => {
    let filteredList = activeModelApis.filter((apiItem) =>
      apiItem.api.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    if (selectedFilters.length > 0) {
      filteredList = filteredList.filter((apiItem) =>
        selectedFilters.includes(apiItem.details.type),
      )
    }

    console.log('filteredList', filteredList)
    setFilteredApiList(filteredList)
  }, [searchTerm, selectedFilters, activeModelApis])

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
          options={['Branch', 'Sensor', 'Actuator', 'Attribute']}
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
