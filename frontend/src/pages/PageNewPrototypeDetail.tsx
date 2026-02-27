// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC, useCallback, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { configManagementService } from '@/services/configManagement.service'
import { getModel } from '@/services/model.service'
import { getPrototype } from '@/services/prototype.service'
import useModelStore from '@/stores/modelStore'
import useListModelLite from '@/hooks/useListModelLite'
import { Model, Prototype } from '@/types/model.type'
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom'
import { Spinner } from '@/components/atoms/spinner'
import {
    TbDotsVertical,
    TbPlus,
    TbListCheck,
    TbSettings,
    TbLayoutSidebar,
} from 'react-icons/tb'
import { GiSaveArrow } from "react-icons/gi";
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
import PluginPageRender from '@/components/organisms/PluginPageRender'
import CustomTabEditor, { TabConfig, StagingConfig } from '@/components/organisms/CustomTabEditor'
import PrototypeTabInfo from '../components/organisms/PrototypeTabInfo'
import TemplateForm from '@/components/organisms/TemplateForm'
import FormNewPrototype from '@/components/molecules/forms/FormNewPrototype'
import FormCreateModel from '@/components/molecules/forms/FormCreateModel'
import PrototypeTabJourney from '@/components/organisms/PrototypeTabJourney'
import PrototypeTabStaging from '@/components/organisms/PrototypeTabStaging'
import PrototypeTabs, { getTabConfig } from '@/components/molecules/PrototypeTabs'
import DaTabItem from '@/components/atoms/DaTabItem'
import usePluginPreloader from '@/hooks/usePluginPreloader'
import PrototypeSidebar from '@/components/organisms/PrototypeSidebar'
import StagingTabButton from '@/components/organisms/StagingTabButton'

interface ViewPrototypeProps {
    display?: 'tree' | 'list'
}

const NEW_PROTOTYPE_SESSION_KEY = 'autowrx_new_prototype_session'

type NewPrototypeSession = {
    modelId: string
    prototypeId: string
    prototypeName: string
}

const readSession = (): NewPrototypeSession | null => {
    try {
        const raw = localStorage.getItem(NEW_PROTOTYPE_SESSION_KEY)
        return raw ? JSON.parse(raw) : null
    } catch {
        return null
    }
}

const saveSession = (session: NewPrototypeSession) => {
    localStorage.setItem(NEW_PROTOTYPE_SESSION_KEY, JSON.stringify(session))
}

const clearSession = () => {
    localStorage.removeItem(NEW_PROTOTYPE_SESSION_KEY)
}

