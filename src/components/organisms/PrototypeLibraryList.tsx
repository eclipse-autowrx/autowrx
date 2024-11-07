import { useState, useEffect } from 'react'
import { Prototype } from '@/types/model.type'
import DaLoading from '@/components/atoms/DaLoading'
import useListModelPrototypes from '@/hooks/useListModelPrototypes'
import useCurrentModel from '@/hooks/useCurrentModel'
import { DaText } from '../atoms/DaText'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { DaPrototypeItem } from '../molecules/DaPrototypeItem'

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
          // If searchInput is empty, don't filter out any prototypes
          if (!searchInput) return true
          return prototype.name
            .toLowerCase()
            .includes(searchInput.toLowerCase())
        })
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
              <Link
                key={prototype.id}
                to={`/model/${model.id}/library/prototype/${prototype.id}/view`}
                className="flex w-full cursor-pointer mb-2"
              >
                <DaPrototypeItem prototype={prototype} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex w-full h-full items-center justify-center">
            <DaText variant="title">No prototype found.</DaText>
          </div>
        )}
      </div>
    </div>
  )
}

export default PrototypeLibraryList
