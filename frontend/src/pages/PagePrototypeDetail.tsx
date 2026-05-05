// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC, useCallback, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { configManagementService } from '@/services/configManagement.service'
import useModelStore from '@/stores/modelStore'
import { Prototype } from '@/types/model.type'
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom'
import { Spinner } from '@/components/atoms/spinner'
import {
  TbDotsVertical,
  TbPlus,
  TbListCheck,
  TbSettings,
  TbLayoutSidebar,
} from 'react-icons/tb'
import { GiSaveArrow } from 'react-icons/gi'
import { TbFileCode } from 'react-icons/tb'
import { saveRecentPrototype } from '@/services/prototype.service'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import useCurrentModel from '@/hooks/useCurrentModel'
import useCurrentPrototype from '@/hooks/useCurrentPrototype'
import DaDialog from '@/components/molecules/DaDialog'
import PrototypeTabCode from '@/components/organisms/PrototypeTabCode'
import PrototypeTabVSCode from '@/components/organisms/PrototypeTabVSCode'
import PrototypeTabDashboard from '@/components/organisms/PrototypeTabDashboard'
import PrototypeTabFeedback from '@/components/organisms/PrototypeTabFeedback'
import DaWorkspaceRuntimeControl from '@/components/molecules/dashboard/DaWorkspaceRuntimeControl'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import AddonSelect from '@/components/molecules/AddonSelect'
import { Plugin } from '@/services/plugin.service'
import { updateModelService } from '@/services/model.service'
import { toast } from 'react-toastify'
import { Dialog, DialogContent } from '@/components/atoms/dialog'
import PagePrototypePlugin from '@/pages/PagePrototypePlugin'
import CustomTabEditor, {
  TabConfig,
  StagingConfig,
  RightNavPluginButton,
  TabsBorderRadius,
} from '@/components/organisms/CustomTabEditor'
import PrototypeTabInfo from '../components/organisms/PrototypeTabInfo'
import TemplateForm from '@/components/organisms/TemplateForm'
import PrototypeTabJourney from '@/components/organisms/PrototypeTabJourney'
import PrototypeTabStaging from '@/components/organisms/PrototypeTabStaging'
import PrototypeTabs, {
  getTabConfig,
} from '@/components/molecules/PrototypeTabs'
import DaTabItem from '@/components/atoms/DaTabItem'
import usePluginPreloader from '@/hooks/usePluginPreloader'
import PrototypeSidebar from '@/components/organisms/PrototypeSidebar'
import StagingTabButton from '@/components/organisms/StagingTabButton'
import { useSiteConfig } from '@/utils/siteConfig'
import usePermissionHook from '@/hooks/usePermissionHook'
import { PERMISSIONS } from '@/data/permission'
import { createProjectTemplate } from '@/services/projectTemplate.service'

interface ViewPrototypeProps {
  display?: 'tree' | 'list'
}

