import { useState, useEffect } from 'react'
import { DaText } from '@/components/atoms/DaText'
import { DaButton } from '@/components/atoms/DaButton'
import { HiPlus } from 'react-icons/hi'
import DaPopup from '@/components/atoms/DaPopup'
import FormCreateModel from '@/components/molecules/forms/FormCreateModel'
import { TbLoader, TbPackageExport } from 'react-icons/tb'
import DaImportFile from '@/components/atoms/DaImportFile'
import { zipToModel } from '@/lib/zipUtils'
import { createModelService } from '@/services/model.service'
import { createBulkPrototypesService } from '@/services/prototype.service'
import { ModelCreate } from '@/types/model.type'
import { Prototype } from '@/types/model.type'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { addLog } from '@/services/log.service'
import { useNavigate } from 'react-router-dom'
import useListModelLite from '@/hooks/useListModelLite'
import { DaItemVerticalType2 } from '@/components/molecules/DaItemVerticalType2'
import { Link } from 'react-router-dom'
import useListModelContribution from '@/hooks/useListModelContribution'
import DaSkeletonGrid from '@/components/molecules/DaSkeletonGrid'

const PageModelList = () => {
  const [isImporting, setIsImporting] = useState(false)
  const navigate = useNavigate()
  const { refetch: refetchModelList } = useListModelLite()

  const { data: allModel, isLoading: isLoadingPublicModel } = useListModelLite()
  const { data: contributionModel, isLoading: isLoadingContributionModel } =
    useListModelContribution()
  const { data: user } = useSelfProfileQuery()
  const { data: myModels, isLoading: isLoadingMyModels } = useListModelLite({
    created_by: user?.id,
  })

  const publicModels =
    allModel?.results?.filter((model) => model.visibility === 'public') || []
  const myModelsList = myModels?.results || []
  const contributionModels = contributionModel?.results || []

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

      const createdModel = await createModelService(newModel)

      addLog({
        name: `New model '${createdModel.name}' with visibility: ${createdModel.visibility}`,
        description: `New model '${createdModel.name}' was created by ${
          user?.email || user?.name || user?.id
        }`,
        type: 'new-model',
        create_by: user?.id!,
        ref_id: createdModel.id,
        ref_type: 'model',
      })

      try {
        if (importedModel.prototypes.length > 0) {
          const prototypesData = importedModel.prototypes.map(
            (proto: Partial<Prototype>) => ({
              state: proto.state || 'development',
              apis: {
                VSS: [],
                VSC: [],
              },
              code: proto.code || '',
              widget_config: proto.widget_config || '{}',
              description: {
                problem: proto.description?.problem || '',
                says_who: proto.description?.says_who || '',
                solution: proto.description?.solution || '',
                status: proto.description?.status || '',
                text: proto.description?.text || '',
              },
              image_file: proto.image_file,
              model_id: createdModel,
              name: proto.name,
              complexity_level: proto.complexity_level || '3',
              customer_journey: proto.customer_journey || '{}',
              portfolio: proto.portfolio || {},
            }),
          )

          await createBulkPrototypesService(prototypesData)
        }
      } catch (error) {
        console.error('Failed to import prototypes', error)
      }

      await refetchModelList()
      navigate(`/model/${createdModel}`)
    } catch (err) {
    } finally {
      setIsImporting(false)
    }
  }

  const renderSection = (
    title: string,
    dataArray: any[],
    isLoading: boolean,
    isLastSection: boolean = false, // New parameter to check if it's the last section
  ) => {
    if (!isLoading && dataArray.length === 0) return null

    return (
      <div className="flex flex-col space-y-2 mb-6 container">
        <DaText variant="regular-bold" className="text-da-primary-500">
          {title} ({dataArray.length})
        </DaText>
        <DaSkeletonGrid
          maxItems={{
            sm: 1,
            md: 2,
            lg: 3,
            xl: 8,
          }}
          primarySkeletonClassName="h-[240px]"
          secondarySkeletonClassName="hidden"
          timeout={20}
          timeoutText="Failed to load models. Please reload the page."
          timeoutContainerClassName="h-[50%]"
          data={dataArray}
          isLoading={isLoading}
          // Remove emptyText since we hide the section if empty
          emptyText=""
          emptyContainerClassName=""
        >
          {dataArray.length > 0 && (
            <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-4 pb-4">
              {dataArray.map((item, index) => (
                <Link key={index} to={`/model/${item.id}`}>
                  <DaItemVerticalType2
                    title={item.name}
                    imageUrl={item.model_home_image_file}
                    tags={item.tags?.map((tag: any) => `${tag.tag}`) || []}
                    maxWidth="800px"
                  />
                </Link>
              ))}
            </div>
          )}
        </DaSkeletonGrid>
        {!isLastSection && <div className="border-b" />}
      </div>
    )
  }

  return (
    <div className="flex flex-col w-full h-full relative">
      <div className="flex w-full h-full items-start bg-slate-200 p-2">
        <div className="flex flex-col w-full h-full bg-white rounded-lg overflow-y-auto p-4">
          {user && (
            <>
              <div className="flex w-full pt-3 pb-6 items-center justify-between container">
                <DaText variant="small-medium" className="text-da-primary-500">
                  Select a vehicle model to start
                </DaText>

                <div className="flex">
                  {!isImporting ? (
                    <DaImportFile
                      accept=".zip"
                      onFileChange={handleImportModelZip}
                    >
                      <DaButton
                        variant="outline-nocolor"
                        size="sm"
                        className="mr-2"
                      >
                        <TbPackageExport className="mr-1 text-lg" /> Import
                        Model
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
              </div>
              {renderSection('My Models', myModelsList, isLoadingMyModels)}
              {renderSection(
                'My Contributions',
                contributionModels,
                isLoadingContributionModel,
              )}
            </>
          )}

          {renderSection('Public', publicModels, isLoadingPublicModel, true)}
        </div>
      </div>
    </div>
  )
}

export default PageModelList
