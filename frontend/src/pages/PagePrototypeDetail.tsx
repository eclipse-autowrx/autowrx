// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC, useEffect, useState } from 'react'
import { configManagementService } from '@/services/configManagement.service'
import useModelStore from '@/stores/modelStore'
import { Prototype } from '@/types/model.type'
import { useParams, useSearchParams } from 'react-router-dom'
import { Spinner } from '@/components/atoms/spinner'
import {
  TbDotsVertical,
  TbPlus,
  TbListCheck,
} from 'react-icons/tb'
import { saveRecentPrototype } from '@/services/prototype.service'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import useCurrentModel from '@/hooks/useCurrentModel'
import useCurrentPrototype from '@/hooks/useCurrentPrototype'
import DaDialog from '@/components/molecules/DaDialog'
import PrototypeTabCode from '@/components/organisms/PrototypeTabCode'
import PrototypeTabDashboard from '@/components/organisms/PrototypeTabDashboard'
import PrototypeTabFeedback from '@/components/organisms/PrototypeTabFeedback'
import DaRuntimeControl from '@/components/molecules/dashboard/DaRuntimeControl'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu'
import { Button } from '@/components/atoms/button'
import AddonSelect from '@/components/molecules/AddonSelect'
import { Plugin } from '@/services/plugin.service'
import { updateModelService } from '@/services/model.service'
import { toast } from 'react-toastify'
import { Dialog, DialogContent } from '@/components/atoms/dialog'
import PagePrototypePlugin from '@/pages/PagePrototypePlugin'
import CustomTabEditor, { TabConfig } from '@/components/organisms/CustomTabEditor'
import PrototypeTabInfo from '../components/organisms/PrototypeTabInfo'
import TemplateForm from '@/components/organisms/TemplateForm'
import PrototypeTabJourney from '@/components/organisms/PrototypeTabJourney'
import PrototypeTabStaging from '@/components/organisms/PrototypeTabStaging'
import PrototypeTabs, { getTabConfig } from '@/components/molecules/PrototypeTabs'
import DaTabItem from '@/components/atoms/DaTabItem'
import usePluginPreloader from '@/hooks/usePluginPreloader'

interface ViewPrototypeProps {
  display?: 'tree' | 'list'
}

