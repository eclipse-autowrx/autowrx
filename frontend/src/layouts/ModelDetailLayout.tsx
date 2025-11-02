// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useEffect, useState } from 'react'
import DaTabItem from '@/components/atoms/DaTabItem'
import useModelStore from '@/stores/modelStore'
import { Model } from '@/types/model.type'
import { matchRoutes, Outlet, useLocation } from 'react-router-dom'
import { Skeleton } from '@/components/atoms/skeleton'
import { Spinner } from '@/components/atoms/spinner'
import useListModelPrototypes from '@/hooks/useListModelPrototypes'
import { shallow } from 'zustand/shallow'
import useLastAccessedModel from '@/hooks/useLastAccessedModel'
import useCurrentModel from '@/hooks/useCurrentModel'
import { Button } from '@/components/atoms/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu'
import { Dialog, DialogContent } from '@/components/atoms/dialog'
import { TbPlus, TbDotsVertical } from 'react-icons/tb'
import AddonSelect from '@/components/molecules/AddonSelect'
import CustomModelTabs from '@/components/molecules/CustomModelTabs'
import CustomTabEditor from '@/components/organisms/CustomTabEditor'
import { Plugin } from '@/services/plugin.service'
import { updateModelService } from '@/services/model.service'
import { toast } from 'react-toastify'
import useSelfProfileQuery from '@/hooks/useSelfProfile'

