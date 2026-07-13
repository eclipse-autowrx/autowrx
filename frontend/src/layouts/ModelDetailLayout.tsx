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
import DaDialog from '@/components/molecules/DaDialog'
import { TbPlus, TbDotsVertical, TbSettings } from 'react-icons/tb'
import { GiSaveArrow } from 'react-icons/gi'
import AddonSelect from '@/components/molecules/AddonSelect'
import CustomTabEditor, { TabConfig } from '@/components/organisms/CustomTabEditor'
import TemplateForm from '@/components/organisms/TemplateForm'
import { getTabConfig } from '@/components/molecules/PrototypeTabs'
import {
  getModelBuiltinTabCount,
  getModelTabConfig,
  MODEL_BUILTIN_TAB_ROUTES,
  sanitizeModelTabsForSave,
} from '@/lib/modelTabUtils'
import { Plugin } from '@/services/plugin.service'
import { updateModelService } from '@/services/model.service'
import { toast } from 'react-toastify'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import usePermissionHook from '@/hooks/usePermissionHook'
import { PERMISSIONS } from '@/data/permission'
import { useSiteConfig } from '@/utils/siteConfig'

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

  const { setLastAccessedModel } = useLastAccessedModel()

  // State for dialog management
  const [openAddonDialog, setOpenAddonDialog] = useState(false)
  const [openManageAddonsDialog, setOpenManageAddonsDialog] = useState(false)
  const [openTemplateForm, setOpenTemplateForm] = useState(false)
  const [templateInitialData, setTemplateInitialData] = useState<
    | {
        name?: string
        description?: string
        image?: string
        visibility?: string
        config?: any
        model_tabs?: TabConfig[]
        prototype_tabs?: TabConfig[]
      }
    | undefined
  >(undefined)
  const [isModelOwner, setIsModelOwner] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const [hasWritePermission] = usePermissionHook([PERMISSIONS.WRITE_MODEL, model?.id])
  const allowNonAdminAddonConfig = useSiteConfig(
    'ALLOW_NON_ADMIN_ADDON_CONFIG',
    true,
  )

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


  const modelTabConfigs = getModelTabConfig(model?.custom_template?.model_tabs)

  // Handler for adding a new addon
  const handleAddonSelect = async (plugin: Plugin, label: string) => {
    if (!model?.id) {
      toast.error('Model not found')
      return
    }

    try {
      const currentTabs = getModelTabConfig(model?.custom_template?.model_tabs)

      const pluginExists = currentTabs.some(
        (tab: TabConfig) => tab.type === 'custom' && tab.plugin === plugin.slug
      )

      if (pluginExists) {
        toast.info('This addon is already added to model tabs')
        setOpenAddonDialog(false)
        return
      }

      const newTab: TabConfig = {
        type: 'custom',
        label: label,
        plugin: plugin.slug,
      }

      const updatedTabs = [...currentTabs, newTab]

      await updateModelService(model.id, {
        custom_template: {
          ...model.custom_template,
          model_tabs: sanitizeModelTabsForSave(updatedTabs),
        },
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
  const handleSaveCustomTabs = async (updatedTabs: TabConfig[]) => {
    if (!model?.id) {
      toast.error('Model not found')
      return
    }

    try {
      await updateModelService(model.id, {
        custom_template: {
          ...model.custom_template,
          model_tabs: sanitizeModelTabsForSave(updatedTabs),
        },
      })

      toast.success('Model tabs updated successfully')
      window.location.reload()
    } catch (error) {
      console.error('Failed to update model tabs:', error)
      toast.error('Failed to update model tabs. Please try again.')
    }
  }

  // Use actual model loading state
  const isLoading = isModelLoading || !model
  const canManageModelUI = (isModelOwner || hasWritePermission) && !!allowNonAdminAddonConfig

  const numberOfPrototypes = fetchedPrototypes?.length || 0

  // Count API sets: 1 for COVESA + number of custom_api_sets
  const customApiSetCount = (model?.custom_api_sets || []).length
  const totalApiSetCount = 1 + customApiSetCount // 1 for COVESA
  // Hide count if 0 or 1
  const vehicleApiCount = totalApiSetCount > 1 ? totalApiSetCount : null

  const tabCounts = { vehicleApiCount, numberOfPrototypes }

  const renderModelTab = (tab: TabConfig, index: number) => {
    if (tab.hidden) return null

    if (tab.type === 'builtin' && tab.key) {
      const route = MODEL_BUILTIN_TAB_ROUTES[tab.key]
      if (!route) return null

      const count = getModelBuiltinTabCount(tab.key, tabCounts)

      return (
        <DaTabItem
          key={`builtin-${tab.key}-${index}`}
          to={`/model/${model!.id}/${route.path === 'overview' ? '' : route.path}`}
          active={
            !!matchRoutes(
              route.subs.map((sub) => ({ path: sub })),
              location.pathname,
            )?.at(0)
          }
          dataId={route.dataId}
        >
          {tab.label}
          {count !== null && (
            <div className="flex min-w-5 px-1.5 py-0.5 items-center justify-center text-xs ml-1 bg-gray-200 rounded-md">
              {count}
            </div>
          )}
        </DaTabItem>
      )
    }

    if (tab.type === 'custom' && tab.plugin) {
      return (
        <DaTabItem
          key={`custom-${tab.plugin}-${index}`}
          active={
            location.pathname.includes('/plugin') &&
            location.search.includes(`plugid=${tab.plugin}`)
          }
          to={`/model/${model!.id}/plugin?plugid=${tab.plugin}`}
        >
          {tab.label}
        </DaTabItem>
      )
    }

    return null
  }

  return (
    <div className="flex flex-col w-full h-full rounded-md bg-muted">
      <div
        className="flex min-h-[52px] border-b border-muted-foreground/50 bg-background"
      >
        <div className="flex w-fit">
          {model ? (
            <>
              {modelTabConfigs.map((tab, index) => renderModelTab(tab, index))}
            </>
          ) : (
            <div className="flex items-center h-full space-x-6 px-4">
              {[0, 1, 2].map((index) => (
                <Skeleton key={index} className="w-[100px] h-6" />
              ))}
            </div>
          )}
        </div>
        {canManageModelUI && model && (
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
        {canManageModelUI && model && (
          <DropdownMenu open={moreMenuOpen} onOpenChange={setMoreMenuOpen}>
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
                onClick={() => {
                  setMoreMenuOpen(false)
                  if (model) {
                    const normalizedPrototypeTabs = getTabConfig(model.custom_template?.prototype_tabs)
                    const normalizedModelTabs = getModelTabConfig(model.custom_template?.model_tabs)
                    setTemplateInitialData({
                      name: model.name || '',
                      description: '',
                      image: model.model_home_image_file || '',
                      visibility: model.visibility || 'public',
                      config: { ...model.custom_template, prototype_tabs: normalizedPrototypeTabs },
                      model_tabs: normalizedModelTabs,
                      prototype_tabs: normalizedPrototypeTabs,
                    })
                  }
                  setOpenTemplateForm(true)
                }}
              >
                <GiSaveArrow className="w-5 h-5" />
                Save Model as Template
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setMoreMenuOpen(false)
                  setOpenManageAddonsDialog(true)
                }}
              >
                <TbSettings className="w-5 h-5" />
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
        mode="model"
        open={openManageAddonsDialog}
        onOpenChange={setOpenManageAddonsDialog}
        tabs={modelTabConfigs}
        onSave={handleSaveCustomTabs}
        title="Manage Model Tabs"
        description="Reorder tabs, edit labels, and manage custom plugin tabs"
      />

      {/* Save Model as Template Dialog */}
      <DaDialog
        open={openTemplateForm}
        onOpenChange={setOpenTemplateForm}
        className="w-210 max-w-[calc(100vw-80px)] max-h-[90vh]"
        dialogTitle="Create Template"
        contentContainerClassName="p-0"
      >
        <TemplateForm
          open={openTemplateForm}
          templateId={undefined}
          onClose={() => {
            setOpenTemplateForm(false)
            setTemplateInitialData(undefined)
          }}
          initialData={templateInitialData}
        />
      </DaDialog>
    </div>
  )
}

export default ModelDetailLayout
