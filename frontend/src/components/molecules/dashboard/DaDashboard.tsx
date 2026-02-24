// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useEffect, useState, useRef } from 'react'
import DaDashboardGrid from './DaDashboardGrid'
import useModelStore from '@/stores/modelStore'
import { Prototype } from '@/types/model.type'
import PrototypeTabCodeDashboardCfg from '@/components/organisms/PrototypeTabCodeDashboardCfg'
import usePermissionHook from '@/hooks/usePermissionHook'
import { PERMISSIONS } from '@/const/permission'
import useCurrentModel from '@/hooks/useCurrentModel'
import {
  TbArrowsMaximize,
  TbArrowsMinimize,
  TbEdit,
  TbTrash,
  TbPalette,
  TbDeviceFloppy,
  TbCheck,
  TbDots,
} from 'react-icons/tb'
import { Button } from '@/components/atoms/button'
const MODE_RUN = 'run'
const MODE_EDIT = 'edit'
import { useSystemUI } from '@/hooks/useSystemUI'
import { cn } from '@/lib/utils'
import { DaImage } from '@/components/atoms/DaImage'
import { Link } from 'react-router-dom'
import { updatePrototypeService } from '@/services/prototype.service'
import useGetPrototype from '@/hooks/useGetPrototype'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  listDashboardTemplates,
  createDashboardTemplate,
  updateDashboardTemplate,
  type DashboardTemplate,
} from '@/services/dashboardTemplate.service'
import { toast } from 'react-toastify'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu'
import DaDialog from '@/components/molecules/DaDialog'