const PagePrototypeDetail: FC<ViewPrototypeProps> = ({}) => {
  const { model_id, prototype_id, tab } = useParams()
  const [searchParams] = useSearchParams()
  const pluginId = searchParams.get('plugid')
  const { data: user } = useSelfProfileQuery()
  const { data: model } = useCurrentModel()
  const { data: fetchedPrototype, isLoading: isPrototypeLoading } =
    useCurrentPrototype()
  const [prototype, setActivePrototype] = useModelStore((state) => [
    state.prototype as Prototype,
    state.setActivePrototype,
  ])
  const [isDefaultTab, setIsDefaultTab] = useState(false)
  const [openStagingDialog, setOpenStagingDialog] = useState(false)
  const [showRt, setShowRt] = useState(false)
  const [isModelOwner, setIsModelOwner] = useState(false)
  const [openAddonDialog, setOpenAddonDialog] = useState(false)
  const [openManageAddonsDialog, setOpenManageAddonsDialog] = useState(false)
  const [openTemplateForm, setOpenTemplateForm] = useState(false)
  const [templateInitialData, setTemplateInitialData] = useState<{
    name?: string
    description?: string
    image?: string
    visibility?: string
    config?: any
    model_tabs?: Array<{ label: string; plugin: string }>
    prototype_tabs?: Array<{ label: string; plugin: string }>
  } | undefined>(undefined)
  
  // Load staging config to extract plugins for preloading
  const [stagingPlugins, setStagingPlugins] = useState<Plugin[]>([])
  const STAGING_FRAME_KEY = 'STAGING_FRAME'
  
  useEffect(() => {
    // Only load staging config if user is authenticated
    if (!user) {
      setStagingPlugins([])
      return
    }
    
    const loadStagingPlugins = async () => {
      try {
        const stagingConfig = await configManagementService.getConfigByKey(STAGING_FRAME_KEY)
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
  }, [user])
  
  // Extract prototype tabs for preloading
  const prototypeTabs = getTabConfig(model?.custom_template?.prototype_tabs)
  
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
      setIsDefaultTab(true)
    } else {
      setIsDefaultTab(false)
    }
    setShowRt(['code', 'dashboard'].includes(tab || ''))
  }, [tab])

  useEffect(() => {
    if (user && prototype && tab) {
      saveRecentPrototype(user.id, prototype.id, 'prototype', tab)
    }
  }, [prototype, tab, user])

  useEffect(() => {
    setIsModelOwner(
      !!(user && model?.created_by && user.id === model.created_by.id)
    )
  }, [user, model])

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
        (tab: TabConfig) => tab.type === 'custom' && tab.plugin === plugin.slug
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

  const handleSaveCustomTabs = async (updatedTabs: TabConfig[]) => {
    if (!model_id || !model) {
      toast.error('Model not found')
      return
    }

    try {
      await updateModelService(model_id, {
        custom_template: {
          ...model.custom_template,
          prototype_tabs: updatedTabs,
        },
      })

      toast.success('Prototype tabs updated successfully')
      window.location.reload()
    } catch (error) {
      console.error('Failed to update prototype tabs:', error)
      toast.error('Failed to update prototype tabs. Please try again.')
    }
  }

  return prototype ? (
    <div className="flex flex-col w-full h-full relative">
      <div className="flex min-h-[52px] border-b border-border bg-background">
        <div className="flex w-fit">
          <PrototypeTabs tabs={model?.custom_template?.prototype_tabs} />
        </div>
        {isModelOwner && (
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
        <DaTabItem
          active={tab === 'staging'}
          to={`/model/${model_id}/library/prototype/${prototype_id}/staging`}
          dataId="tab-staging"
        >
          <TbListCheck className="w-5 h-5 mr-2" />
          Staging
        </DaTabItem>
        {isModelOwner && (
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
                Manage Prototype Tabs
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  // Capture current model.custom_template data at the moment of click
                  if (model) {
                    const initialData = {
                      name: model.name || '',
                      description: '',
                      image: model.model_home_image_file || '',
                      visibility: model.visibility || 'public',
                      config: model.custom_template || {},
                      model_tabs: model.custom_template?.model_tabs || [],
                      prototype_tabs: model.custom_template?.prototype_tabs || [],
                    }
                    console.log('[PagePrototypeDetail] Setting templateInitialData:', {
                      model,
                      custom_template: model.custom_template,
                      initialData,
                    })
                    setTemplateInitialData(initialData)
                  }
                  setOpenTemplateForm(true)
                }}
              >
                Save Solution as Template
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="flex flex-col h-full overflow-y-auto relative">
        <div
          style={{ right: showRt ? '3.5rem' : '0' }}
          className="absolute left-0 bottom-0 top-0 grow h-full z-0"
        >
          {isDefaultTab && (
            <PrototypeTabInfo prototype={prototype} />
          )}
          {tab == 'journey' && <PrototypeTabJourney prototype={prototype} />}
          {tab == 'code' && <PrototypeTabCode />}
          {tab == 'dashboard' && <PrototypeTabDashboard />}
          {tab == 'feedback' && <PrototypeTabFeedback />}
          {tab == 'staging' && <PrototypeTabStaging prototype={prototype} />}
          
          {/* Render ALL plugin components unconditionally - they stay mounted and cached */}
          {/* Only show the one that matches current tab and pluginId */}
          {prototypeTabs
            .filter((tabConfig): tabConfig is TabConfig & { plugin: string } => 
              tabConfig.type === 'custom' && !!tabConfig.plugin
            )
            .map((tabConfig) => {
              // Show only if we're on the 'plug' tab AND this plugin matches the pluginId
              const isActive = tab === 'plug' && pluginId === tabConfig.plugin
              return (
                <div
                  key={tabConfig.plugin}
                  className={isActive ? 'w-full h-full' : 'hidden'}
                >
                  <PagePrototypePlugin pluginSlug={tabConfig.plugin} />
                </div>
              )
            })}
          
          {/* Fallback: if no plugin tabs configured but plugid in URL, render single instance */}
          {/* (for backward compatibility or direct navigation) */}
          {tab === 'plug' && pluginId && 
            prototypeTabs.filter(t => t.type === 'custom' && t.plugin === pluginId).length === 0 && (
              <PagePrototypePlugin pluginSlug={pluginId} />
            )
          }
        </div>
        {showRt && <DaRuntimeControl />}
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
        title="Manage Prototype Tabs"
        description="Reorder tabs, edit labels, hide/show tabs, and remove custom tabs"
      />

      {/* Template Form Dialog */}
      <DaDialog
        open={openTemplateForm}
        onOpenChange={setOpenTemplateForm}
        className="w-[840px] max-w-[calc(100vw-80px)]"
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
  ) : (
    <div className="flex flex-col items-center justify-center w-full h-full gap-4">
      <Spinner size={32} />
      <p className="text-base text-muted-foreground">Loading prototype...</p>
    </div>
  )
}

export default PagePrototypeDetail