const PageNewPrototypeDetail: FC<ViewPrototypeProps> = ({ }) => {
    const { model_id, prototype_id, tab } = useParams()
    const [searchParams, setSearchParams] = useSearchParams()
    const pluginId = searchParams.get('plugid')
    const newPrototypeParam = searchParams.get('newPrototype')
    const createModelParam = searchParams.get('create-model')
    const navigate = useNavigate()
    const { data: user } = useSelfProfileQuery()
    const { data: model } = useCurrentModel()
    const { data: fetchedPrototype, isLoading: isPrototypeLoading } =
        useCurrentPrototype()
    const [prototype, setActivePrototype, setActiveModel] = useModelStore((state) => [
        state.prototype as Prototype,
        state.setActivePrototype,
        state.setActiveModel,
    ])
    const [isDefaultTab, setIsDefaultTab] = useState(false)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [openStagingDialog, setOpenStagingDialog] = useState(false)
    const [showRt, setShowRt] = useState(false)
    const [isModelOwner, setIsModelOwner] = useState(false)
    const [openAddonDialog, setOpenAddonDialog] = useState(false)
    const [openManageAddonsDialog, setOpenManageAddonsDialog] = useState(false)
    const [openTemplateForm, setOpenTemplateForm] = useState(false)
    const [openNewPrototypeDialog, setOpenNewPrototypeDialog] = useState(false)
    const [openCreateModelDialog, setOpenCreateModelDialog] = useState(false)
    // Previous session resume dialog
    const [openResumeDialog, setOpenResumeDialog] = useState(false)
    console.log({ openResumeDialog })
    const [savedSession, setSavedSession] = useState<NewPrototypeSession | null>(null)
    // Active plugin tab in new-prototype flow
    const [newFlowActivePluginId, setNewFlowActivePluginId] = useState<string | null>(null)
    // Active builtin tab in new-prototype flow ('code' | 'dashboard' | 'overview' | 'journey' | null)
    const [newFlowActiveBuiltinKey, setNewFlowActiveBuiltinKey] = useState<string | null>(null)
    // Preview model for the new-prototype flow (no prototype_id in URL)
    const [previewModelId, setPreviewModelId] = useState<string>('')
    const [templateInitialData, setTemplateInitialData] = useState<{
        name?: string
        description?: string
        image?: string
        visibility?: string
        config?: any
        model_tabs?: Array<{ label: string; plugin: string }>
        prototype_tabs?: TabConfig[]
    } | undefined>(undefined)

    // Open new prototype dialog when ?newPrototype=true is present in URL
    useEffect(() => {
        if (newPrototypeParam === 'true') {
            setOpenNewPrototypeDialog(true)
        }
    }, [newPrototypeParam])

    // Open create model dialog when ?create-model is present in URL
    useEffect(() => {
        if (createModelParam !== null) {
            setOpenCreateModelDialog(true)
        }
    }, [createModelParam])

    // On mount in new-prototype flow: check for a saved session
    useEffect(() => {
        if (!prototype_id) {
            // If create-model param is present, it takes priority — skip resume dialog
            const params = new URLSearchParams(window.location.search)
            if (params.has('create-model')) return
            const session = readSession()
            if (session) {
                setSavedSession(session)
                setOpenResumeDialog(true)
                setOpenNewPrototypeDialog(false)
            } else {
                setOpenNewPrototypeDialog(true)
            }
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const handleStartNew = () => {
        clearSession()
        setSavedSession(null)
        setOpenResumeDialog(false)
        setOpenNewPrototypeDialog(true)
    }

    const handlePrototypeCreated = (modelId: string, prototypeId: string, prototypeName: string) => {
        const session: NewPrototypeSession = { modelId, prototypeId, prototypeName }
        saveSession(session)
        setSavedSession(session)
        setOpenNewPrototypeDialog(false)
    }

    // Model list for preview (new-prototype flow)
    const { data: allModels } = useListModelLite()

    // Default previewModelId to the last model in the list
    useEffect(() => {
        if (allModels?.results && allModels.results.length > 0 && !previewModelId) {
            const last = allModels.results[allModels.results.length - 1]
            setPreviewModelId(last.id)
        }
    }, [allModels, previewModelId])

    // Fetch the selected preview model to get its prototype_tabs config
    const { data: previewModel } = useQuery<Model>({
        queryKey: ['model', previewModelId],
        queryFn: () => getModel(previewModelId),
        enabled: !!previewModelId && !prototype_id,
    })

    // Fetch session model + prototype (for /new-prototype after creation/resume)
    const { data: sessionModel } = useQuery<Model>({
        queryKey: ['model', savedSession?.modelId],
        queryFn: () => getModel(savedSession!.modelId),
        enabled: !!savedSession?.modelId && !prototype_id,
    })
    const { data: sessionPrototype } = useQuery<Prototype>({
        queryKey: ['prototype', savedSession?.prototypeId],
        queryFn: async () => {
            const p = await getPrototype(savedSession!.prototypeId)
            if (!p) throw new Error('Prototype not found')
            return p
        },
        enabled: !!savedSession?.prototypeId && !prototype_id,
    })

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

    // Whether we are in the new-prototype creation flow (no prototype_id in URL)
    const isNewPrototypeFlow = !prototype_id

    // In new-prototype flow: prefer session model once created, else preview model; otherwise use URL model
    const effectiveModel = isNewPrototypeFlow
        ? (savedSession ? sessionModel : previewModel)
        : model

    // Effective model/prototype IDs and prototype for this flow
    const newFlowModelId = savedSession?.modelId || previewModelId
    const newFlowPrototype = (sessionPrototype as Prototype | undefined) ?? null

    // Extract prototype tabs for preloading
    const prototypeTabs = getTabConfig(model?.custom_template?.prototype_tabs)

    // Extract sidebar plugin slug
    const sidebarPlugin: string | undefined = model?.custom_template?.prototype_sidebar_plugin || undefined
    const effectiveSidebarPlugin: string | undefined = effectiveModel?.custom_template?.prototype_sidebar_plugin || undefined

    // Extract staging tab config (with fallback from legacy prototype_staging_label)
    const stagingConfig: StagingConfig = model?.custom_template?.prototype_staging_config
        || (model?.custom_template?.prototype_staging_label ? { label: model.custom_template.prototype_staging_label } : {})

    // Preload plugin JavaScript files
    usePluginPreloader({
        prototypeTabs,
        stagingPlugins,
        enabled: !!user, // Only preload if user is authenticated
        delay: 2000, // Start preloading 2 seconds after page load
    })

    // When effectiveModel changes (model selected or created), auto-select first visible custom plugin tab
    useEffect(() => {
        if (!isNewPrototypeFlow) return
        const tabs = getTabConfig(effectiveModel?.custom_template?.prototype_tabs)
        const firstCustom = tabs.find(t => !t.hidden && t.type === 'custom' && t.plugin)
        setNewFlowActivePluginId(firstCustom?.plugin ?? null)
    }, [effectiveModel, isNewPrototypeFlow])

    // Populate model store when effectiveModel changes in new-prototype flow
    useEffect(() => {
        if (!isNewPrototypeFlow || !effectiveModel) return
        setActiveModel(effectiveModel as any)
    }, [effectiveModel, isNewPrototypeFlow])

    // Sync model_id and prototype_id into URL search params so hooks like
    // useCurrentModel / useCurrentPrototype work for sidebar/plugins at /new-prototype
    useEffect(() => {
        if (!isNewPrototypeFlow) return
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev)
            if (newFlowModelId) {
                next.set('model_id', newFlowModelId)
            } else {
                next.delete('model_id')
            }
            if (savedSession?.prototypeId) {
                next.set('prototype_id', savedSession.prototypeId)
            } else {
                next.delete('prototype_id')
            }
            return next
        }, { replace: true })
    }, [isNewPrototypeFlow, newFlowModelId, savedSession?.prototypeId])

    // Populate store when session prototype is fetched (but only for new-prototype flow)
    useEffect(() => {
        if (sessionPrototype && isNewPrototypeFlow) {
            setActivePrototype(sessionPrototype as Prototype)
        }
    }, [sessionPrototype, isNewPrototypeFlow, setActivePrototype])

    // Populate store when fetched prototype changes (normal flow)
    useEffect(() => {
        if (fetchedPrototype && !isNewPrototypeFlow) {
            setActivePrototype(fetchedPrototype)
        }
    }, [fetchedPrototype, isNewPrototypeFlow, setActivePrototype])

    useEffect(() => {
        if (!tab || tab === 'view') {
            // Only show overview content if overview is actually the first visible tab
            const firstVisible = prototypeTabs.find(t => !t.hidden)
            setIsDefaultTab(!firstVisible || (firstVisible.type === 'builtin' && firstVisible.key === 'overview'))
        } else {
            setIsDefaultTab(false)
        }
        setShowRt(['code', 'dashboard'].includes(tab || ''))
    }, [tab, prototypeTabs])

    // Auto-navigate to first visible tab when arriving on the default (no-tab / view) route
    useEffect(() => {
        // Skip auto-navigate when the new-prototype dialog is being shown
        if (newPrototypeParam === 'true') return
        if ((!tab || tab === 'view') && model_id && prototype_id && prototypeTabs.length > 0) {
            const firstVisible = prototypeTabs.find(t => !t.hidden)
            if (!firstVisible) return
            // overview maps to /view — already there, nothing to do
            if (firstVisible.type === 'builtin' && firstVisible.key === 'overview') return
            const base = `/model/${model_id}/library/prototype/${prototype_id}`
            if (firstVisible.type === 'builtin' && firstVisible.key) {
                navigate(`${base}/${firstVisible.key}`, { replace: true })
            } else if (firstVisible.type === 'custom' && firstVisible.plugin) {
                navigate(`${base}/plug?plugid=${firstVisible.plugin}`, { replace: true })
            }
        }
    }, [tab, prototypeTabs, model_id, prototype_id, navigate, newPrototypeParam])

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

    // Callback for plugins to navigate to a specific prototype tab
    const handleSetActiveTab = useCallback((targetTab: string, targetPluginSlug?: string) => {
        if (!model_id || !prototype_id) return
        const base = `/model/${model_id}/library/prototype/${prototype_id}`
        if (targetTab === 'plug' && targetPluginSlug) {
            navigate(`${base}/plug?plugid=${targetPluginSlug}`)
        } else {
            navigate(`${base}/${targetTab}`)
        }
    }, [model_id, prototype_id, navigate])

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

    const handleSaveCustomTabs = async (updatedTabs: TabConfig[], updatedSidebarPlugin?: string | null, updatedStagingConfig?: StagingConfig | null) => {
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

            // Update staging config: null means remove, object means set, undefined means no change
            if (updatedStagingConfig !== undefined) {
                updates.prototype_staging_config = updatedStagingConfig
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

    if (isNewPrototypeFlow) {
        const newFlowTabs = getTabConfig(effectiveModel?.custom_template?.prototype_tabs)
        const newFlowVisibleTabs = newFlowTabs.filter(t => !t.hidden)
        const activeNewFlowSidebar = effectiveModel?.custom_template?.prototype_sidebar_plugin || undefined
        const hasPrototype = !!newFlowPrototype && !openResumeDialog
        const newFlowShowRt = hasPrototype && (newFlowActiveBuiltinKey === 'code' || newFlowActiveBuiltinKey === 'dashboard')

        // Local tab navigation for new-prototype flow (never changes URL)
        const handleNewFlowSetActiveTab = (targetTab: string, targetPluginSlug?: string) => {
            if (targetTab === 'plug' && targetPluginSlug) {
                setNewFlowActivePluginId(targetPluginSlug)
                setNewFlowActiveBuiltinKey(null)
            } else {
                setNewFlowActivePluginId(null)
                setNewFlowActiveBuiltinKey(targetTab)
            }
        }

        return (
            <div className="flex w-full h-full relative">
                {/* Left sidebar */}
                {activeNewFlowSidebar && (
                    <PrototypeSidebar
                        pluginSlug={activeNewFlowSidebar}
                        isCollapsed={sidebarCollapsed}
                        onSetActiveTab={handleNewFlowSetActiveTab}
                    />
                )}

                {/* Right side: tab bar + content */}
                <div className="flex flex-col flex-1 h-full min-w-0">
                    <div className="flex min-h-13 border-b border-border bg-background">
                        {activeNewFlowSidebar && (
                            <button
                                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                                className="h-13 w-12 rounded-none hover:bg-accent shrink-0 flex items-center justify-center"
                                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                            >
                                <TbLayoutSidebar className="w-5 h-5" />
                            </button>
                        )}
                        {/* Inline tab bar — local state, never touches URL */}
                        <div className="flex flex-1 min-w-0 overflow-x-auto">
                            {newFlowVisibleTabs.map((tabConfig, index) => {
                                if (tabConfig.type === 'custom' && tabConfig.plugin) {
                                    const isActive = newFlowActivePluginId === tabConfig.plugin
                                    return (
                                        <button
                                            key={`nf-tab-${tabConfig.plugin}-${index}`}
                                            onClick={() => setNewFlowActivePluginId(tabConfig.plugin!)}
                                            className={`flex items-center px-4 h-full text-sm border-b-2 transition-colors ${isActive
                                                ? 'border-primary text-primary font-medium'
                                                : 'border-transparent text-muted-foreground hover:text-foreground'
                                                }`}
                                        >
                                            {tabConfig.label}
                                        </button>
                                    )
                                }
                                // Builtin tabs — clickable when prototype exists
                                const builtinKey = tabConfig.key as string
                                const isBuiltinActive = newFlowActiveBuiltinKey === builtinKey && !newFlowActivePluginId
                                const builtinClickable = hasPrototype
                                return (
                                    <button
                                        key={`nf-builtin-${builtinKey}-${index}`}
                                        disabled={!builtinClickable}
                                        onClick={() => builtinClickable && handleNewFlowSetActiveTab(builtinKey)}
                                        className={`flex items-center px-4 h-full text-sm border-b-2 transition-colors ${isBuiltinActive
                                            ? 'border-primary text-primary font-medium'
                                            : builtinClickable
                                                ? 'border-transparent text-muted-foreground hover:text-foreground'
                                                : 'border-transparent text-muted-foreground/30 cursor-default'
                                            }`}
                                    >
                                        {tabConfig.label}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Right-side actions — always visible (shrink-0) */}
                        <div className="flex shrink-0 items-center">
                            <StagingTabButton
                                stagingConfig={stagingConfig}
                                onClick={() => handleNewFlowSetActiveTab('staging')}
                                disabled={!hasPrototype}
                                active={newFlowActiveBuiltinKey === 'staging'}
                                title={hasPrototype ? 'View staging' : 'Create a prototype to enable staging'}
                            />
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
                                            <TbSettings className="w-5 h-5" />
                                            Manage Prototype Tabs
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onSelect={() => {
                                                // Capture current model.custom_template data at the moment of click
                                                if (model) {
                                                    // Normalize prototype_tabs to full TabConfig format (resolves old-format entries
                                                    // where builtin tabs were stored as { label, plugin: "" } without type/key).
                                                    const normalizedPrototypeTabs = getTabConfig(model.custom_template?.prototype_tabs)
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
                                                    console.log('[PageNewPrototypeDetail] Setting templateInitialData:', {
                                                        model,
                                                        custom_template: model.custom_template,
                                                        initialData,
                                                    })
                                                    setTemplateInitialData(initialData)
                                                }
                                                setOpenTemplateForm(true)
                                            }}
                                        >
                                            <GiSaveArrow className="w-5 h-5" />
                                            Save Solution as Template
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    </div>

                    {/* Content area */}
                    <div className="flex flex-1 h-full overflow-hidden relative">
                        <div
                            style={{ right: newFlowShowRt ? '3.5rem' : '0' }}
                            className="absolute left-0 top-0 bottom-0 z-0"
                        >
                            {/* Custom plugin tabs — always rendered, toggled visible */}
                            {newFlowVisibleTabs
                                .filter((t): t is TabConfig & { plugin: string } => t.type === 'custom' && !!t.plugin)
                                .map((tabConfig) => {
                                    const isActive = newFlowActivePluginId === tabConfig.plugin
                                    return (
                                        <div
                                            key={tabConfig.plugin}
                                            className={isActive ? 'w-full h-full' : 'hidden'}
                                        >
                                            <PluginPageRender
                                                plugin_id={tabConfig.plugin}
                                                data={{
                                                    model: effectiveModel
                                                        ? { ...effectiveModel, id: newFlowModelId }
                                                        : null,
                                                    prototype: newFlowPrototype,
                                                }}
                                                onSetActiveTab={handleNewFlowSetActiveTab}
                                            />
                                        </div>
                                    )
                                })}
                            {/* Builtin tab content */}
                            {!newFlowActivePluginId && newFlowActiveBuiltinKey === 'code' && hasPrototype && (
                                <PrototypeTabCode />
                            )}
                            {!newFlowActivePluginId && newFlowActiveBuiltinKey === 'dashboard' && hasPrototype && (
                                <PrototypeTabDashboard />
                            )}
                            {!newFlowActivePluginId && newFlowActiveBuiltinKey === 'journey' && hasPrototype && (
                                <PrototypeTabJourney prototype={newFlowPrototype!} />
                            )}
                            {!newFlowActivePluginId && newFlowActiveBuiltinKey === 'staging' && hasPrototype && (
                                <PrototypeTabStaging prototype={newFlowPrototype!} />
                            )}
                            {!newFlowActivePluginId &&
                                (!newFlowActiveBuiltinKey || newFlowActiveBuiltinKey === 'overview') &&
                                hasPrototype && <PrototypeTabInfo prototype={newFlowPrototype!} />}
                        </div>
                        {newFlowShowRt && <DaRuntimeControl />}
                    </div>
                </div>

                {/* New Prototype Dialog */}
                <DaDialog
                    open={openNewPrototypeDialog}
                    onOpenChange={(v) => {
                        setOpenNewPrototypeDialog(v)
                        if (!v && !savedSession) navigate('/')
                    }}
                    className="w-115 max-w-[calc(100vw-40px)]"
                >
                    <FormNewPrototype
                        onClose={() => {
                            setOpenNewPrototypeDialog(false)
                            if (!savedSession) navigate('/')
                        }}
                        onModelChange={(id) => setPreviewModelId(id ?? '')}
                        onSuccess={handlePrototypeCreated}
                    />
                </DaDialog>

                {/* Create Model Dialog */}
                <DaDialog
                    open={openCreateModelDialog}
                    onOpenChange={(v) => {
                        setOpenCreateModelDialog(v)
                        if (!v) {
                            navigate('/')
                        }
                    }}
                    dialogTitle=""
                    className="w-115 max-w-[calc(100vw-40px)]"
                >
                    <FormCreateModel />
                </DaDialog>

                {/* Continue Previous Session Dialog */}
                <DaDialog
                    open={openResumeDialog}
                    onOpenChange={(v) => { if (!v) handleStartNew() }}
                    className="w-105 max-w-[calc(100vw-40px)]"
                >
                    <div className="flex flex-col gap-4">
                        <div>
                            <p className="text-xl font-semibold text-da-primary-500">Continue Previous Session?</p>
                            <p className="text-md text-muted-foreground mt-1">
                                Do you want to continue with your previous session?
                            </p>
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                            <Button variant="outline" onClick={handleStartNew}>
                                Start New
                            </Button>
                            <Button onClick={() => navigate(`/model/${savedSession!.modelId}/library/prototype/${savedSession!.prototypeId}`)}>
                                Continue
                            </Button>
                        </div>
                    </div>
                </DaDialog>
            </div>
        )
    }

    return null
}

export default PageNewPrototypeDetail
