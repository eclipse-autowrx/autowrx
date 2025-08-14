// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

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
import DaTabItem from '@/components/atoms/DaTabItem'
import DaSkeletonGrid from '@/components/molecules/DaSkeletonGrid'
import { DaSkeleton } from '@/components/atoms/DaSkeleton'
import DaModelItem from '@/components/molecules/DaModelItem'
import { Link } from 'react-router-dom'
import { ModelLite } from '@/types/model.type'
import useListAllModels from '@/hooks/useListAllModel'

const PageModelList = () => {
  const navigate = useNavigate()
  const [isImporting, setIsImporting] = useState(false)

  const { data: user } = useSelfProfileQuery()

  // Single hook that returns all model types
  const {
    data,
    isLoading,
    error,
    refetch: refetchAllModels,
  } = useListAllModels()

  // In case `data` isn’t ready, destructure safely
  const {
    ownedModels = [],
    contributedModels = [],
    publicReleasedModels = [],
  } = data || {}

  // Overlap filtering
  const userOwnedIds = ownedModels.map((m) => m.id)
  const userContributedIds = contributedModels.map((m) => m.id)

  // Remove any public models that the user owns or contributes to
  const filteredPublic = !user
    ? publicReleasedModels
    : publicReleasedModels.filter(
        (m) =>
          !userOwnedIds.includes(m.id) && !userContributedIds.includes(m.id),
      )

  // Remove from 'my contributions' any that are actually owned
  const filteredContributions = contributedModels.filter(
    (m) => !userOwnedIds.includes(m.id),
  )

  // Refs for scrolling
  const myModelRef = useRef<HTMLDivElement>(null)
  const myContributionRef = useRef<HTMLDivElement>(null)
  const publicRef = useRef<HTMLDivElement>(null)

  // If user not logged in, default tab is "public"
  const [activeTab, setActiveTab] = useState<
    'myModel' | 'myContribution' | 'public'
  >(user ? 'myModel' : 'public')

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
          importedModel.model.model_home_image_file || '/ref/E-Car_Full_Vehicle.png',
        model_files: importedModel.model.model_files || {},
        name: importedModel.model.name || 'New Imported Model',
        extended_apis: importedModel.model.extended_apis || [],
        api_version: importedModel.model.api_version || 'v4.1',
        visibility: 'private',
      }

      const createdModel = await createModelService(newModel)

      // Log
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

      // Prototypes if any
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

      // Refetch model list and navigate
      await refetchAllModels()
      navigate(`/model/${createdModel}`)
    } catch (err) {
      console.error('Error creating model from zip: ', err)
    } finally {
      setIsImporting(false)
    }
  }

  // Tabs
  const tabItems = user
    ? [
        { title: 'My Models', value: 'myModel', count: ownedModels.length },
        {
          title: 'My Contributions',
          value: 'myContribution',
          count: filteredContributions.length,
        },
        { title: 'Public', value: 'public', count: filteredPublic.length },
      ]
    : [{ title: 'Public', value: 'public', count: filteredPublic.length }]

  // Logging for debugging
  // console.log('ownedModels', ownedModels)
  // console.log('contributedModels', contributedModels)
  // console.log('publicReleasedModels', publicReleasedModels)
  // console.log('filteredPublic', filteredPublic)

  return (
    <div className="flex flex-col w-full h-full relative">
      {/* Tabs Bar */}
      <div className="sticky top-0 flex min-h-[52px] border-b border-da-gray-medium/50 bg-da-white z-50">
        {isLoading ? (
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
                        <DaButton variant="solid" size="sm" data-id='btn-open-form-create'>
                          <HiPlus className="mr-1 text-lg" />
                          Create New Model
                        </DaButton>
                      }
                    >
                      <FormCreateModel />
                    </DaPopup>
                  </div>
                </div>

                {/* My Models */}
                {ownedModels.length > 0 && (
                  <div className="pt-6 h-fit">
                    <DaText variant="sub-title" className="text-da-primary-500">
                      My Models
                    </DaText>
                    <DaSkeletonGrid
                      maxItems={{ sm: 1, md: 2, lg: 3, xl: 3 }}
                      className="mt-2"
                      itemWrapperClassName="w-full grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6"
                      primarySkeletonClassName="h-[270px]"
                      secondarySkeletonClassName="hidden"
                      data={ownedModels}
                      isLoading={isLoading}
                      emptyText="No models found. Please create a new model."
                      emptyContainerClassName="h-[50%]"
                    >
                      <div className="grid w-full grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3 pb-4 mt-2">
                        {ownedModels.map((model: ModelLite, index: number) => (
                          <Link key={index} to={`/model/${model.id}`}>
                            <DaModelItem model={model} className='my_model_grid_item'/>
                          </Link>
                        ))}
                      </div>
                    </DaSkeletonGrid>
                  </div>
                )}
              </div>
            )}

            {user && filteredContributions.length > 0 && (
              <div ref={myContributionRef} className="pt-6">
                <DaText variant="sub-title" className="text-da-primary-500">
                  My Contributions
                </DaText>
                <DaSkeletonGrid
                  maxItems={{ sm: 1, md: 2, lg: 3, xl: 3 }}
                  className="mt-2"
                  itemWrapperClassName="w-full grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6"
                  primarySkeletonClassName="h-[270px]"
                  secondarySkeletonClassName="hidden"
                  data={filteredContributions}
                  isLoading={isLoading}
                  emptyText="No contributions found."
                  emptyContainerClassName="h-[50%]"
                >
                  <div className="grid w-full grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3 pb-4 mt-2">
                    {filteredContributions.map(
                      (model: ModelLite, index: number) => (
                        <Link key={index} to={`/model/${model.id}`}>
                          <DaModelItem model={model} />
                        </Link>
                      ),
                    )}
                  </div>
                </DaSkeletonGrid>
              </div>
            )}

            {/* Public Models */}
            <div ref={publicRef} className="py-6">
              <DaText variant="sub-title" className="text-da-primary-500">
                Public
              </DaText>
              <DaSkeletonGrid
                maxItems={{ sm: 1, md: 2, lg: 3, xl: 3 }}
                className="mt-2"
                itemWrapperClassName="w-full grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6"
                primarySkeletonClassName="h-[270px]"
                secondarySkeletonClassName="hidden"
                data={filteredPublic}
                isLoading={isLoading}
                emptyText="No public models found."
                emptyContainerClassName="h-[50%]"
              >
                {filteredPublic.length > 0 && (
                  <div className="grid w-full grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3 pb-4 mt-2">
                    {filteredPublic.map((model: ModelLite, index: number) => (
                      <Link key={index} to={`/model/${model.id}`}>
                        <DaModelItem model={model} />
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
