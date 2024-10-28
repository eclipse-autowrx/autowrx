import { useState, useEffect } from 'react'
import { ModelGrid } from '@/components/organisms/ModelGrid'
import { DaText } from '@/components/atoms/DaText'
import { DaButton } from '@/components/atoms/DaButton'
import { HiPlus } from 'react-icons/hi'
import DaPopup from '@/components/atoms/DaPopup'
import FormCreateModel from '@/components/molecules/forms/FormCreateModel'
import { TbLoader, TbPackageExport } from 'react-icons/tb'
import DaImportFile from '@/components/atoms/DaImportFile'
import { zipToModel } from '@/lib/zipUtils'
import { createModelService } from '@/services/model.service'
import { createPrototypeService } from '@/services/prototype.service'
import { Model, ModelCreate } from '@/types/model.type'
import { Prototype } from '@/types/model.type'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { addLog } from '@/services/log.service'
import { useNavigate } from 'react-router-dom'
import useListModelLite from '@/hooks/useListModelLite'

const PageModelList = () => {
  const [isImporting, setIsImporting] = useState(false)
  const navigate = useNavigate()
  const { refetch: refetchModelList } = useListModelLite()
  const { data: user } = useSelfProfileQuery()

  const handleImportModelZip = async (file: File) => {
    const model = await zipToModel(file)
    if (model) {
      setIsImporting(true)
      await createNewModel(model)
    }
  }

  const createNewModel = async (importedModel: any) => {
    if (!importedModel || !importedModel.model) return
    try {
      const newModel: ModelCreate = {
        custom_apis: importedModel.model.custom_apis
          ? JSON.stringify(importedModel.model.custom_apis)
          : 'Empty',
        cvi: importedModel.model.cvi,
        main_api: importedModel.model.main_api || 'Vehicle',
        model_home_image_file:
          importedModel.model.model_home_image_file ||
          'https://firebasestorage.googleapis.com/v0/b/digital-auto.appspot.com/o/media%2Fcar_full_ed.PNG?alt=media&token=ea75b8c1-a57a-44ea-9edb-9816131f9905',
        model_files: importedModel.model.model_files || {},
        name: importedModel.model.name || 'New Imported Model',
        extended_apis: importedModel.model.extended_apis || [],
        api_version: importedModel.model.api_version || 'v4.1',
        visibility: 'private',
      }
      //
      const createdModel = await createModelService(newModel)

      addLog({
        name: `New model '${createdModel.name}' with visibility: ${createdModel.visibility}`,
        description: `New model '${createdModel.name}' was created by ${user?.email || user?.name || user?.id}`,
        type: 'new-model',
        create_by: user?.id!,
        ref_id: createdModel.id,
        ref_type: 'model',
      })
      //

      if (importedModel.prototypes.length > 0) {
        const prototypePromises = importedModel.prototypes.map(
          async (proto: Partial<Prototype>) => {
            const newPrototype: Partial<Prototype> = {
              state: proto.state || 'development',
              apis: {
                VSS: [],
                VSC: [],
              },
              code: proto.code || '',
              widget_config: proto.widget_config || '{}',
              description: proto.description,
              tags: proto.tags || [],
              image_file: proto.image_file,
              model_id: createdModel,
              name: proto.name,
              complexity_level: proto.complexity_level || '3',
              customer_journey: proto.customer_journey || '{}',
              portfolio: proto.portfolio || {},
            }

            return createPrototypeService(newPrototype)
          },
        )
        await Promise.all(prototypePromises)
      }

      await refetchModelList()
      navigate(`/model/${createdModel}`)
    } catch (err) {
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="col-span-full h-full flex flex-col px-2 py-4 container space-y-2">
      <div className="relative flex w-full h-full mt-4 items-start">
        <ModelGrid />
        {user && (
          <div className="absolute right-0 flex">
            {!isImporting ? (
              <DaImportFile accept=".zip" onFileChange={handleImportModelZip}>
                <DaButton variant="outline-nocolor" size="sm" className="mr-2">
                  <TbPackageExport className="mr-1 text-lg" /> Import Model
                </DaButton>
              </DaImportFile>
            ) : (
              <DaText
                variant="regular"
                className="flex items-center text-da-gray-medium mr-2"
              >
                <TbLoader className="animate-spin text-lg mr-2" />
                Importing model ...
              </DaText>
            )}
            <DaPopup
              trigger={
                <DaButton variant="solid" size="sm" className="">
                  <HiPlus className="mr-1 text-lg" />
                  Create New Model
                </DaButton>
              }
            >
              <FormCreateModel />
            </DaPopup>
          </div>
        )}
      </div>
    </div>
  )
}

export default PageModelList
