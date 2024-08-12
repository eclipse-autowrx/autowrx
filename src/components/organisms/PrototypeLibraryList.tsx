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

const PrototypeLibraryList = () => {
  const { data: model } = useCurrentModel()
  const { data: fetchedPrototypes, refetch } = useListModelPrototypes(
    model ? model.id : '',
  )
  const [open, setOpen] = useState(false)
  const [selectedPrototype, setSelectedPrototype] = useState<Prototype>()
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthorized] = usePermissionHook([PERMISSIONS.READ_MODEL, model?.id])
  const [searchInput, setSearchInput] = useState('')
  const location = useLocation()
  const navigate = useNavigate()
  const { prototype_id } = useParams()

  const { data: currentUser } = useSelfProfileQuery()

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
      const querys = new URLSearchParams(location.search) // set search term from querys
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

  if (!model || !fetchedPrototypes) {
    return (
      <DaLoading
        text="Loading prototypes..."
        timeoutText="Failed to load prototypes. Please try again."
      />
    )
  }

  const handleImportPrototypeZip = async (file: File) => {
    if (!file) return
    setIsLoading(true)
    const prototype = await zipToPrototype(model.id, file)
    try {
      if (prototype) {
        const prototypePayload: Partial<Prototype> = {
          state: prototype.state || 'development',
          apis: {
            VSS: [],
            VSC: [],
          },
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

  const filteredPrototypes = fetchedPrototypes.filter((prototype) =>
    prototype.name.toLowerCase().includes(searchInput.toLowerCase()),
  )

  return (
    <div className="flex flex-col w-full h-[99%]">
      <div className="grid grid-cols-12 w-full h-full">
        <div className="col-span-5 xl:col-span-4 h-full overflow-y-auto mt-2 flex flex-col">
          {isAuthorized && (
            <div className="grid sticky bottom-0 bg-white grid-cols-1 xl:grid-cols-2 gap-2 px-4 py-1">
              <DaImportFile
                accept=".zip"
                onFileChange={handleImportPrototypeZip}
              >
                <DaButton
                  variant="outline-nocolor"
                  size="sm"
                  className="w-full"
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
                  <DaButton variant="solid" size="sm">
                    <TbPlus className="w-5 h-5 mr-2" />
                    Create New Prototype
                  </DaButton>
                }
              >
                <FormCreatePrototype
                  model_id={model.id}
                  onClose={() => {
                    setOpen(false)
                  }}
                />
              </DaPopup>
            </div>
          )}
          <DaInput
            type="text"
            Icon={TbSearch}
            iconBefore={true}
            placeholder="Enter to search"
            className="w-full py-2 px-4 sticky top-0 !bg-white z-10"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          {filteredPrototypes && filteredPrototypes.length > 0 ? (
            <div className="flex flex-col px-4 mt-2">
              {filteredPrototypes.map((prototype, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedPrototype(prototype)}
                  className="cursor-pointer mb-2"
                >
                  <DaItemStandard
                    prototype={prototype}
                    creatorId={prototype.created_by}
                    maxWidth="2000px"
                    imageMaxWidth="100px"
                    isSelected={selectedPrototype === prototype}
                  />
                </div>
              ))}
              <div className="grow"> </div>
            </div>
          ) : (
            <div className="flex w-full h-full items-center justify-center">
              <DaText variant="title">No prototype found.</DaText>
            </div>
          )}
        </div>
        <div className="col-span-7 xl:col-span-8 border-l h-full">
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
