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
import { createPrototypeService } from '@/services/prototype.service'
import { Model, ModelCreate } from '@/types/model.type'
import { Prototype } from '@/types/model.type'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { addLog } from '@/services/log.service'
import { useNavigate } from 'react-router-dom'
import useListModelLite from '@/hooks/useListModelLite'
import { DaItemVerticalType2 } from '@/components/molecules/DaItemVerticalType2'
import { Link } from 'react-router-dom'
import useListModelContribution from '@/hooks/useListModelContribution'
import DaLoadingWrapper from '@/components/molecules/DaLoadingWrapper'
import DaTabItem from '@/components/atoms/DaTabItem'
import { ModelLite } from '@/types/model.type'

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
  const [activeTab, setActiveTab] = useState<
    'public' | 'myModel' | 'myContribution'
  >('myModel')
  const [filteredModels, setFilteredModels] = useState<ModelLite[]>([])

  useEffect(() => {
    if (user) {
      setActiveTab('myModel')
    } else {
      setActiveTab('public')
    }
  }, [user])

  useEffect(() => {
    if (activeTab === 'myContribution' && user) {
      setFilteredModels(contributionModel?.results || [])
    } else if (activeTab === 'myModel' && user) {
      setFilteredModels(myModels?.results || [])
    } else if (activeTab === 'public') {
      const publicModels =
        allModel?.results?.filter((model) => model.visibility === 'public') ||
        []
      setFilteredModels(publicModels)
    }
  }, [activeTab, contributionModel, allModel, myModels, user])

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

  const cardIntro = user
    ? [
        { title: 'My Models', value: 'myModel' },
        { title: 'My Contributions', value: 'myContribution' },
        { title: 'Public', value: 'public' },
      ]
    : [{ title: 'Public', value: 'public' }]

  return (
    <div className="flex flex-col w-full h-full relative">
      <div className="sticky top-0 flex min-h-[52px] border-b border-da-gray-medium/50 bg-da-white z-50">
        {cardIntro.map((intro, index) => (
          <DaTabItem
            active={activeTab === intro.value}
            key={index}
            onClick={() =>
              setActiveTab(
                intro.value as 'public' | 'myModel' | 'myContribution',
              )
            }
          >
            {intro.title}
          </DaTabItem>
        ))}
      </div>
      <div className="flex w-full h-[calc(100%-52px)] items-start bg-slate-200 p-2">
        <div className="flex flex-col w-full h-full bg-white rounded-lg overflow-y-auto">
          <div className="flex flex-col w-full h-full container">
            {!isImporting &&
              !isLoadingContributionModel &&
              !isLoadingMyModels &&
              !isLoadingPublicModel && (
                <div className="flex w-full py-6 items-center justify-between">
                  <DaText
                    variant="small-medium"
                    className="text-da-primary-500"
                  >
                    Select a vehicle model to start
                  </DaText>
                  {user && (
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
                  )}
                </div>
              )}
            <DaLoadingWrapper
              loadingMessage="Loading models..."
              isLoading={
                isLoadingPublicModel ||
                isLoadingContributionModel ||
                isLoadingMyModels
              }
              data={filteredModels}
              emptyMessage="No models found. Please create a new model."
              timeoutMessage="Failed to load models. Please try again."
            >
              <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-4 pb-4">
                {filteredModels?.map((item, index) => (
                  <Link key={index} to={`/model/${item.id}`}>
                    <DaItemVerticalType2
                      title={item.name}
                      imageUrl={item.model_home_image_file}
                      tags={item.tags?.map((tag) => `${tag.tag}`) || []}
                      maxWidth="800px"
                    />
                  </Link>
                ))}
              </div>
            </DaLoadingWrapper>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PageModelList
