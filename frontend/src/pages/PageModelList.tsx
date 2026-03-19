// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
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

type ModelTab = 'myModel' | 'myContribution' | 'public'

const PageModelList = () => {
  const navigate = useNavigate()
  const [isImporting, setIsImporting] = useState(false)
  const { data: user } = useSelfProfileQuery()

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSection, setActiveSection] = useState<ModelTab>(
    user ? 'myModel' : 'public',
  )

  const queryClient = useQueryClient()
  const { tabCounts } = useModelTabCounts()

  const owned = useListModelsByTab('myModel')
  const contributed = useListModelsByTab('myContribution')
  const publicModels = useListModelsByTab('public')

  const filterModels = useCallback(
    (models: ModelLite[]) => {
      if (!searchQuery.trim()) return models
      const q = searchQuery.toLowerCase()
      return models.filter((m) => m.name?.toLowerCase().includes(q))
    },
    [searchQuery],
  )

  useEffect(() => {
    if (!user) setActiveSection('public')
  }, [user])

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const myModelsRef = useRef<HTMLDivElement>(null)
  const myContribRef = useRef<HTMLDivElement>(null)
  const publicRef = useRef<HTMLDivElement>(null)

  const sectionRefByTab = useMemo(
    () => ({
      myModel: myModelsRef,
      myContribution: myContribRef,
      public: publicRef,
    }),
    [],
  )

  const scrollToSection = useCallback(
    (tab: ModelTab) => {
      const el = sectionRefByTab[tab]?.current
      if (!el) return
      setActiveSection(tab)
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    },
    [sectionRefByTab],
  )

  const handleRetry = useCallback(async () => {
    await Promise.all([owned.refetch(), contributed.refetch(), publicModels.refetch()])
  }, [owned, contributed, publicModels])

  const handleTabClick = useCallback(
    (tab: ModelTab) => {
      setSearchQuery('')
      scrollToSection(tab)
    },
    [scrollToSection],
  )

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

        await owned.refetch()
        queryClient.invalidateQueries({ queryKey: ['modelTabCounts'] })
        navigate(`/model/${createdModel}`)
      } catch (err) {
        console.error('Error creating model from zip: ', err)
      } finally {
        setIsImporting(false)
      }
    },
    [user, owned, navigate, queryClient],
  )

  const handleImportModelZip = useCallback(async (file: File) => {
    const model = await zipToModel(file)
    if (model) {
      setIsImporting(true)
      await createNewModel(model)
    }
  }, [createNewModel])

  const tabItems = useMemo(() => {
    const getCount = (tab: ModelTab) => tabCounts[tab] ?? null
    if (user) {
      return [
        { title: 'My Models', value: 'myModel' as const, count: getCount('myModel') },
        {
          title: 'My Contributions',
          value: 'myContribution' as const,
          count: getCount('myContribution'),
        },
        { title: 'Public', value: 'public' as const, count: getCount('public') },
      ]
    }
    return [{ title: 'Public', value: 'public' as const, count: getCount('public') }]
  }, [user, tabCounts])

  const useLoadMoreObserver = useCallback(
    (
      sentinel: React.RefObject<HTMLDivElement | null>,
      opts: {
        hasNextPage: boolean | undefined
        isFetchingNextPage: boolean
        fetchNextPage: () => any
      },
    ) => {
      useEffect(() => {
        if (!opts.hasNextPage || opts.isFetchingNextPage) return
        const el = sentinel.current
        const root = scrollContainerRef.current
        if (!el || !root) return
        const observer = new IntersectionObserver(
          (entries) => {
            if (entries[0]?.isIntersecting) opts.fetchNextPage()
          },
          { root, rootMargin: '200px', threshold: 0 },
        )
        observer.observe(el)
        return () => observer.disconnect()
      }, [sentinel, opts.hasNextPage, opts.isFetchingNextPage, opts.fetchNextPage])
    },
    [],
  )

  // Track active section while scrolling
  useEffect(() => {
    const root = scrollContainerRef.current
    if (!root) return
    const targets: Array<{ tab: ModelTab; el: HTMLElement | null }> = [
      { tab: 'myModel', el: myModelsRef.current },
      { tab: 'myContribution', el: myContribRef.current },
      { tab: 'public', el: publicRef.current },
    ].filter((t) => !!t.el && (user || t.tab === 'public')) as any

    if (!targets.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (a.boundingClientRect.top ?? 0) - (b.boundingClientRect.top ?? 0))
        const top = visible[0]
        if (!top?.target) return
        const found = targets.find((t) => t.el === top.target)
        if (found) setActiveSection(found.tab)
      },
      {
        root,
        // treat a section as "active" when its header is near the top
        rootMargin: '-40% 0px -55% 0px',
        threshold: 0,
      },
    )

    targets.forEach((t) => t.el && observer.observe(t.el))
    return () => observer.disconnect()
  }, [user])

  return (
    <div className="flex flex-col w-full h-full relative">
      <div className="sticky top-0 flex min-h-[52px] border-b border-muted-foreground/50 bg-background z-50">
        {(owned.isLoading && owned.models.length === 0) ||
        (publicModels.isLoading && publicModels.models.length === 0) ? (
          <div className="flex items-center h-full space-x-6 px-4">
            {tabItems.map((_, index) => (
              <Skeleton key={index} className="w-[100px] h-6" />
            ))}
          </div>
        ) : (
          tabItems.map((tab, index) => (
            <DaTabItem
              key={tab.value}
              active={activeSection === tab.value}
              onClick={() => handleTabClick(tab.value as ModelTab)}
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
            {(owned.error || contributed.error || publicModels.error) && (
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
            {!(owned.error || contributed.error || publicModels.error) && (
              <>
                <div className="pt-6 pb-2">
                  <div className="relative w-full max-w-sm">
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

                {user && (
                  <ModelSection
                    tab="myModel"
                    title="My Models"
                    models={filterModels(owned.models)}
                    isLoading={owned.isLoading}
                    fetchNextPage={owned.fetchNextPage}
                    hasNextPage={owned.hasNextPage}
                    isFetchingNextPage={owned.isFetchingNextPage}
                    emptyText={
                      searchQuery.trim()
                        ? 'No models match your search.'
                        : 'No models found. Please create a new model.'
                    }
                    emptyAction={
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => setCreateDialogOpen(true)}
                        data-id="btn-empty-create-model"
                      >
                        <HiPlus className="mr-1 text-lg" />
                        Create your first model
                      </Button>
                    }
                    headerExtras={
                      <div className="flex">
                        {!isImporting ? (
                          <DaImportFile accept=".zip" onFileChange={handleImportModelZip}>
                            <Button variant="outline" size="sm" className="mr-2">
                              <TbPackageExport className="mr-1 text-lg" /> Import Model
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
                            <Button variant="default" size="sm" data-id="btn-open-form-create">
                              <HiPlus className="mr-1 text-lg" />
                              Create New Model
                            </Button>
                          }
                        >
                          <FormCreateModel />
                        </DaDialog>
                      </div>
                    }
                    sectionRef={myModelsRef}
                    scrollContainerRef={scrollContainerRef}
                    useLoadMoreObserver={useLoadMoreObserver}
                  />
                )}

                {user && (
                  <ModelSection
                    tab="myContribution"
                    title="My Contributions"
                    models={filterModels(contributed.models)}
                    isLoading={contributed.isLoading}
                    fetchNextPage={contributed.fetchNextPage}
                    hasNextPage={contributed.hasNextPage}
                    isFetchingNextPage={contributed.isFetchingNextPage}
                    emptyText={
                      searchQuery.trim() ? 'No models match your search.' : 'No contributions found.'
                    }
                    sectionRef={myContribRef}
                    scrollContainerRef={scrollContainerRef}
                    useLoadMoreObserver={useLoadMoreObserver}
                  />
                )}

                <ModelSection
                  tab="public"
                  title="Public"
                  models={filterModels(publicModels.models)}
                  isLoading={publicModels.isLoading}
                  fetchNextPage={publicModels.fetchNextPage}
                  hasNextPage={publicModels.hasNextPage}
                  isFetchingNextPage={publicModels.isFetchingNextPage}
                  emptyText={
                    searchQuery.trim() ? 'No models match your search.' : 'No public models found.'
                  }
                  sectionRef={publicRef}
                  scrollContainerRef={scrollContainerRef}
                  useLoadMoreObserver={useLoadMoreObserver}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PageModelList

type ModelSectionProps = {
  tab: ModelTab
  title: string
  models: ModelLite[]
  isLoading: boolean
  fetchNextPage: () => any
  hasNextPage: boolean | undefined
  isFetchingNextPage: boolean
  emptyText: string
  emptyAction?: React.ReactNode
  headerExtras?: React.ReactNode
  sectionRef: React.RefObject<HTMLDivElement>
  scrollContainerRef: React.RefObject<HTMLDivElement>
  useLoadMoreObserver: (
    sentinel: React.RefObject<HTMLDivElement>,
    opts: {
      hasNextPage: boolean | undefined
      isFetchingNextPage: boolean
      fetchNextPage: () => any
    },
  ) => void
}

const ModelSection = ({
  title,
  models,
  isLoading,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  emptyText,
  emptyAction,
  headerExtras,
  sectionRef,
  useLoadMoreObserver,
}: ModelSectionProps) => {
  const loadMoreRef = useRef<HTMLDivElement>(null)
  useLoadMoreObserver(loadMoreRef, { hasNextPage, isFetchingNextPage, fetchNextPage })

  return (
    <section className="py-6">
      {/* Anchor for scroll + active section tracking */}
      <div ref={sectionRef} className="scroll-mt-20" />

      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="text-base font-semibold text-primary">{title}</h2>
        {headerExtras}
      </div>

      <DaSkeletonGrid
        maxItems={{ sm: 1, md: 2, lg: 3, xl: 3 }}
        className="mt-2"
        itemWrapperClassName="w-full grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6"
        primarySkeletonClassName="h-[270px]"
        secondarySkeletonClassName="hidden"
        data={models}
        isLoading={isLoading}
        emptyText={emptyText}
        emptyContainerClassName="h-[50%]"
        emptyAction={emptyAction}
      >
        {models.length > 0 && (
          <div className="grid w-full grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3 pb-4">
            {models.map((model: ModelLite) => (
              <Link key={model.id} to={`/model/${model.id}`}>
                <DaModelItem model={model} className="my_model_grid_item" />
              </Link>
            ))}
          </div>
        )}
      </DaSkeletonGrid>

      <div ref={loadMoreRef} className="h-4 flex justify-center py-4">
        {isFetchingNextPage && (
          <TbLoader className="animate-spin text-2xl text-muted-foreground" />
        )}
      </div>
    </section>
  )
}
