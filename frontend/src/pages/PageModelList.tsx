// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { HiPlus } from 'react-icons/hi'
import { TbLoader, TbPackageExport, TbRefresh, TbSearch } from 'react-icons/tb'
import DaDialog from '@/components/molecules/DaDialog'
import FormCreateModel from '@/components/molecules/forms/FormCreateModel'
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
import { Skeleton } from '@/components/atoms/skeleton'
import DaModelItem from '@/components/molecules/DaModelItem'
import { Link } from 'react-router-dom'
import { ModelLite } from '@/types/model.type'
import useListModelsByTab from '@/hooks/useListModelsByTab'
import useModelTabCounts from '@/hooks/useModelTabCounts'

const PAGE_SIZE = 24

const PageModelList = () => {
  const navigate = useNavigate()
  const [isImporting, setIsImporting] = useState(false)
  const { data: user } = useSelfProfileQuery()

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'myModel' | 'myContribution' | 'public'>(
    user ? 'myModel' : 'public',
  )

  const queryClient = useQueryClient()
  const { tabCounts } = useModelTabCounts()

  const {
    models,
    totalResults,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useListModelsByTab(activeTab)

  const filteredModels = useMemo(() => {
    if (!searchQuery.trim()) return models
    const q = searchQuery.toLowerCase()
    return models.filter((m) => m.name?.toLowerCase().includes(q))
  }, [models, searchQuery])

  useEffect(() => {
    if (!user) setActiveTab('public')
    else setActiveTab((current) => current)
  }, [user])

  if (error) {
    console.error('[PageModelList] Error loading models:', error)
  }

  const handleRetry = useCallback(() => {
    refetch()
  }, [refetch])

  const handleTabClick = useCallback((tab: 'myModel' | 'myContribution' | 'public') => {
    setActiveTab(tab)
    setSearchQuery('')
  }, [])

  const createNewModel = useCallback(
    async (importedModel: any) => {
      if (!importedModel?.model) return
      try {
        const newModel: ModelCreate = {
          custom_apis: importedModel.model.custom_apis
            ? JSON.stringify(importedModel.model.custom_apis)
            : 'Empty',
          cvi: importedModel.model.cvi,
          main_api: importedModel.model.main_api || 'Vehicle',
          model_home_image_file:
            importedModel.model.model_home_image_file ||
            '/ref/E-Car_Full_Vehicle.png',
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

        if (importedModel.prototypes?.length > 0) {
          await Promise.all(
            importedModel.prototypes.map(async (proto: Partial<Prototype>) => {
              const newPrototype: Partial<Prototype> = {
                state: proto.state || 'development',
                apis: { VSS: [], VSC: [] },
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
            }),
          )
        }

        await refetch()
        queryClient.invalidateQueries({ queryKey: ['modelTabCounts'] })
        navigate(`/model/${createdModel}`)
      } catch (err) {
        console.error('Error creating model from zip: ', err)
      } finally {
        setIsImporting(false)
      }
    },
    [user, refetch, navigate, queryClient],
  )

  const handleImportModelZip = useCallback(async (file: File) => {
    const model = await zipToModel(file)
    if (model) {
      setIsImporting(true)
      await createNewModel(model)
    }
  }, [createNewModel])

  const tabItems = useMemo(() => {
    const getCount = (tab: 'myModel' | 'myContribution' | 'public') =>
      tabCounts[tab] ?? null

    if (user) {
      return [
        {
          title: 'My Models',
          value: 'myModel' as const,
          count: getCount('myModel'),
        },
        {
          title: 'My Contributions',
          value: 'myContribution' as const,
          count: getCount('myContribution'),
        },
        { title: 'Public', value: 'public' as const, count: getCount('public') },
      ]
    }
    return [
      { title: 'Public', value: 'public' as const, count: getCount('public') },
    ]
  }, [user, tabCounts])

  const loadMoreRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return
    const el = loadMoreRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) fetchNextPage()
      },
      { rootMargin: '100px', threshold: 0 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const sectionTitle = useMemo(() => {
    switch (activeTab) {
      case 'myModel':
        return 'My Models'
      case 'myContribution':
        return 'My Contributions'
      case 'public':
        return 'Public'
      default:
        return ''
    }
  }, [activeTab])

  const emptyText = useMemo(() => {
    if (searchQuery.trim()) return 'No models match your search.'
    switch (activeTab) {
      case 'myModel':
        return 'No models found. Please create a new model.'
      case 'myContribution':
        return 'No contributions found.'
      case 'public':
        return 'No public models found.'
      default:
        return ''
    }
  }, [activeTab, searchQuery])

  const emptyAction = useMemo(() => {
    if (activeTab !== 'myModel' || !user) return null
    return (
      <Button
        variant="default"
        size="sm"
        onClick={() => setCreateDialogOpen(true)}
        data-id="btn-empty-create-model"
      >
        <HiPlus className="mr-1 text-lg" />
        Create your first model
      </Button>
    )
  }, [activeTab, user])

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [columnCount, setColumnCount] = useState(3)
  useEffect(() => {
    const update = () => {
      if (typeof window === 'undefined') return
      if (window.innerWidth >= 1280) setColumnCount(3)
      else if (window.innerWidth >= 768) setColumnCount(2)
      else setColumnCount(1)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const rowCount = Math.ceil(filteredModels.length / columnCount) || 0
  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 302,
    overscan: 2,
  })

  return (
    <div className="flex flex-col w-full h-full relative">
      <div className="sticky top-0 flex min-h-[52px] border-b border-muted-foreground/50 bg-background z-50">
        {isLoading && models.length === 0 ? (
          <div className="flex items-center h-full space-x-6 px-4">
            {tabItems.map((_, index) => (
              <Skeleton key={index} className="w-[100px] h-6" />
            ))}
          </div>
        ) : (
          tabItems.map((tab, index) => (
            <DaTabItem
              key={tab.value}
              active={activeTab === tab.value}
              onClick={() => handleTabClick(tab.value)}
            >
              {tab.title}
              {tab.count !== null && (
                <div className="flex min-w-5 px-1.5 py-0.5 items-center justify-center text-xs ml-1 bg-gray-200 rounded-md">
                  {tab.count}
                </div>
              )}
            </DaTabItem>
          ))
        )}
      </div>

      <div className="flex w-full h-[calc(100%-52px)] items-start bg-slate-200 p-2">
        <div
          ref={scrollContainerRef}
          className="flex flex-col w-full h-full bg-background rounded-lg overflow-y-auto"
        >
          <div className="flex flex-col w-full h-full container px-4 pb-6">
            {error && (
              <div className="flex flex-col items-center justify-center gap-3 py-12">
                <p className="text-base text-destructive font-medium">
                  Something went wrong. Please try again.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  className="gap-2"
                >
                  <TbRefresh className="text-lg" />
                  Retry
                </Button>
              </div>
            )}
            {!error && isLoading && models.length === 0 && (
              <p className="text-sm text-muted-foreground py-2">
                Loading models…
              </p>
            )}
            {!error && user && activeTab === 'myModel' && (
              <div className="flex flex-col w-full h-fit pt-6">
                <div className="flex w-full items-center justify-between mb-4">
                  <p className="text-sm font-medium text-primary">
                    Select a vehicle model to start
                  </p>
                  <div className="flex">
                    {!isImporting ? (
                      <DaImportFile
                        accept=".zip"
                        onFileChange={handleImportModelZip}
                      >
                        <Button variant="outline" size="sm" className="mr-2">
                          <TbPackageExport className="mr-1 text-lg" /> Import
                          Model
                        </Button>
                      </DaImportFile>
                    ) : (
                      <p className="flex items-center text-base text-muted-foreground mr-2">
                        <TbLoader className="animate-spin text-lg mr-2" />
                        Importing model ...
                      </p>
                    )}
                    <DaDialog
                      open={createDialogOpen}
                      onOpenChange={setCreateDialogOpen}
                      trigger={
                        <Button
                          variant="default"
                          size="sm"
                          data-id="btn-open-form-create"
                        >
                          <HiPlus className="mr-1 text-lg" />
                          Create New Model
                        </Button>
                      }
                    >
                      <FormCreateModel />
                    </DaDialog>
                  </div>
                </div>
              </div>
            )}

            {!error && (
            <div className="py-6">
              <div className="flex items-center justify-between gap-4 mb-4">
                <h2 className="text-base font-semibold text-primary">
                  {sectionTitle}
                </h2>
                <div className="relative flex-1 max-w-xs">
                  <TbSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search models..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    data-id="model-search-input"
                  />
                </div>
              </div>
              <DaSkeletonGrid
                maxItems={{ sm: 1, md: 2, lg: 3, xl: 3 }}
                className="mt-2"
                itemWrapperClassName="w-full grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6"
                primarySkeletonClassName="h-[270px]"
                secondarySkeletonClassName="hidden"
                data={filteredModels}
                isLoading={isLoading}
                emptyText={emptyText}
                emptyContainerClassName="h-[50%]"
                emptyAction={emptyAction}
              >
                {filteredModels.length > 0 && (
                  <div
                    style={{
                      height: `${rowVirtualizer.getTotalSize()}px`,
                      width: '100%',
                      position: 'relative',
                    }}
                  >
                    {rowVirtualizer.getVirtualItems().map((virtualRow) => (
                      <div
                        key={virtualRow.key}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      >
                        <div className="grid w-full grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3 pb-4">
                          {filteredModels
                            .slice(
                              virtualRow.index * columnCount,
                              (virtualRow.index + 1) * columnCount,
                            )
                            .map((model: ModelLite) => (
                              <Link key={model.id} to={`/model/${model.id}`}>
                                <DaModelItem
                                  model={model}
                                  className="my_model_grid_item"
                                />
                              </Link>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </DaSkeletonGrid>
              <div ref={loadMoreRef} className="h-4 flex justify-center py-4">
                {isFetchingNextPage && (
                  <TbLoader className="animate-spin text-2xl text-muted-foreground" />
                )}
              </div>
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PageModelList
