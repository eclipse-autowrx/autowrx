import { useState, useEffect, useCallback } from 'react'
import DaApiList from '../molecules/DaApiList'
import { DaInput } from '../atoms/DaInput'
import { debounce } from '@/lib/utils'

interface ApiListProps {
  apiList: { api: string; type: string; details: any }[]
  onApiClick: (details: any) => void
  selectedApi?: { api: string; type: string; details: any } | null
}

const ApiList = ({ apiList, onApiClick, selectedApi }: ApiListProps) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredApiList, setFilteredApiList] = useState(apiList)

  useEffect(() => {
    setFilteredApiList(
      apiList.filter((apiItem) =>
        apiItem.api.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    )
  }, [searchTerm, apiList])

  const handleSearchChange = useCallback(
    debounce((term: string) => {
      setSearchTerm(term)
      // console.log("searchTerm", term);
    }, 500),
    [],
  )

  // useEffect(() => {
  //   console.log("filteredApiList", filteredApiList);
  // }, [filteredApiList]);

  return (
    <div className="flex flex-col h-full w-full p-4">
      <DaInput
        placeholder="Search API"
        className="mb-2"
        onChange={(e) => handleSearchChange(e.target.value)}
      />
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
