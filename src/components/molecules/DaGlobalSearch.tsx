import React, { useState, ReactElement, useEffect } from 'react'
import DaPopup from '../atoms/DaPopup'
import { DaText } from '../atoms/DaText'
import { DaInput } from '../atoms/DaInput'
import DaFilter from '../atoms/DaFilter'
import { TbSearch } from 'react-icons/tb'
import { Prototype, ModelLite } from '@/types/model.type'
import { useNavigate } from 'react-router-dom'
import { searchService } from '@/services/search.service'
import DaLoading from '../atoms/DaLoading'

interface DaConfirmPopupProps {
  state?: [boolean, React.Dispatch<React.SetStateAction<boolean>>]
  children: ReactElement
}

interface SearchResult {
  id: string
  name: string
  image_file: string
  type: 'Prototype' | 'Model'
  parent?: { model_id: string }
}

const DaGlobalSearch = ({ state, children }: DaConfirmPopupProps) => {
  const selfManaged = useState(false)
  const [isOpen, setIsOpen] = state ?? selfManaged
  const navigate = useNavigate()
  const [selectedFilters, setSelectedFilters] = useState<string[]>([
    'Prototypes',
    'Models',
  ])
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredResults, setFilteredResults] = useState<SearchResult[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  const handleFilterChange = (selectedOptions: string[]) => {
    const updatedFilters = selectedOptions.map((option) => option)
    setSelectedFilters(updatedFilters)
  }

  const handleSearchChange = (searchTerm: string) => {
    setSearchTerm(searchTerm)
    setFilteredResults([])
    setHasSearched(false)
  }

  const performSearch = async () => {
    if (searchTerm.length === 0) return

    setIsSearching(true)
    const searchResults = await searchService(searchTerm)

    const prototypes = searchResults.top10prototypes
    const models = searchResults.top10models

    //
    //

    if (prototypes && models) {
      let results: SearchResult[] = []

      if (selectedFilters.includes('Prototypes')) {
        const filteredPrototypes: SearchResult[] = prototypes
          .filter((prototype: Prototype) =>
            prototype.name.toLowerCase().includes(searchTerm.toLowerCase()),
          )
          .map((prototype: Prototype) => ({
            id: prototype.id,
            name: prototype.name,
            image_file: prototype.image_file,
            type: 'Prototype' as const,
            parent: { model_id: prototype.model_id },
          }))
        results = [...results, ...filteredPrototypes]
      }

      if (selectedFilters.includes('Models')) {
        const filteredModels: SearchResult[] = models
          .filter((model: ModelLite) =>
            model.name.toLowerCase().includes(searchTerm.toLowerCase()),
          )
          .map((model: ModelLite) => ({
            id: model.id,
            name: model.name,
            image_file: model.model_home_image_file,
            type: 'Model' as const,
          }))
        results = [...results, ...filteredModels]
      }

      setFilteredResults(results)
      setHasSearched(true)
      setIsSearching(false)
    }
  }

  const handleResultClick = (result: SearchResult) => {
    setIsOpen(false)
    if (result.type === 'Prototype') {
      navigate(
        `/model/${result.parent?.model_id}/library/prototype/${result.id}/view`,
      )
    } else if (result.type === 'Model') {
      navigate(`/model/${result.id}`)
    }
  }

  return (
    <DaPopup
      state={[isOpen, setIsOpen]}
      trigger={React.cloneElement(children, { onClick: () => setIsOpen(true) })}
      className="flex flex-col w-[70vw] lg:w-[35vw] h-[70vh] bg-da-white"
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center">
          <DaInput
            placeholder="Search..."
            className="mr-2 w-full"
            Icon={TbSearch}
            iconBefore={true}
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') performSearch()
            }}
          />
          <DaFilter
            categories={{
              Type: ['Prototypes', 'Models'],
            }}
            onChange={handleFilterChange}
            className="w-full"
          />
        </div>

        {isSearching ? (
          <div className="flex w-full h-full items-center justify-center">
            <DaLoading text="Searching..." showRetry={false} />
          </div>
        ) : (
          <div>
            {searchTerm.length === 0 && (
              <DaText variant="small-bold" className="flex justify-center mt-6">
                Type something and press enter to search
              </DaText>
            )}
            {searchTerm.length > 0 && !hasSearched && (
              <DaText variant="small-bold" className="flex justify-center mt-6">
                Press enter to search
              </DaText>
            )}
            {hasSearched && filteredResults.length === 0 && (
              <DaText variant="small-bold" className="flex justify-center mt-6">
                No results found
              </DaText>
            )}

            {filteredResults.length > 0 && (
              <div className="flex flex-col space-y-1 max-h-[50vh] overflow-y-auto mt-4 ">
                <DaText variant="small" className="mb-2">
                  Search <DaText variant="small-bold"> '{searchTerm}' </DaText>
                  for{' '}
                  <DaText variant="small-bold">
                    {selectedFilters
                      .map((filter) => filter.slice(0, -1))
                      .join(', ')}{' '}
                  </DaText>
                  :{' '}
                  {filteredResults.length > 0
                    ? `${filteredResults.length} ${filteredResults.length > 1 ? 'results' : 'result'}`
                    : null}
                </DaText>
                {filteredResults.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center p-2 mr-2 cursor-pointer hover:bg-da-primary-100 border border-da-gray-light rounded-lg hover:border-da-primary-500"
                    onClick={() => handleResultClick(result)}
                  >
                    <img
                      src={result.image_file}
                      alt={result.name}
                      className="w-16 h-16 mr-4 object-cover rounded-md"
                    />
                    <div className="flex flex-col">
                      <DaText variant="small-bold">{result.name}</DaText>
                      <DaText variant="small">{result.type}</DaText>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DaPopup>
  )
}

export default DaGlobalSearch
