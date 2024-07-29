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

interface ModelApiListProps {
  onApiClick?: (details: any) => void
  readOnly?: boolean
}

const ModelApiList = ({ onApiClick, readOnly }: ModelApiListProps) => {
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
      foundApi = activeModelApis.find((apiItem) => apiItem.name === api) // set active api from params
    }

    if (!foundApi && activeModelApis.length > 0) {
      foundApi = activeModelApis[0] // set "Vehicle" as active if no api found in params
    }

    const querys = new URLSearchParams(location.search) // set search term from query params
    const searchQuery = querys.get('search')
    if (searchQuery) {
      setSearchTerm(searchQuery)
    }

    if (foundApi) {
      setSelectedApi(foundApi)
      onApiClick?.(foundApi)
    }
  }, [api, activeModelApis, readOnly])

  const debouncedFilter = useCallback(
    debounce(
      (searchTerm, selectedFilters, activeModelApis, setFilteredApiList) => {
        let filteredList = activeModelApis.filter((apiItem: any) =>
          apiItem.name.toLowerCase().includes(searchTerm.toLowerCase()),
        )

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
            selectedFilters.includes(apiItem.type.toLowerCase()),
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
    <div className="flex flex-col h-full w-full p-4">
      <div className="flex items-center mb-2">
        <DaInput
          placeholder="Search Signal"
          className="mr-2 w-full"
          Icon={TbSearch}
          iconBefore={true}
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
        <DaFilter
          categories={{
            Signal: ['Default', 'Wishlist'],
            Type: ['Branch', 'Sensor', 'Actuator', 'Attribute'],
          }}
          onChange={handleFilterChange}
          className="w-full"
        />
      </div>
      <div className="py-1">
        {isAuthorized && (
          <DaPopup
            state={[isOpenPopup, setIsOpenPopup]}
            trigger={
              <DaButton variant="plain" size="sm">
                <TbPlus className="w-4 h-4 mr-1" /> Add Wishlist Signal
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
              />
            )}
          </DaPopup>
        )}
      </div>
      <div className="flex-grow overflow-y-auto">
        {filteredApiList && filteredApiList.length > 0 ? (
          <DaApiList
            apis={filteredApiList}
            onApiClick={onApiClick}
            selectedApi={selectedApi}
          />
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
