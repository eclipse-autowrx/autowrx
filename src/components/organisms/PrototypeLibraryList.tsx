import { useState, useEffect } from 'react'
import { Prototype } from '@/types/model.type'
import PrototypeSummary from '@/components/organisms/PrototypeSummary'
import { DaInput } from '@/components/atoms/DaInput'
import { DaItemStandard } from '@/components/molecules/DaItemStandard'
import { DaButton } from '@/components/atoms/DaButton'
import DaImportFile from '@/components/atoms/DaImportFile'
import DaPopup from '@/components/atoms/DaPopup'
import DaLoading from '@/components/atoms/DaLoading'
import { TbFileImport, TbPlus, TbSearch } from 'react-icons/tb'
import FormCreatePrototype from '@/components/molecules/forms/FormCreatePrototype'
import useListModelPrototypes from '@/hooks/useListModelPrototypes'
import useCurrentModel from '@/hooks/useCurrentModel'
import { zipToPrototype } from '@/lib/zipUtils'
import { createPrototypeService } from '@/services/prototype.service'
import DaLoader from '@/components/atoms/DaLoader'
import usePermissionHook from '@/hooks/usePermissionHook'
import { PERMISSIONS } from '@/data/permission'
import { DaText } from '../atoms/DaText'
import { useLocation, useParams, useNavigate } from 'react-router-dom'
import { addLog } from '@/services/log.service'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import DaFilter from '../atoms/DaFilter'

const PrototypeLibraryList = () => {
  const { data: model } = useCurrentModel()
  const { data: fetchedPrototypes, refetch } = useListModelPrototypes(
    model ? model.id : '',
  )
  const [open, setOpen] = useState(false)
  const [selectedPrototype, setSelectedPrototype] = useState<Prototype>()
  const [filteredPrototypes, setFilteredPrototypes] = useState<Prototype[]>()
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthorized] = usePermissionHook([PERMISSIONS.READ_MODEL, model?.id])
  const [searchInput, setSearchInput] = useState('')
  const location = useLocation()
  const navigate = useNavigate()
  const { prototype_id } = useParams()
  const { data: currentUser } = useSelfProfileQuery()

  // Initialize selectedFilters from localStorage or default to ['Newest']
  const [selectedFilters, setSelectedFilters] = useState<string[]>(() =>
    JSON.parse(
      localStorage.getItem('prototypeLibrary-selectedFilter') || '["Newest"]',
    ),
  )

  const handleSearchChange = (searchTerm: string) => {
    setSearchInput(searchTerm)
    const querys = new URLSearchParams(location.search)
    if (searchTerm) {
      querys.set('search', searchTerm)
    } else {
      querys.delete('search')
    }
    navigate({ search: querys.toString() }, { replace: true })
  }

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

  const handleImportPrototypeZip = async (file: File) => {
    if (!file) return
    if (!model) return
    setIsLoading(true)
    const prototype = await zipToPrototype(model.id, file)
    try {
      if (prototype) {
        const prototypePayload: Partial<Prototype> = {
          state: prototype.state || 'development',
          apis: { VSS: [], VSC: [] },
          code: prototype.code || '',
          widget_config: prototype.widget_config || '{}',
          description: prototype.description,
          tags: prototype.tags || [],
          image_file: prototype.image_file,
          model_id: model.id,
          name: prototype.name,
          complexity_level: prototype.complexity_level || '3',
          customer_journey: prototype.customer_journey || '{}',
          portfolio: prototype.portfolio || {},
        }
        const data = await createPrototypeService(prototypePayload)
        await addLog({
          name: `New prototype '${data.name}' under model '${model.name}'`,
          description: `Prototype '${data.name}' was created by ${currentUser?.email || currentUser?.name || currentUser?.id}`,
          type: 'new-prototype',
          create_by: currentUser?.id!,
          ref_id: data.id,
          ref_type: 'prototype',
          parent_id: model.id,
        })
        await refetch()
        setIsLoading(false)
      }
    } catch (error) {
      setIsLoading(false)
      console.error('Failed to import prototype:', error)
    }
  }

  const handleFilterChange = (option: string[]) => {
    if (option.length === 0) {
      option = ['Newest']
    } else {
      setSelectedFilters(option)
      localStorage.setItem(
        'prototypeLibrary-selectedFilter',
        JSON.stringify(option),
      ) // Save filter to localStorage
    }
  }

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

          if (selectedFilters.includes('Newest')) {
            return dateB - dateA
          } else if (selectedFilters.includes('Oldest')) {
            return dateA - dateB
          } else if (selectedFilters.includes('Name A-Z')) {
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
      <div className="grid grid-cols-12 w-full h-full">
        <div className="relative flex flex-col h-full col-span-5 xl:col-span-4 overflow-auto">
          <div className="flex items-center pr-3">
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
          </div>

          {filteredPrototypes && filteredPrototypes.length > 0 ? (
            <div className="flex flex-col w-full h-full overflow-y-auto px-3">
              {filteredPrototypes.map((prototype, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedPrototype(prototype)}
                  className="flex w-full cursor-pointer mb-2"
                >
                  <DaItemStandard
                    prototype={prototype}
                    imageMaxWidth="100px"
                    isSelected={selectedPrototype === prototype}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex w-full h-full items-center justify-center">
              <DaText variant="title">No prototype found.</DaText>
            </div>
          )}
          {isAuthorized && (
            <div className="flex w-full h-fit px-3 py-2 bg-white z-10">
              <DaImportFile
                accept=".zip"
                onFileChange={handleImportPrototypeZip}
                className="flex w-full"
              >
                <DaButton
                  variant="outline-nocolor"
                  size="sm"
                  className="flex w-full"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <DaLoader className="mr-2" />
                      Importing...
                    </div>
                  ) : (
                    <>
                      <TbFileImport className="w-5 h-5 mr-2" />
                      Import Prototype
                    </>
                  )}
                </DaButton>
              </DaImportFile>

              <DaPopup
                state={[open, setOpen]}
                trigger={
                  <DaButton
                    variant="solid"
                    size="sm"
                    className="flex w-full ml-2"
                  >
                    <TbPlus className="w-5 h-5 mr-2" />
                    Create New Prototype
                  </DaButton>
                }
              >
                <FormCreatePrototype
                  onClose={() => {
                    setOpen(false)
                  }}
                />
              </DaPopup>
            </div>
          )}
        </div>
        <div className="col-span-7 xl:col-span-8 border-l flex w-full h-full overflow-auto">
          {selectedPrototype ? (
            <PrototypeSummary prototype={selectedPrototype as Prototype} />
          ) : (
            <div className="flex w-full h-full items-center justify-center">
              <DaText variant="title">No prototype selected.</DaText>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PrototypeLibraryList
