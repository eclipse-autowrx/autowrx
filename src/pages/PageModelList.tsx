import { useState, useRef } from 'react'
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
import { ModelCreate, Prototype } from '@/types/model.type'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { addLog } from '@/services/log.service'
import { useNavigate } from 'react-router-dom'
import useListModelLite from '@/hooks/useListModelLite'
import useListModelContribution from '@/hooks/useListModelContribution'
import DaTabItem from '@/components/atoms/DaTabItem'
import DaSkeletonGrid from '@/components/molecules/DaSkeletonGrid'
import { DaSkeleton } from '@/components/atoms/DaSkeleton'
import { DaItemVerticalType2 } from '@/components/molecules/DaItemVerticalType2'
import { Link } from 'react-router-dom'
import { ModelLite } from '@/types/model.type'

const PageModelList = () => {
  const navigate = useNavigate()
  const [isImporting, setIsImporting] = useState(false)

  const { data: user } = useSelfProfileQuery()

  // All public models
  const {
    data: allModel,
    isLoading: isLoadingAllModel,
    refetch: refetchModelList,
  } = useListModelLite()
  // My own models
  const { data: myModelsData, isLoading: isLoadingMyModels } = useListModelLite(
    {
      created_by: user?.id,
    },
  )
  // Models I contributed to
  const { data: contributionModelData, isLoading: isLoadingContributionModel } =
    useListModelContribution()

  // Refs for scrolling
  const myModelRef = useRef<HTMLDivElement>(null)
  const myContributionRef = useRef<HTMLDivElement>(null)
  const publicRef = useRef<HTMLDivElement>(null)

  // If user not logged in, default tab is "public"
  const [activeTab, setActiveTab] = useState<
    'myModel' | 'myContribution' | 'public'
  >(user ? 'myModel' : 'public')

  // Prepare data
  const myModels = myModelsData?.results || []
  const contributionModelsRaw = contributionModelData?.results || []
  const publicModelsRaw =
    allModel?.results?.filter(
      (m) => m.visibility === 'public' && m.state === 'released',
    ) || []

  // 1) Collect model IDs for user-owned models
  const userOwnedIds = myModels.map((m) => m.id)

  // 2) Collect model IDs for user-contributed models
  const userContributedIds = contributionModelsRaw.map((m) => m.id)

  // 3) Filter out any model the user owns OR contributes to from 'Public'
  let filteredPublic: ModelLite[]
  if (!user) {
    // Guest => show all public
    filteredPublic = publicModelsRaw
  } else {
    // Logged in => remove user-owned or user-contributed models from public
    filteredPublic = publicModelsRaw.filter(
      (m) => !userOwnedIds.includes(m.id) && !userContributedIds.includes(m.id),
    )
  }

  // 4) Filter 'myContributions' by removing models the user actually owns
  const filteredContributions = contributionModelsRaw.filter(
    (m) => !userOwnedIds.includes(m.id),
  )

  const isLoadingAny =
    isLoadingAllModel || isLoadingMyModels || isLoadingContributionModel

  // Handle tab click -> scroll to respective section
  const handleTabClick = (tab: 'myModel' | 'myContribution' | 'public') => {
    setActiveTab(tab)
    switch (tab) {
      case 'myModel':
        myModelRef.current?.scrollIntoView({ behavior: 'smooth' })
        break
      case 'myContribution':
        myContributionRef.current?.scrollIntoView({ behavior: 'smooth' })
        break
      case 'public':
        publicRef.current?.scrollIntoView({ behavior: 'smooth' })
        break
    }
  }

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
      console.error('Error creating model from zip: ', err)
    } finally {
      setIsImporting(false)
    }
  }

  const tabItems = user
    ? [
        { title: 'My Models', value: 'myModel', count: myModels.length },
        {
          title: 'My Contributions',
          value: 'myContribution',
          count: filteredContributions.length,
        },
        { title: 'Public', value: 'public', count: filteredPublic.length },
      ]
    : [{ title: 'Public', value: 'public', count: filteredPublic.length }]

  return (
    <div className="flex flex-col w-full h-full relative">
      {/* Tabs Bar */}
      <div className="sticky top-0 flex min-h-[52px] border-b border-da-gray-medium/50 bg-da-white z-50">
        {isLoadingAny ? (
          <div className="flex items-center h-full space-x-6 px-4">
            {tabItems.map((_, index) => (
              <DaSkeleton key={index} className="w-[100px] h-6" />
            ))}
          </div>
        ) : (
          tabItems.map((tab, index) => (
            <DaTabItem
              key={index}
              active={activeTab === tab.value}
              onClick={() => handleTabClick(tab.value as typeof activeTab)}
            >
              {tab.title}
              <div className="flex min-w-5 px-1.5 !py-0.5 items-center justify-center text-xs ml-1 bg-gray-200 rounded-md">
                {tab.count}
              </div>
            </DaTabItem>
          ))
        )}
      </div>

      <div className="flex w-full h-[calc(100%-52px)] items-start bg-slate-200 p-2">
        <div className="flex flex-col w-full h-full bg-white rounded-lg overflow-y-auto">
          <div className="flex flex-col w-full h-full container px-4 pb-6">
            {user && (
              <div className="flex flex-col w-full h-fit pt-6" ref={myModelRef}>
                <div className="flex w-full items-center justify-between mb-4">
                  <DaText
                    variant="small-medium"
                    className="text-da-primary-500"
                  >
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
                        <DaButton variant="solid" size="sm">
                          <HiPlus className="mr-1 text-lg" />
                          Create New Model
                        </DaButton>
                      }
                    >
                      <FormCreateModel />
                    </DaPopup>
                  </div>
                </div>

                {myModels?.length > 0 && (
                  <div className="py-2 h-fit">
                    <DaText variant="sub-title" className="text-da-primary-500">
                      My Models
                    </DaText>
                    <DaSkeletonGrid
                      maxItems={{ sm: 1, md: 2, lg: 3, xl: 4 }}
                      className="mt-2"
                      primarySkeletonClassName="h-[240px]"
                      secondarySkeletonClassName="hidden"
                      data={myModels}
                      isLoading={isLoadingMyModels}
                      emptyText="No models found. Please create a new model."
                      emptyContainerClassName="h-[50%]"
                    >
                      <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 pb-4 mt-2">
                        {myModels.map((item, index) => (
                          <Link key={index} to={`/model/${item.id}`}>
                            <DaItemVerticalType2
                              title={item.name}
                              imageUrl={item.model_home_image_file}
                              tags={item.tags?.map((t) => t.tag) || []}
                              maxWidth="800px"
                            />
                          </Link>
                        ))}
                      </div>
                    </DaSkeletonGrid>
                  </div>
                )}
              </div>
            )}

            {user && filteredContributions?.length > 0 && (
              <div ref={myContributionRef} className="py-2">
                <DaText variant="sub-title" className="text-da-primary-500">
                  My Contributions
                </DaText>
                <DaSkeletonGrid
                  maxItems={{ sm: 1, md: 2, lg: 3, xl: 4 }}
                  className="mt-2"
                  primarySkeletonClassName="h-[240px]"
                  secondarySkeletonClassName="hidden"
                  data={filteredContributions}
                  isLoading={isLoadingContributionModel}
                  emptyText="No contributions found."
                  emptyContainerClassName="h-[50%]"
                >
                  <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 pb-4 mt-2">
                    {filteredContributions.map((item, index) => (
                      <Link key={index} to={`/model/${item.id}`}>
                        <DaItemVerticalType2
                          title={item.name}
                          imageUrl={item.model_home_image_file}
                          tags={item.tags?.map((t) => t.tag) || []}
                          maxWidth="800px"
                        />
                      </Link>
                    ))}
                  </div>
                </DaSkeletonGrid>
              </div>
            )}

            <div ref={publicRef} className="py-2">
              <DaText variant="sub-title" className="text-da-primary-500">
                Public
              </DaText>
              <DaSkeletonGrid
                maxItems={{ sm: 1, md: 2, lg: 3, xl: 4 }}
                className="mt-2"
                primarySkeletonClassName="h-[240px]"
                secondarySkeletonClassName="hidden"
                data={filteredPublic}
                isLoading={isLoadingAllModel}
                emptyText="No public models found."
                emptyContainerClassName="h-[50%]"
              >
                {filteredPublic?.length > 0 && (
                  <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 pb-4 mt-2">
                    {filteredPublic.map((item, index) => (
                      <Link key={index} to={`/model/${item.id}`}>
                        <DaItemVerticalType2
                          title={item.name}
                          imageUrl={item.model_home_image_file}
                          tags={item.tags?.map((t) => t.tag) || []}
                          maxWidth="800px"
                        />
                      </Link>
                    ))}
                  </div>
                )}
              </DaSkeletonGrid>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PageModelList