const ModelDetailLayout = () => {
  const { data: fetchedModel, isLoading: isModelLoading } = useCurrentModel()
  const { data: user } = useSelfProfileQuery()
  const [model, setActiveModel] = useModelStore((state) => [
    state.model as Model,
    state.setActiveModel,
  ])
  const location = useLocation()
  const { data: fetchedPrototypes } = useListModelPrototypes(
    model ? model.id : '',
  )
  const [activeModelApis] = useModelStore(
    (state) => [state.activeModelApis],
    shallow,
  )

  const { setLastAccessedModel } = useLastAccessedModel()

  // State for dialog management
  const [openAddonDialog, setOpenAddonDialog] = useState(false)
  const [openManageAddonsDialog, setOpenManageAddonsDialog] = useState(false)
  const [isModelOwner, setIsModelOwner] = useState(false)

  // Update store when model is fetched
  useEffect(() => {
    if (fetchedModel && fetchedModel.id) {
      setActiveModel(fetchedModel)
    }
  }, [fetchedModel, setActiveModel])

  useEffect(() => {
    if (model) {
      setLastAccessedModel(model.id)
    }
  }, [model])

  // Check if current user is model owner
  useEffect(() => {
    setIsModelOwner(
      !!(user && model?.created_by && user.id === model.created_by.id)
    )
  }, [user, model])

  // Handler for adding a new addon
  const handleAddonSelect = async (plugin: Plugin, label: string) => {
    if (!model?.id) {
      toast.error('Model not found')
      return
    }

    try {
      const currentTemplate = model.custom_template || {
        model_tabs: [],
        prototype_tabs: [],
      }

      const pluginExists = currentTemplate.model_tabs?.some(
        (tab: any) => tab.plugin === plugin.slug
      )

      if (pluginExists) {
        toast.info('This addon is already added to model tabs')
        setOpenAddonDialog(false)
        return
      }

      const newTab = {
        label: label,
        plugin: plugin.slug,
      }

      const updatedTemplate = {
        ...currentTemplate,
        model_tabs: [...(currentTemplate.model_tabs || []), newTab],
      }

      await updateModelService(model.id, {
        custom_template: updatedTemplate,
      })

      toast.success(`Added ${label} to model tabs`)
      setOpenAddonDialog(false)
      window.location.reload()
    } catch (error) {
      console.error('Failed to add addon:', error)
      toast.error('Failed to add addon. Please try again.')
    }
  }

  // Handler for saving custom tabs (edit/reorder/remove)
  const handleSaveCustomTabs = async (updatedTabs: Array<{ label: string; plugin: string }>) => {
    if (!model?.id) {
      toast.error('Model not found')
      return
    }

    try {
      const currentTemplate = model.custom_template || {
        model_tabs: [],
        prototype_tabs: [],
      }

      const updatedTemplate = {
        ...currentTemplate,
        model_tabs: updatedTabs,
      }

      await updateModelService(model.id, {
        custom_template: updatedTemplate,
      })

      toast.success('Custom tabs updated successfully')
      window.location.reload()
    } catch (error) {
      console.error('Failed to update custom tabs:', error)
      toast.error('Failed to update custom tabs. Please try again.')
    }
  }

  // Use actual model loading state
  const isLoading = isModelLoading || !model

  const skeleton = JSON.parse(model?.skeleton || '{}')
  const numberOfNodes = skeleton?.nodes?.length || 0
  const numberOfPrototypes = fetchedPrototypes?.length || 0
  const numberOfApis = activeModelApis?.length || 0

  const cardIntro = [
    {
      title: `Overview`,
      content: 'General information of the vehicle model',
      path: 'overview',
      subs: ['/model/:model_id'],
      count: null, // No count for Overview
      dataId: 'tab-model-overview',
    },
    // {
    //   title: `Architecture`,
    //   content: 'Provide the big picture of the vehicle model',
    //   path: 'architecture',
    //   subs: ['/model/:model_id/architecture'],
    //   count: numberOfNodes,
    //   dataId: 'tab-model-architecture',
    // },
    {
      title: `Vehicle API`,
      content:
        'Browse, explore and enhance the catalogue of Connected Vehicle Interfaces',
      path: 'api',
      subs: ['/model/:model_id/api', '/model/:model_id/api/:api'],
      count: model?.extend?.vehicle_api?.supports?.length || numberOfApis,
      dataId: 'tab-model-api',
    },
    {
      title: `Prototype Library`,
      content:
        'Build up, evaluate and prioritize your portfolio of connected vehicle applications',
      path: 'library/list',
      subs: [
        '/model/:model_id/library',
        '/model/:model_id/library/:tab',
        '/model/:model_id/library/:tab/:prototype_id',
      ],
      count: numberOfPrototypes,
      dataId: 'tab-model-library',
    },
  ]

  return (
    <div className="flex flex-col w-full h-full rounded-md bg-muted">
      <div className="flex min-h-[52px] border-b border-muted-foreground/50 bg-background">
        <div className="flex w-fit">
          {model ? (
            <>
              {cardIntro.map((intro, index) => (
                <DaTabItem
                  to={`/model/${model.id}/${intro.path === 'overview' ? '' : intro.path}`}
                  active={
                    !!matchRoutes(
                      intro.subs.map((sub) => ({
                        path: sub,
                      })),
                      location.pathname,
                    )?.at(0)
                  }
                  key={index}
                  dataId={intro.dataId}
                >
                  {intro.title}
                  {intro.count !== null && (
                    <div className="flex min-w-5 px-1.5 py-0.5 items-center justify-center text-xs ml-1 bg-gray-200 rounded-md">
                      {intro.count}
                    </div>
                  )}
                </DaTabItem>
              ))}
              <CustomModelTabs customTabs={model?.custom_template?.model_tabs} />
            </>
          ) : (
            <div className="flex items-center h-full space-x-6 px-4">
              {cardIntro.map((_, index) => (
                <Skeleton key={index} className="w-[100px] h-6" />
              ))}
            </div>
          )}
        </div>
        {isModelOwner && model && (
          <div className="flex w-fit h-full items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpenAddonDialog(true)}
              className="h-[52px] w-12 rounded-none hover:bg-accent"
            >
              <TbPlus className="w-5 h-5" />
            </Button>
          </div>
        )}
        <div className="grow"></div>
        {isModelOwner && model && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-[52px] w-12 rounded-none hover:bg-accent"
              >
                <TbDotsVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={() => setOpenManageAddonsDialog(true)}
              >
                Manage Addons
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="p-2 h-[calc(100%-52px)] flex flex-col">
        {isLoading ? (
          <div className="flex w-full h-full bg-background rounded-lg items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Spinner size={32} />
              <p className="text-base text-muted-foreground">
                Loading Model...
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full h-full bg-background rounded-lg">
            <Outlet />
          </div>
        )}
      </div>

      {/* Addon Select Dialog */}
      <Dialog open={openAddonDialog} onOpenChange={setOpenAddonDialog}>
        <DialogContent className="max-w-2xl p-0">
          <AddonSelect
            onSelect={handleAddonSelect}
            onCancel={() => setOpenAddonDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Custom Tab Editor Dialog */}
      <CustomTabEditor
        open={openManageAddonsDialog}
        onOpenChange={setOpenManageAddonsDialog}
        tabs={model?.custom_template?.model_tabs || []}
        onSave={handleSaveCustomTabs}
        title="Manage Model Tabs"
        description="Edit labels, reorder, and remove custom model tabs"
      />
    </div>
  )
}

export default ModelDetailLayout
