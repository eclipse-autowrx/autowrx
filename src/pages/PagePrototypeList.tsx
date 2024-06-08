import { useState, useEffect } from 'react'
import { Prototype } from '@/types/model.type'
import PrototypeSummary from '@/components/organisms/PrototypeSummary'
import { DaInput } from '@/components/atoms/DaInput'
import { DaItemStandard } from '@/components/molecules/DaItemStandard'
import { DaButton } from '@/components/atoms/DaButton'
import DaImportFile from '@/components/atoms/DaImportFile'
import DaPopup from '@/components/atoms/DaPopup'
import DaLoading from '@/components/atoms/DaLoading'
import { TbFileImport, TbPlus } from 'react-icons/tb'
import FormCreatePrototype from '@/components/molecules/forms/FormCreatePrototype'
import useListModelPrototypes from '@/hooks/useListModelPrototypes'
import useCurrentModel from '@/hooks/useCurrentModel'
import { zipToPrototype } from '@/lib/zipUtils'
import { createPrototypeService } from '@/services/prototype.service'
import DaLoader from '@/components/atoms/DaLoader'

const PagePrototypeList = () => {
  const { data: model } = useCurrentModel()
  const { data: fetchedPrototypes, refetch } = useListModelPrototypes(
    model ? model.id : '',
  )

  const [open, setOpen] = useState(false)
  const [selectedPrototype, setSelectedPrototype] = useState<Prototype>()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (fetchedPrototypes && fetchedPrototypes.length > 0) {
      setSelectedPrototype(fetchedPrototypes[0] as Prototype)
    }
  }, [fetchedPrototypes])

  if (!model || !fetchedPrototypes) {
    return (
      <DaLoading
        text="Loading prototypes..."
        timeout={10}
        timeoutText="Failed to load prototypes"
      />
    )
  }

  const handleImportPrototypeZip = async (file: File) => {
    if (!file) return
    setIsLoading(true)
    const prototype = await zipToPrototype(model.id, file)
    // console.log('Imported prototype:', prototype)
    // console.log('Model ID:', model.id)
    try {
      if (prototype) {
        await createPrototypeService(prototype)
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
      <div className="flex h-12 bg-da-primary-100 sticky top-0 z-20"></div>
      <div className="grid grid-cols-12 w-full h-full">
        <div className="col-span-5 xl:col-span-4 h-full overflow-y-auto mt-2 flex flex-col">
          <DaInput
            type="text"
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
                    title={prototype.name}
                    author="John Doe"
                    content={prototype.description.problem}
                    tags={prototype.tags ? prototype.tags : []}
                    imageUrl={prototype.image_file}
                    avatarUrl="/imgs/2.jpg"
                    maxWidth="2000px"
                    imageMaxWidth="100px"
                    isSelected={selectedPrototype === prototype} // Pass the selected prop
                  />
                </div>
              ))}
            </div>
          )}
          <div className="grid sticky bottom-0 mt-auto bg-white grid-cols-1 2xl:grid-cols-2 gap-2 px-4 py-1">
            <DaImportFile accept=".zip" onFileChange={handleImportPrototypeZip}>
              <DaButton variant="outline-nocolor" className="w-full">
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
                <DaButton variant="outline-nocolor">
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

export default PagePrototypeList
