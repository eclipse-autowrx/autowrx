import { useState, useEffect, useCallback } from 'react'
import DaApiList from '../molecules/DaApiList'
import { DaInput } from '../atoms/DaInput'
import DaFilter from '../atoms/DaFilter'
import { debounce } from '@/lib/utils'

interface ApiListProps {
  apiList: { api: string; type: string; details: any }[]
  onApiClick: (details: any) => void
  selectedApi?: { api: string; type: string; details: any } | null
}

const ApiList = ({ apiList, onApiClick, selectedApi }: ApiListProps) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredApiList, setFilteredApiList] = useState(apiList)
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])

  useEffect(() => {
    let filteredList = apiList.filter((apiItem) =>
      apiItem.api.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    if (selectedFilters.length > 0) {
      filteredList = filteredList.filter((apiItem) =>
        selectedFilters.includes(apiItem.details.type),
      )
    }

    // console.log('filteredList', filteredList)

    setFilteredApiList(filteredList)
  }, [searchTerm, apiList, selectedFilters])

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

export default ApiList
