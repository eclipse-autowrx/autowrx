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

const PrototypeLibraryList = () => {
  const { data: model } = useCurrentModel()
  const { data: fetchedPrototypes, refetch } = useListModelPrototypes(
    model ? model.id : '',
  )
  const [open, setOpen] = useState(false)
  const [selectedPrototype, setSelectedPrototype] = useState<Prototype>()
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthorized] = usePermissionHook([PERMISSIONS.READ_MODEL, model?.id])

  useEffect(() => {
    if (fetchedPrototypes && fetchedPrototypes.length > 0) {
      setSelectedPrototype(fetchedPrototypes[0] as Prototype)
    }
  }, [fetchedPrototypes])

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
        await createPrototypeService(prototypePayload)
        await refetch()
        setIsLoading(false)
        console.log('Prototype imported successfully')
      }
    } catch (error) {
      setIsLoading(false)
      console.error('Failed to import prototype:', error)
    }
  }

  return (
    <div className="flex flex-col w-full h-[99%]">
      <div className="grid grid-cols-12 w-full h-full">
        <div className="col-span-5 xl:col-span-4 h-full overflow-y-auto mt-2 flex flex-col">
          <DaInput
            type="text"
            Icon={TbSearch}
            iconBefore={true}
            placeholder="Enter to search"
            className="w-full py-2 px-4 sticky top-0 !bg-white z-10"
          />
          {fetchedPrototypes && (
            <div className="flex flex-col px-4 mt-2">
              {fetchedPrototypes.map((prototype, index) => (
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
          )}
          {isAuthorized && (
            <div className="grid sticky bottom-0 mt-auto bg-white grid-cols-1 xl:grid-cols-2 gap-2 px-4 py-1">
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
                  <DaButton variant="outline-nocolor" size="sm">
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
        </div>
        <div className="col-span-7 xl:col-span-8 border-l h-full">
          {selectedPrototype && (
            <PrototypeSummary prototype={selectedPrototype as Prototype} />
          )}
        </div>
      </div>
    </div>
  )
}

export default PrototypeLibraryList