const DaDashboard = () => {
  const { data: model } = useCurrentModel()
  const [
    prototype,
    setActivePrototype,
    prototypeHasUnsavedChanges,
    setPrototypeHasUnsavedChanges,
  ] = useModelStore((state) => [
    state.prototype as Prototype,
    state.setActivePrototype,
    state.prototypeHasUnsavedChanges,
    state.setPrototypeHasUnsavedChanges,
  ])
  const [widgetItems, setWidgetItems] = useState<any>([])
  const [mode, setMode] = useState<string>(MODE_RUN)
  const [isAuthorized, isAdmin] = usePermissionHook(
    [PERMISSIONS.READ_MODEL, model?.id],
    [PERMISSIONS.MANAGE_USERS],
  )
  const {
    showPrototypeDashboardFullScreen,
    setShowPrototypeDashboardFullScreen,
  } = useSystemUI()

  const originalWidgetConfigRef = useRef<string>('')
  const [pendingChanges, setPendingChanges] = useState(false)
  const { refetch } = useGetPrototype(prototype?.id || '')

  // --- Template state ---
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templateDesc, setTemplateDesc] = useState('')
  const [applyOpen, setApplyOpen] = useState(false)

  const [conflictTemplate, setConflictTemplate] = useState<DashboardTemplate | null>(null)
  const [showOverrideDialog, setShowOverrideDialog] = useState(false)

  const { data: templatesData } = useQuery({
    queryKey: ['dashboard-templates-list'],
    queryFn: () => listDashboardTemplates({ limit: 100, page: 1 }),
  })

  const buildWidgetConfig = () => {
    if (!prototype?.widget_config) return undefined
    try { return JSON.parse(prototype.widget_config) } catch { return undefined }
  }

  // Derive the currently applied template ID from prototype.extend
  const activeTemplateId: string | undefined = prototype?.extend?.dashboard_template_id ?? undefined

  const closeSaveDialog = () => {
    setShowSaveDialog(false)
    setTemplateName('')
    setTemplateDesc('')
  }

  const saveTemplateMutation = useMutation({
    mutationFn: () =>
      createDashboardTemplate({
        name: templateName.trim(),
        description: templateDesc.trim() || undefined,
        visibility: 'public',
        widget_config: buildWidgetConfig(),
      }),
    onSuccess: () => {
      toast.success('Dashboard saved as template')
      closeSaveDialog()
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message || e.message || 'Failed to save template'),
  })

  const overrideTemplateMutation = useMutation({
    mutationFn: (id: string) =>
      updateDashboardTemplate(id, {
        name: templateName.trim(),
        description: templateDesc.trim() || undefined,
        widget_config: buildWidgetConfig(),
      }),
    onSuccess: () => {
      toast.success('Template overridden successfully')
      setShowOverrideDialog(false)
      setConflictTemplate(null)
      closeSaveDialog()
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message || e.message || 'Failed to override template'),
  })

  const handleSaveTemplate = () => {
    const name = templateName.trim().toLowerCase()
    const existing = templatesData?.results?.find(
      (t) => t.name.toLowerCase() === name,
    )
    if (existing) {
      setConflictTemplate(existing)
      setShowOverrideDialog(true)
    } else {
      saveTemplateMutation.mutate()
    }
  }

  const handleApplyTemplate = async (template: DashboardTemplate) => {
    if (!template.widget_config) {
      toast.warn('This template has no widget configuration')
      return
    }
    const newConfig = JSON.stringify(template.widget_config, null, 2)
    const newExtend = { ...(prototype?.extend ?? {}), dashboard_template_id: template.id }
    const newPrototype = { ...prototype, widget_config: newConfig, extend: newExtend }
    setActivePrototype(newPrototype)
    setApplyOpen(false)
    if (prototype?.id) {
      try {
        await updatePrototypeService(prototype.id, {
          widget_config: newConfig,
          extend: newExtend,
        })
        setPrototypeHasUnsavedChanges(false)
        toast.success(`Template "${template.name}" applied`)
      } catch (error) {
        console.error('Error applying template:', error)
        toast.error('Failed to save template to prototype')
      }
    }
  }

  useEffect(() => {
    if (prototypeHasUnsavedChanges && prototype?.id) {
      refetch()
        .then((response) => {
          if (response.data) {
            setActivePrototype(response.data)
            setPrototypeHasUnsavedChanges(false)
          }
        })
        .catch((error) => {
          console.error('Error refreshing prototype data:', error)
        })
    }
  }, [])

  useEffect(() => {
    let widgetItems = []
    // prototype.widget_config: JSON string
    if (prototype?.widget_config) {
      try {
        let dashboard_config = JSON.parse(prototype.widget_config) // prototype.dashboard_config: JSON object
        if (Array.isArray(dashboard_config)) {
          widgetItems = dashboard_config
        } else {
          if (
            dashboard_config?.widgets &&
            Array.isArray(dashboard_config.widgets)
          ) {
            widgetItems = dashboard_config.widgets
          }
        }
      } catch (err) {
        console.error('Error parsing widget config', err)
      }
    }
    //
    processWidgetItems(widgetItems)
    setWidgetItems(widgetItems)
  }, [prototype?.widget_config])

  const processWidgetItems = (widgetItems: any[]) => {
    if (!widgetItems) return
    widgetItems.forEach((widget) => {
      if (!widget?.url) {
        if (widget.options?.url) {
          widget.url = widget.options.url
        } else if (widget.path) {
          // For built-in widgets, use the static path
          widget.url = widget.path
        }
      }
    })
  }

  const handleEnterEditMode = () => {
    originalWidgetConfigRef.current = prototype?.widget_config || ''
    setMode(MODE_EDIT)
    setPendingChanges(false)
  }

  const handleDeleteAllWidgets = async () => {
    const emptyConfig = JSON.stringify(
      {
        autorun: false,
        widgets: [],
      },
      null,
      4,
    )

    setWidgetItems([])

    const newPrototype = { ...prototype, widget_config: emptyConfig }
    setActivePrototype(newPrototype)

    setPendingChanges(true)
    setPrototypeHasUnsavedChanges(true) // Mark that we have unsaved changes
  }

  const handleSave = async () => {
    const hasTemplate = !!activeTemplateId
    if ((pendingChanges || hasTemplate) && prototype?.id) {
      try {
        // Clear dashboard_template_id since user manually edited the dashboard
        const newExtend = { ...(prototype?.extend ?? {}), dashboard_template_id: null }
        await updatePrototypeService(prototype.id, {
          widget_config: prototype.widget_config,
          extend: newExtend,
        })
        setActivePrototype({ ...prototype, extend: newExtend })
        setPrototypeHasUnsavedChanges(false)
      } catch (error) {
        console.error('Error saving widget configuration:', error)
      }
    }
    setMode(MODE_RUN)
    setPendingChanges(false)
  }

  const handleCancel = () => {
    // Restore the original configuration
    if (pendingChanges && originalWidgetConfigRef.current) {
      const originalPrototype = {
        ...prototype,
        widget_config: originalWidgetConfigRef.current,
      }
      setActivePrototype(originalPrototype)
    }
    setMode(MODE_RUN)
    setPendingChanges(false)
    setPrototypeHasUnsavedChanges(false)
  }

  return (
    <div className="w-full h-full relative border bg-white">
      <div
        className={cn(
          'absolute z-10 left-0 px-2 top-0 flex w-full py-1 shadow-xl bg-white items-center',
          showPrototypeDashboardFullScreen && 'h-[56px]',
        )}
      >
        {showPrototypeDashboardFullScreen && (
          <Link to="/" className="w-fit h-[56px] flex items-center px-2">
            <DaImage src="/imgs/logo-wide.png" className="object-contain" />
          </Link>
        )}
        {isAuthorized && (
          <div className="flex w-full h-fit items-center justify-end mr-2">
            {mode == MODE_RUN && (
              <div className="flex items-center gap-1">
                {/* Apply Template — all authorized users */}
                <DropdownMenu open={applyOpen} onOpenChange={setApplyOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" data-id="dashboard-apply-template-button">
                      <TbPalette className="size-4" />
                      {activeTemplateId && templatesData?.results?.find((t) => t.id === activeTemplateId)
                        ? templatesData.results.find((t) => t.id === activeTemplateId)!.name
                        : 'Templates'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 max-h-64 overflow-y-auto">
                    {templatesData?.results?.length ? (
                      templatesData.results.map((t: DashboardTemplate) => (
                        <DropdownMenuItem
                          key={t.id}
                          onClick={() => handleApplyTemplate(t)}
                          className="cursor-pointer"
                        >
                          <span className="flex size-4 mr-2 shrink-0 items-center justify-center">
                            {t.id === activeTemplateId
                              ? <TbCheck className="size-4 text-da-primary-500" />
                              : <TbPalette className="size-4" />}
                          </span>
                          <span className={`truncate ${t.id === activeTemplateId ? 'font-semibold text-da-primary-500' : ''}`}>
                            {t.name}
                          </span>
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <DropdownMenuItem disabled>
                        No templates available
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant="outline"
                  size="sm"
                  data-id="dashboard-edit-button"
                  onClick={handleEnterEditMode}
                >
                  <TbEdit className="size-4" />
                  Edit
                </Button>

                {/* 3-dot menu — admin only */}
                {isAdmin && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <TbDots className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => setShowSaveDialog(true)}
                      >
                        <TbDeviceFloppy className="size-4 mr-2" />
                        Save as Template
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            )}

            {mode == MODE_EDIT && (
              <div className="flex flex-col w-full h-full">
                <div className="flex w-full h-fit justify-between">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-fit flex text-destructive hover:bg-transparent hover:text-destructive/90"
                    onClick={handleDeleteAllWidgets}
                    data-id="dashboard-delete-all-widgets"
                  >
                    <TbTrash className="size-4 mr-1" />
                    Delete all widgets
                  </Button>
                  <div className="flex w-fit ml-auto items-center space-x-2 mr-2">
                    <Button
                      size="sm"
                      onClick={handleCancel}
                      variant="outline"
                      data-id="dashboard-cancel-button"
                      className="w-16"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      data-id="dashboard-save-button"
                      className="w-16"
                    >
                      Save
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          data-id="dashboard-fullscreen-button"
          onClick={() =>
            setShowPrototypeDashboardFullScreen(
              !showPrototypeDashboardFullScreen,
            )
          }
        >
          {showPrototypeDashboardFullScreen ? (
            <TbArrowsMinimize className="size-4" />
          ) : (
            <TbArrowsMaximize className="size-4" />
          )}
        </Button>
      </div>

      <div
        className={cn(
          'w-full h-full absolute top-0 left-0 right-0 bottom-0 ',
          showPrototypeDashboardFullScreen ? 'pt-[56px]' : 'pt-[38px]',
        )}
      >
        <div
          className={cn(
            'flex flex-col w-full h-full pt-1',
            showPrototypeDashboardFullScreen && 'pr-14',
          )}
        >
          {mode == MODE_RUN && (
            <div className="flex w-full h-full px-1 pb-1">
              <DaDashboardGrid widgetItems={widgetItems} />
            </div>
          )}
          {mode == MODE_EDIT && (
            <div className="px-4 h-full">
              <PrototypeTabCodeDashboardCfg />
            </div>
          )}
        </div>
      </div>

      {/* Confirm Override Dialog */}
      <DaDialog
        open={showOverrideDialog}
        onOpenChange={(v) => {
          if (!v) setConflictTemplate(null)
          setShowOverrideDialog(v)
        }}
        dialogTitle="Override Existing Template?"
        className="w-105"
      >
        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted-foreground">
            A template named <span className="font-semibold text-foreground">&quot;{conflictTemplate?.name}&quot;</span> already exists.
            Do you want to override it with the current dashboard layout?
          </p>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setShowOverrideDialog(false); setConflictTemplate(null) }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={overrideTemplateMutation.isPending}
              onClick={() => conflictTemplate && overrideTemplateMutation.mutate(conflictTemplate.id)}
            >
              {overrideTemplateMutation.isPending ? 'Overriding…' : 'Override'}
            </Button>
          </div>
        </div>
      </DaDialog>

      {/* Save as Template Dialog */}
      <DaDialog
        open={showSaveDialog}
        onOpenChange={(v) => {
          if (!v) { setTemplateName(''); setTemplateDesc('') }
          setShowSaveDialog(v)
        }}
        dialogTitle="Save Dashboard as Template"
        className="w-110"
      >
        <div className="space-y-4 pt-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">Template Name *</label>
            <input
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="My Dashboard Template"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Description (optional)</label>
            <textarea
              className="flex min-h-18 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Short description..."
              value={templateDesc}
              onChange={(e) => setTemplateDesc(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setShowSaveDialog(false); setTemplateName(''); setTemplateDesc('') }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!templateName.trim() || saveTemplateMutation.isPending}
              onClick={handleSaveTemplate}
            >
              {saveTemplateMutation.isPending ? 'Saving…' : 'Save Template'}
            </Button>
          </div>
        </div>
      </DaDialog>
    </div>
  )
}

export default DaDashboard

