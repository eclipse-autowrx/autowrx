// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC, useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/atoms/button'
import DaDialog from '@/components/molecules/DaDialog'
import FormCreateModel from '@/components/molecules/forms/FormCreateModel'
import FormNewPrototype from '@/components/molecules/forms/FormNewPrototype'
import NewPrototypeTabs from '@/components/molecules/NewPrototypeTabs'
import {
  getTabConfig,
} from '@/components/molecules/PrototypeTabs'
import {
  TabConfig,
  TabsBorderRadius,
} from '@/components/organisms/CustomTabEditor'
import PluginPageRender from '@/components/organisms/PluginPageRender'
import PrototypeSidebar from '@/components/organisms/PrototypeSidebar'
import useCurrentModel from '@/hooks/useCurrentModel'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import useAuthStore from '@/stores/authStore'
import useModelStore from '@/stores/modelStore'
import { TbLayoutSidebar } from 'react-icons/tb'

/**
 * Layout for `/new-prototype`: previews the selected model's (or default
 * model-template) prototype shell behind the create dialog, then navigates
 * to PagePrototypeDetail after creation.
 */
const NewPrototypeLayout: FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const isCreateModelMode = searchParams.get('create-model') !== null
  const navigate = useNavigate()
  const authBootstrapped = useAuthStore((state) => state.authBootstrapped)
  const {
    data: user,
    isLoading: isUserLoading,
    isFetching: isUserFetching,
  } = useSelfProfileQuery()
  const { data: model } = useCurrentModel()
  const setActiveModel = useModelStore((state) => state.setActiveModel)
  const isResolvingAuth =
    !authBootstrapped || (!user && (isUserLoading || isUserFetching))
  const urlParamModelId = searchParams.get('model_id')

  const handleLeavePage = useCallback(() => {
    const historyIdx = window.history.state?.idx
    if (typeof historyIdx === 'number' && historyIdx > 0) {
      navigate(-1)
      return
    }
    if (urlParamModelId) {
      navigate(`/model/${urlParamModelId}/library/list`)
      return
    }
    navigate('/')
  }, [navigate, urlParamModelId])

  const [openNewPrototypeDialog, setOpenNewPrototypeDialog] = useState(
    !isCreateModelMode,
  )
  const [openCreateModelDialog, setOpenCreateModelDialog] =
    useState(isCreateModelMode)
  const [selectedPluginId, setSelectedPluginId] = useState<string | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [previewTemplateConfig, setPreviewTemplateConfig] = useState<Record<
    string,
    any
  > | null>(null)

  useEffect(() => {
    if (!isResolvingAuth && !user) {
      navigate('/')
    }
  }, [isResolvingAuth, user, navigate])

  useEffect(() => {
    if (model) {
      setActiveModel(model)
    }
  }, [model, setActiveModel])

  // Prefer a real model's layout; fall back to the selected/default template.
  const layoutSource = model?.custom_template ?? previewTemplateConfig

  const prototypeTabs = getTabConfig(layoutSource?.prototype_tabs)
  const sidebarPlugin: string | undefined =
    layoutSource?.prototype_sidebar_plugin || undefined
  const tabsVariant: string | undefined =
    layoutSource?.prototype_tabs_variant || undefined
  const tabsBorderRadius: TabsBorderRadius | undefined =
    layoutSource?.prototype_tabs_border_radius || undefined

  const handleModelChange = useCallback(
    (modelId: string | null) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current)
          if (modelId) {
            next.set('model_id', modelId)
          } else {
            next.delete('model_id')
          }
          next.delete('prototype_id')
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const handleTemplatePreviewChange = useCallback(
    (config: Record<string, any> | null) => {
      setPreviewTemplateConfig(config)
    },
    [],
  )

  const handlePrototypeCreated = useCallback(
    (modelId: string, prototypeId: string) => {
      navigate(`/model/${modelId}/library/prototype/${prototypeId}`)
    },
    [navigate],
  )

  const handleSetActiveTab = useCallback(
    (targetTab: string, targetPluginSlug?: string) => {
      if (targetTab === 'plug' && targetPluginSlug) {
        setSelectedPluginId(targetPluginSlug)
      }
    },
    [],
  )

  const visibleCustomTabs = prototypeTabs.filter(
    (item): item is TabConfig & { plugin: string } =>
      !item.hidden && item.type === 'custom' && !!item.plugin,
  )
  const activePluginId = visibleCustomTabs.some(
    (item) => item.plugin === selectedPluginId,
  )
    ? selectedPluginId
    : (visibleCustomTabs[0]?.plugin ?? null)

  const previewModel = model
    ? model
    : previewTemplateConfig
      ? ({
          id: 'preview-template',
          custom_template: previewTemplateConfig,
        } as any)
      : null

  return (
    <div className="flex w-full h-full relative">
      {sidebarPlugin && (
        <PrototypeSidebar
          pluginSlug={sidebarPlugin}
          isCollapsed={sidebarCollapsed}
          onSetActiveTab={handleSetActiveTab}
        />
      )}

      <div className="flex flex-col flex-1 h-full min-w-0">
        <div className="flex min-h-[52px] border-b border-border bg-background">
          {sidebarPlugin && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="h-[52px] w-12 rounded-none hover:bg-accent shrink-0"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <TbLayoutSidebar className="w-5 h-5" />
            </Button>
          )}
          <div className="flex flex-1 min-w-0 overflow-x-auto">
            <NewPrototypeTabs
              tabs={layoutSource?.prototype_tabs}
              activePluginId={activePluginId}
              activeBuiltinKey={null}
              hasPrototype={false}
              onTabChange={handleSetActiveTab}
              tabsVariant={tabsVariant}
              tabsBorderRadius={tabsBorderRadius}
            />
          </div>
        </div>

        <div className="flex flex-1 h-full overflow-hidden relative">
          <div className="absolute inset-0 z-0">
            {visibleCustomTabs.map((tabConfig) => (
              <div
                key={tabConfig.plugin}
                className={
                  activePluginId === tabConfig.plugin
                    ? 'w-full h-full'
                    : 'hidden'
                }
              >
                <PluginPageRender
                  plugin_id={tabConfig.plugin}
                  data={{ model: previewModel, prototype: null }}
                  onSetActiveTab={handleSetActiveTab}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <DaDialog
        open={openNewPrototypeDialog}
        preventOutsideClose
        onOpenChange={setOpenNewPrototypeDialog}
        onClose={handleLeavePage}
        className="w-115 max-w-[calc(100vw-40px)] max-h-[90vh] overflow-auto"
      >
        <FormNewPrototype
          onClose={() => setOpenNewPrototypeDialog(false)}
          onModelChange={handleModelChange}
          onTemplatePreviewChange={handleTemplatePreviewChange}
          onSuccess={handlePrototypeCreated}
        />
      </DaDialog>

      <DaDialog
        open={openCreateModelDialog}
        onOpenChange={(open) => {
          setOpenCreateModelDialog(open)
          if (!open) handleLeavePage()
        }}
        dialogTitle="Create New Model"
        className="w-115 max-w-[calc(100vw-40px)]"
      >
        <FormCreateModel />
      </DaDialog>
    </div>
  )
}

export default NewPrototypeLayout
