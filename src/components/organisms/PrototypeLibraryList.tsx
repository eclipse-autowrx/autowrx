import { useState, useEffect } from 'react'
import { Prototype } from '@/types/model.type'
import DaLoading from '@/components/atoms/DaLoading'
import useListModelPrototypes from '@/hooks/useListModelPrototypes'
import useCurrentModel from '@/hooks/useCurrentModel'
import usePermissionHook from '@/hooks/usePermissionHook'
import { PERMISSIONS } from '@/data/permission'
import { DaText } from '../atoms/DaText'
import { useLocation, useParams, useNavigate } from 'react-router-dom'
import { DaItemVerticalStandard } from '../molecules/DaItemVerticalStandard'

interface PrototypeLibraryListProps {
  selectedFilters?: string[]
}

const PrototypeLibraryList = ({
  selectedFilters,
}: PrototypeLibraryListProps) => {
  const { data: model } = useCurrentModel()
  const { data: fetchedPrototypes, refetch } = useListModelPrototypes(
    model ? model.id : '',
  )
  const [selectedPrototype, setSelectedPrototype] = useState<Prototype>()
  const [filteredPrototypes, setFilteredPrototypes] = useState<Prototype[]>()
  const [searchInput, setSearchInput] = useState('')
  const location = useLocation()
  const navigate = useNavigate()
  const { prototype_id } = useParams()

  // const handleSearchChange = (searchTerm: string) => {
  //   setSearchInput(searchTerm)
  //   const querys = new URLSearchParams(location.search)
  //   if (searchTerm) {
  //     querys.set('search', searchTerm)
  //   } else {
  //     querys.delete('search')
  //   }
  //   navigate({ search: querys.toString() }, { replace: true })
  // }

  useEffect(() => {
    if (fetchedPrototypes && fetchedPrototypes.length > 0) {
      setSelectedPrototype(fetchedPrototypes[0] as Prototype)
      const querys = new URLSearchParams(location.search)
      const searchQuery = querys.get('search')
      if (searchQuery) {
        setSearchInput(searchQuery)
      }
    }
  }, [fetchedPrototypes])

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
        .filter((prototype) =>
          prototype.name.toLowerCase().includes(searchInput.toLowerCase()),
        )
        .sort((a: Prototype, b: Prototype) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0

          console.log('Selected Filters: ', selectedFilters)

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

  if (!model || !fetchedPrototypes) {
    return (
      <DaLoading
        text="Loading prototypes..."
        timeoutText="Failed to load prototype library or access denied"
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
                key={index}
                onClick={() => {
                  navigate(
                    `/model/${model.id}/library/prototype/${prototype.id}/view`,
                  )
                }}
                className="flex w-full cursor-pointer mb-2"
              >
                <DaItemVerticalStandard
                  title={prototype.name}
                  content={prototype.description?.solution}
                  imageUrl={prototype.image_file}
                  maxWidth="400px"
                  className="!w-full !h-full"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex w-full h-full items-center justify-center">
            <DaText variant="title">No prototype found.</DaText>
          </div>
        )}
      </div>

      {/* <div className="col-span-7 xl:col-span-8 border-l flex w-full h-full overflow-auto">
          {selectedPrototype ? (
            <PrototypeSummary prototype={selectedPrototype as Prototype} />
          ) : (
            <div className="flex w-full h-full items-center justify-center">
              <DaText variant="title">No prototype selected.</DaText>
            </div>
          )}
        </div> */}
      {/* <div className="flex items-center pr-3">
            <DaInput
              type="text"
              Icon={TbSearch}
              iconBefore={true}
              placeholder="Enter to search"
              className="w-full p-3 !bg-white z-10"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            <DaFilter
              categories={{
                'Sort By': ['Newest', 'Oldest', 'Name A-Z'],
              }}
              onChange={(option) => handleFilterChange(option)}
              className="w-full"
              singleSelect={true}
              defaultValue={selectedFilters}
            />
          </div> */}
    </div>
  )
}

export default PrototypeLibraryList