const PagePrototypeDetail: FC<ViewPrototypeProps> = ({}) => {
  const { model_id, prototype_id, tab } = useParams()
  const [searchParams] = useSearchParams()
  const pluginId = searchParams.get('plugid')
  const navigate = useNavigate()
  const { data: user } = useSelfProfileQuery()
  const { data: model } = useCurrentModel()
  const { data: fetchedPrototype, isLoading: isPrototypeLoading } =
    useCurrentPrototype()
  const [prototype, setActivePrototype] = useModelStore((state) => [
    state.prototype as Prototype,
    state.setActivePrototype,
  ])
  const [isDefaultTab, setIsDefaultTab] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [openStagingDialog, setOpenStagingDialog] = useState(false)
  const [showRt, setShowRt] = useState(false)
  const [isModelOwner, setIsModelOwner] = useState(false)
  const [openAddonDialog, setOpenAddonDialog] = useState(false)
  const [openManageAddonsDialog, setOpenManageAddonsDialog] = useState(false)
  const [openTemplateForm, setOpenTemplateForm] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const [hasWritePermission, isAdmin] = usePermissionHook(
    [PERMISSIONS.WRITE_MODEL, model?.id],
    [PERMISSIONS.MANAGE_USERS],
  )
  const queryClient = useQueryClient()
  const [openSaveProjectTemplate, setOpenSaveProjectTemplate] = useState(false)
  const [projectTemplateName, setProjectTemplateName] = useState('')
  const [savingProjectTemplate, setSavingProjectTemplate] = useState(false)
  const allowNonAdminAddonConfig = useSiteConfig(
    'ALLOW_NON_ADMIN_ADDON_CONFIG',
    true,
  )
  // Use null sentinel while config is loading so reload doesn't instantly redirect.
  const vscodeEnabled = useSiteConfig('VSCODE_ENABLE', null as any)
  const [templateInitialData, setTemplateInitialData] = useState<
    | {
        name?: string
        description?: string
        image?: string
        visibility?: string
        config?: any
        model_tabs?: Array<{ label: string; plugin: string }>
        prototype_tabs?: TabConfig[]
      }
    | undefined
  >(undefined)

  // Load staging config to extract plugins for preloading
  const [stagingPlugins, setStagingPlugins] = useState<Plugin[]>([])
  const STAGING_FRAME_KEY = 'STAGING_FRAME'

  useEffect(() => {
    const loadStagingPlugins = async () => {
      try {
        const stagingConfig =
          await configManagementService.getPublicConfig(STAGING_FRAME_KEY)
        if (stagingConfig?.value?.stages) {
          // Extract all plugins from all stages
          const allPlugins: Plugin[] = []
          stagingConfig.value.stages.forEach((stage: any) => {
            if (stage.plugins && Array.isArray(stage.plugins)) {
              allPlugins.push(...stage.plugins)
            }
          })
          setStagingPlugins(allPlugins)
        }
      } catch (error) {
        // Silently fail - staging config might not exist or user might not have access
        setStagingPlugins([])
      }
    }

    loadStagingPlugins()
  }, [])

  // Extract prototype tabs for preloading (memoize to avoid unstable deps in effects)
  const prototypeTabs = useMemo(
    () => getTabConfig(model?.custom_template?.prototype_tabs),
    [model?.custom_template?.prototype_tabs],
  )
  const effectivePrototypeTabs = useMemo(
    () =>
      prototypeTabs.filter(
        (t) =>
          !(t.type === 'builtin' && t.key === 'vscode' && vscodeEnabled === false),
      ),
    [prototypeTabs, vscodeEnabled],
  )

  // Extract sidebar plugin slug
  const sidebarPlugin: string | undefined =
    model?.custom_template?.prototype_sidebar_plugin || undefined

  // Extract global tab style variant
  const tabsVariant: string | undefined =
    model?.custom_template?.prototype_tabs_variant || undefined

  // Extract global tab border radius
  const tabsBorderRadius: TabsBorderRadius | undefined = model?.custom_template?.prototype_tabs_border_radius || undefined

  // Extract staging tab config from prototype_right_nav_buttons
  const _rightNavRaw: RightNavPluginButton[] =
    model?.custom_template?.prototype_right_nav_buttons || []
  const _stagingNavItem = _rightNavRaw.find((b) => b.builtin === 'staging')
  const stagingConfig: StagingConfig = _stagingNavItem
    ? {
        label: _stagingNavItem.label,
        iconSvg: _stagingNavItem.iconSvg,
        hideIcon: _stagingNavItem.hideIcon,
        variant: _stagingNavItem.variant,
      }
    : {}

  // Extract right nav plugin buttons (exclude the built-in staging item)
  const rightNavButtons: RightNavPluginButton[] = _rightNavRaw.filter(
    (b) => b.builtin !== 'staging',
  )

  // Preload plugin JavaScript files
  usePluginPreloader({
    prototypeTabs,
    stagingPlugins,
    enabled: !!user, // Only preload if user is authenticated
    delay: 2000, // Start preloading 2 seconds after page load
  })

  // Populate store when prototype is fetched
  useEffect(() => {
    if (fetchedPrototype) {
      setActivePrototype(fetchedPrototype)
    }
  }, [fetchedPrototype, setActivePrototype])

  useEffect(() => {
    if (!tab || tab === 'view') {
      // Only show overview content if overview is actually the first visible tab
      const firstVisible = effectivePrototypeTabs.find((t) => !t.hidden)
      setIsDefaultTab(
        !firstVisible ||
          (firstVisible.type === 'builtin' && firstVisible.key === 'overview'),
      )
    } else {
      setIsDefaultTab(false)
    }
    setShowRt(
      ['code', 'dashboard'].includes(tab || '') ||
        (tab === 'vscode' && vscodeEnabled === true),
    )
  }, [tab, vscodeEnabled, prototypeTabs])

  // Auto-navigate to first visible tab when arriving on the default (no-tab / view) route
  useEffect(() => {
    if (
      (!tab || tab === 'view') &&
      model_id &&
      prototype_id &&
      prototypeTabs.length > 0
    ) {
      const firstVisible = effectivePrototypeTabs.find((t) => !t.hidden)
      if (!firstVisible) return
      // overview maps to /view — already there, nothing to do
      if (firstVisible.type === 'builtin' && firstVisible.key === 'overview')
        return
      const base = `/model/${model_id}/library/prototype/${prototype_id}`
      if (firstVisible.type === 'builtin' && firstVisible.key) {
        navigate(`${base}/${firstVisible.key}`, { replace: true })
      } else if (firstVisible.type === 'custom' && firstVisible.plugin) {
        navigate(`${base}/plug?plugid=${firstVisible.plugin}`, {
          replace: true,
        })
      }
    }
  }, [
    tab,
    prototypeTabs,
    effectivePrototypeTabs,
    model_id,
    prototype_id,
    navigate,
  ])

  // If someone navigates directly to /vscode while it's disabled, redirect to /code.
  useEffect(() => {
    if (tab === 'vscode' && vscodeEnabled === false && model_id && prototype_id) {
      const base = `/model/${model_id}/library/prototype/${prototype_id}`
      navigate(`${base}/code`, { replace: true })
    }
  }, [tab, vscodeEnabled, model_id, prototype_id, navigate])

  useEffect(() => {
    if (user && prototype && tab) {
      saveRecentPrototype(user.id, prototype.id, 'prototype', tab)
    }
  }, [prototype, tab, user])

  useEffect(() => {
    setIsModelOwner(
      !!(user && model?.created_by && user.id === model.created_by.id),
    )
  }, [user, model])

  const canConfigurePrototypeAddons =
    (isModelOwner || hasWritePermission) && !!allowNonAdminAddonConfig

  const handleSaveProjectTemplate = async () => {
    if (!projectTemplateName.trim() || !prototype) return
    setSavingProjectTemplate(true)
    try {
      const data = JSON.stringify({
        language: prototype.language || 'python',
        code: prototype.code || '',
        widget_config: prototype.widget_config,
        customer_journey: prototype.customer_journey,
      })
      await createProjectTemplate({ name: projectTemplateName.trim(), data })
      await queryClient.invalidateQueries({ queryKey: ['project-templates'] })
      await queryClient.invalidateQueries({ queryKey: ['project-templates-list'] })
      toast.success('Project template saved')
      setOpenSaveProjectTemplate(false)
      setProjectTemplateName('')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e.message || 'Failed to save template')
    } finally {
      setSavingProjectTemplate(false)
    }
  }

  // Callback for plugins to navigate to a specific prototype tab
  const handleSetActiveTab = useCallback(
    (targetTab: string, targetPluginSlug?: string) => {
      if (!model_id || !prototype_id) return
      const base = `/model/${model_id}/library/prototype/${prototype_id}`
      if (targetTab === 'plug' && targetPluginSlug) {
        navigate(`${base}/plug?plugid=${targetPluginSlug}`)
      } else {
        navigate(`${base}/${targetTab}`)
      }
    },
    [model_id, prototype_id, navigate],
  )

  const handleAddonSelect = async (plugin: Plugin, label: string) => {
    if (!model_id || !model) {
      toast.error('Model not found')
      return
    }

    try {
      // Get current tabs with migration
      const currentTabs = getTabConfig(model.custom_template?.prototype_tabs)

      // Check if plugin already exists
      const pluginExists = currentTabs.some(
        (tab: TabConfig) => tab.type === 'custom' && tab.plugin === plugin.slug,
      )

      if (pluginExists) {
        toast.info('This addon is already added to prototype tabs')
        setOpenAddonDialog(false)
        return
      }

      // Create new custom tab entry
      const newTab: TabConfig = {
        type: 'custom',
        label: label,
        plugin: plugin.slug,
      }

      const updatedTabs = [...currentTabs, newTab]

      // Save to model
      await updateModelService(model_id, {
        custom_template: {
          ...model.custom_template,
          prototype_tabs: updatedTabs,
        },
      })

      toast.success(`Added ${label} to prototype tabs`)
      setOpenAddonDialog(false)

      // Optionally refresh the model data
      window.location.reload()
    } catch (error) {
      console.error('Failed to add addon:', error)
      toast.error('Failed to add addon. Please try again.')
    }
  }

  const handleSaveCustomTabs = async (
    updatedTabs: TabConfig[],
    updatedSidebarPlugin?: string | null,
    updatedTabsVariant?: string | null,
    updatedRightNavButtons?: RightNavPluginButton[] | null,
    updatedTabsBorderRadius?: TabsBorderRadius | null,
  ) => {
    if (!model_id || !model) {
      toast.error('Model not found')
      return
    }

    try {
      const updates: any = {
        ...model.custom_template,
        prototype_tabs: updatedTabs,
      }

      // Update sidebar plugin: null means remove, string means set, undefined means no change
      if (updatedSidebarPlugin !== undefined) {
        updates.prototype_sidebar_plugin = updatedSidebarPlugin
      }

      // Update tabs variant: null means remove (revert to default), string means set, undefined means no change
      if (updatedTabsVariant !== undefined) {
        updates.prototype_tabs_variant = updatedTabsVariant ?? undefined
      }

      // Update border radius: null means remove (revert to default), string means set, undefined means no change
      if (updatedTabsBorderRadius !== undefined) {
        updates.prototype_tabs_border_radius = updatedTabsBorderRadius ?? undefined
      }

      // Update right nav buttons: null means remove, array means set, undefined means no change
      if (updatedRightNavButtons !== undefined) {
        updates.prototype_right_nav_buttons = updatedRightNavButtons
      }

      await updateModelService(model_id, {
        custom_template: updates,
      })

      toast.success('Prototype tabs updated successfully')
      window.location.reload()
    } catch (error) {
      console.error('Failed to update prototype tabs:', error)
      toast.error('Failed to update prototype tabs. Please try again.')
    }
  }

  return prototype ? (
    <div className="flex w-full h-full relative">
      {/* Left sidebar plugin - full height, outside tab area */}
      {sidebarPlugin && (
        <PrototypeSidebar
          pluginSlug={sidebarPlugin}
          isCollapsed={sidebarCollapsed}
          onSetActiveTab={handleSetActiveTab}
        />
      )}

      {/* Right side: tab bar + content */}
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
          <div className="flex w-fit">
            <PrototypeTabs
              tabs={model?.custom_template?.prototype_tabs}
              tabsVariant={tabsVariant}
              tabsBorderRadius={tabsBorderRadius}
            />
          </div>
          {canConfigurePrototypeAddons && (
            <div className="flex w-fit h-full items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpenAddonDialog(true)}
              >
                <TbPlus className="w-5 h-5" />
              </Button>
            </div>
          )}
          <div className="grow"></div>
          {/* Staging tab - right side, before three dots */}
          <StagingTabButton
            model_id={model_id}
            prototype_id={prototype_id}
            stagingConfig={stagingConfig}
            tab={tab}
          />
          {canConfigurePrototypeAddons && (
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
                    setOpenManageAddonsDialog(true)
                  }}
                >
                  <TbSettings className="w-5 h-5" />
                  Customize Layout...
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setMoreMenuOpen(false)
                    // Capture current model.custom_template data at the moment of click
                    if (model) {
                      // Normalize prototype_tabs to full TabConfig format (resolves old-format entries
                      // where builtin tabs were stored as { label, plugin: "" } without type/key).
                      const normalizedPrototypeTabs = getTabConfig(
                        model.custom_template?.prototype_tabs,
                      )
                      const initialData = {
                        name: model.name || '',
                        description: '',
                        image: model.model_home_image_file || '',
                        visibility: model.visibility || 'public',
                        config: {
                          ...model.custom_template,
                          prototype_tabs: normalizedPrototypeTabs,
                        },
                        model_tabs: model.custom_template?.model_tabs || [],
                        prototype_tabs: normalizedPrototypeTabs,
                      }
                      console.log(
                        '[PagePrototypeDetail] Setting templateInitialData:',
                        {
                          model,
                          custom_template: model.custom_template,
                          initialData,
                        },
                      )
                      setTemplateInitialData(initialData)
                    }
                    setOpenTemplateForm(true)
                  }}
                >
                  <GiSaveArrow className="w-5 h-5" />
                  Save Solution as Template
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem
                    onClick={() => {
                      setMoreMenuOpen(false)
                      setOpenSaveProjectTemplate(true)
                    }}
                  >
                    <TbFileCode className="w-5 h-5" />
                    Save Project as Template
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Main content area */}
        <div className="flex flex-col flex-1 h-full overflow-y-auto relative">
          <div
            style={{ right: showRt ? '3.5rem' : '0' }}
            className="absolute left-0 bottom-0 top-0 grow h-full z-0"
          >
            {isDefaultTab && <PrototypeTabInfo prototype={prototype} />}
            {tab == 'journey' && <PrototypeTabJourney prototype={prototype} />}
            {tab == 'code' && <PrototypeTabCode />}
            {/* Keep VS Code mounted to avoid iframe reload "stutter" on tab switches */}
            {vscodeEnabled && (
              <div
                className={
                  tab === 'vscode'
                    ? 'absolute inset-0 z-10 w-full h-full visible pointer-events-auto'
                    : 'absolute inset-0 z-0 w-full h-full invisible pointer-events-none'
                }
              >
                <PrototypeTabVSCode isActive={tab === 'vscode'} />
              </div>
            )}
            {tab == 'dashboard' && <PrototypeTabDashboard />}
            {tab == 'feedback' && <PrototypeTabFeedback />}
            {tab == 'staging' && <PrototypeTabStaging prototype={prototype} />}

            {/* Render ALL plugin components unconditionally - they stay mounted and cached */}
            {/* Only show the one that matches current tab and pluginId */}
            {prototypeTabs
              .filter(
                (tabConfig): tabConfig is TabConfig & { plugin: string } =>
                  tabConfig.type === 'custom' && !!tabConfig.plugin,
              )
              .map((tabConfig) => {
                // Show only if we're on the 'plug' tab AND this plugin matches the pluginId
                const isActive = tab === 'plug' && pluginId === tabConfig.plugin
                return (
                  <div
                    key={tabConfig.plugin}
                    className={isActive ? 'w-full h-full' : 'hidden'}
                  >
                    <PagePrototypePlugin
                      pluginSlug={tabConfig.plugin}
                      onSetActiveTab={handleSetActiveTab}
                    />
                  </div>
                )
              })}

            {/* Fallback: if no plugin tabs configured but plugid in URL, render single instance */}
            {/* (for backward compatibility or direct navigation) */}
            {tab === 'plug' &&
              pluginId &&
              prototypeTabs.filter(
                (t) => t.type === 'custom' && t.plugin === pluginId,
              ).length === 0 && (
                <PagePrototypePlugin
                  pluginSlug={pluginId}
                  onSetActiveTab={handleSetActiveTab}
                />
              )}
          </div>
          {showRt && <DaWorkspaceRuntimeControl />}
        </div>
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
        tabs={getTabConfig(model?.custom_template?.prototype_tabs)}
        onSave={handleSaveCustomTabs}
        sidebarPlugin={sidebarPlugin}
        stagingConfig={stagingConfig}
        rightNavButtons={rightNavButtons}
        tabsVariant={tabsVariant}
        tabsBorderRadius={tabsBorderRadius}
        title="Customize Prototype Layout"
        description="Configure tabs, appearance, sidebar, and action buttons"
      />

      {/* Template Form Dialog */}
      <DaDialog
        open={openTemplateForm}
        onOpenChange={setOpenTemplateForm}
        className="w-[840px] max-w-[calc(100vw-80px)] max-h-[90vh] overflow-hidden flex flex-col"
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

      {/* Save Project as Template Dialog */}
      <DaDialog
        open={openSaveProjectTemplate}
        onOpenChange={(v) => {
          setOpenSaveProjectTemplate(v)
          if (!v) setProjectTemplateName('')
        }}
        className="w-[440px]"
      >
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Create Template</h2>
          <div className="space-y-2">
            <label className="text-sm font-medium">Name *</label>
            <Input
              placeholder="Template name"
              value={projectTemplateName}
              onChange={(e) => setProjectTemplateName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setOpenSaveProjectTemplate(false)
                setProjectTemplateName('')
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!projectTemplateName.trim() || savingProjectTemplate}
              onClick={handleSaveProjectTemplate}
            >
              {savingProjectTemplate ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </DaDialog>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center w-full h-full gap-4">
      <Spinner size={32} />
      <p className="text-base text-muted-foreground">Loading prototype...</p>
    </div>
  )
}

export default PagePrototypeDetail
