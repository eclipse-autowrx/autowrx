import { useEffect, useMemo, useState, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createModelTemplate,
  getModelTemplateById,
  updateModelTemplate,
  type ModelTemplate,
} from '@/services/modelTemplate.service'
import { Input } from '@/components/atoms/input'
import { Textarea } from '@/components/atoms/textarea'
import { Label } from '@/components/atoms/label'
import { Button } from '@/components/atoms/button'
import { Spinner } from '@/components/atoms/spinner'
import DaTabItem from '@/components/atoms/DaTabItem'
import DaImportFile from '@/components/atoms/DaImportFile'
import ActionButtonsTab from '@/components/organisms/ActionButtonsTab'
// No direct JSON editor; we provide structured editors for config
import { uploadFileService } from '@/services/upload.service'
import {
  TbPhotoEdit,
  TbListCheck,
  TbEye,
  TbEyeOff,
  TbGripVertical,
  TbPuzzle,
  TbLayoutSidebar,
  TbSearch,
  TbTrash,
  TbPencil,
  TbChevronUp,
  TbCode,
  TbRoute,
  TbMapPin,
  TbGauge,
  TbMessagePlus,
  TbCheck,
  TbX,
} from 'react-icons/tb'
import { MdOutlineDoubleArrow } from 'react-icons/md'
import { toast } from 'react-toastify'
import { listPlugins, type Plugin } from '@/services/plugin.service'
import {
  TabConfig,
  StagingConfig,
  RightNavPluginButton,
  TabsBorderRadius,
  ensureStagingRightNavButton,
} from '@/components/organisms/CustomTabEditor'
import DOMPurify from 'dompurify'
import { DaSelect, DaSelectItem } from '@/components/atoms/DaSelect'
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from '@hello-pangea/dnd'

// Template-safe normalizer: preserves full TabConfig without injecting default builtin tabs.
// Used only inside TemplateForm so that the saved template contains exactly what was configured,
// and builtin tabs that are not explicitly listed are NOT auto-added on the new model.
const normalizeTabsForTemplate = (tabs?: any[]): TabConfig[] => {
  if (!tabs || tabs.length === 0) return []
  // Already new format (has 'type' field) — return as-is
  if ('type' in tabs[0]) return tabs as TabConfig[]
  // Old format ({ label, plugin }): convert to custom type only, no builtin defaults
  return tabs.map((tab) => ({
    type: 'custom' as const,
    label: tab.label || '',
    plugin: tab.plugin || '',
  }))
}

type Props = {
  templateId?: string
  onClose: () => void
  open?: boolean
  initialData?: {
    name?: string
    description?: string
    image?: string
    visibility?: string
    config?: any // Full custom_template object
    model_tabs?: Array<{ label: string; plugin: string }>
    prototype_tabs?: TabConfig[]
  }
}

export default function TemplateForm({
  templateId,
  onClose,
  open,
  initialData,
}: Props) {
  const qc = useQueryClient()
  const isCreate = useMemo(() => !templateId, [templateId])
  const [activeTab, setActiveTab] = useState<'meta' | 'model' | 'prototype'>(
    'meta',
  )
  const prevOpenRef = useRef(open)

  const { data: initial, isFetching } = useQuery({
    queryKey: ['model-template', templateId],
    queryFn: () =>
      templateId
        ? getModelTemplateById(templateId)
        : Promise.resolve(undefined),
    enabled: !isCreate && !!templateId,
  })

  const [form, setForm] = useState<Partial<ModelTemplate>>({
    name: '',
    description: '',
    image: '',
    visibility: 'public',
    config: {},
  })
  const [modelTabs, setModelTabs] = useState<
    Array<{ label: string; plugin: string }>
  >([])
  const [prototypeTabs, setPrototypeTabs] = useState<TabConfig[]>([])
  const [prototypeStagingConfig, setPrototypeStagingConfig] =
    useState<StagingConfig>({})
  const [prototypeTabsVariant, setPrototypeTabsVariant] =
    useState<string>('tab')
  const [prototypeTabsBorderRadius, setPrototypeTabsBorderRadius] =
    useState<TabsBorderRadius>('round')
  const [prototypeRightNavButtons, setPrototypeRightNavButtons] = useState<
    RightNavPluginButton[]
  >([])
  const [localSidebarPlugin, setLocalSidebarPlugin] = useState<string | null>(
    null,
  )
  const [showSidebarPluginPicker, setShowSidebarPluginPicker] = useState(false)
  const [sidebarSearchTerm, setSidebarSearchTerm] = useState('')
  const [activePrototypeTab, setActivePrototypeTab] = useState<
    'tabs' | 'style' | 'sidebar' | 'actions'
  >('tabs')
  const [editingTabIndex, setEditingTabIndex] = useState<number | null>(null)
  const [editingTabLabel, setEditingTabLabel] = useState('')
  const [editingTabIconSvg, setEditingTabIconSvg] = useState('')
  const { data: pluginData } = useQuery({
    queryKey: ['plugins-for-template'],
    queryFn: () => listPlugins({ limit: 1000, page: 1 }),
  })

  useEffect(() => {
    if (initial) {
      setForm(initial)
      const cfg: any = initial.config || {}
      setModelTabs(
        Array.isArray(cfg.model_tabs)
          ? cfg.model_tabs.map((x: any) => ({
              label: x.label || '',
              plugin: x.plugin || '',
            }))
          : [],
      )
      setPrototypeTabs(
        Array.isArray(cfg.prototype_tabs)
          ? normalizeTabsForTemplate(cfg.prototype_tabs)
          : [],
      )
      setPrototypeTabsVariant(cfg.prototype_tabs_variant || 'tab')
      setPrototypeTabsBorderRadius(cfg.prototype_tabs_border_radius || 'round')
      setLocalSidebarPlugin(cfg.prototype_sidebar_plugin || null)
      // Extract staging config and non-staging right nav buttons from prototype_right_nav_buttons
      const rightNavRaw: RightNavPluginButton[] = Array.isArray(
        cfg.prototype_right_nav_buttons,
      )
        ? cfg.prototype_right_nav_buttons
        : []
      const stagingItem = rightNavRaw.find((b) => b.builtin === 'staging')
      const stagingItemConfig: StagingConfig = stagingItem
        ? {
            label: stagingItem.label,
            iconSvg: stagingItem.iconSvg,
            hideIcon: stagingItem.hideIcon,
            variant: stagingItem.variant,
            hidden: stagingItem.hidden,
            corners: stagingItem.corners,
          }
        : {}
      setPrototypeStagingConfig(stagingItemConfig)
      setPrototypeRightNavButtons(
        ensureStagingRightNavButton(rightNavRaw, stagingItemConfig),
      )
    } else {
      setForm({
        name: '',
        description: '',
        image: '',
        visibility: 'public',
        config: {},
      })
      setModelTabs([])
      setPrototypeTabs([])
      setPrototypeStagingConfig({})
      setPrototypeRightNavButtons(ensureStagingRightNavButton([]))
      setPrototypeTabsVariant('tab')
      setPrototypeTabsBorderRadius('round')
      setLocalSidebarPlugin(null)
    }
  }, [initial])

  // Reset when opening create mode (only when dialog transitions from closed to open)
  useEffect(() => {
    const wasOpen = prevOpenRef.current
    prevOpenRef.current = open

    if (open && !wasOpen && isCreate) {
      setActiveTab('meta')
      // If no initialData, reset to empty form
      if (!initialData) {
        setForm({
          name: '',
          description: '',
          image: '',
          visibility: 'public',
          config: {},
        })
        setModelTabs([])
        setPrototypeTabs([])
        setPrototypeStagingConfig({})
        setPrototypeRightNavButtons(ensureStagingRightNavButton([]))
        setPrototypeTabsBorderRadius('round')
        setLocalSidebarPlugin(null)
      }
    }
  }, [open, isCreate, initialData])

  // Handle initialData when dialog is open and in create mode
  useEffect(() => {
    if (open && isCreate && initialData) {
      // Get the full config from initialData.config (custom_template)
      const fullConfig = initialData.config || {}

      // Extract tabs directly from config (custom_template) - this is the source of truth
      const modelTabsFromConfig = Array.isArray(fullConfig.model_tabs)
        ? fullConfig.model_tabs
        : []
      const prototypeTabsFromConfig = Array.isArray(fullConfig.prototype_tabs)
        ? fullConfig.prototype_tabs
        : []

      // Pre-populate with initial data, preserving entire config structure
      setForm({
        name: initialData.name || '',
        description: initialData.description || '',
        image: initialData.image || '',
        visibility:
          (initialData.visibility as 'public' | 'private' | 'default') ||
          'public',
        config: fullConfig, // Preserve entire custom_template structure
      })
      setModelTabs(
        modelTabsFromConfig.map((x: any) => ({
          label: x.label || '',
          plugin: x.plugin || '',
        })),
      )
      // Preserve full TabConfig structure (type, key, hidden) without adding default builtin tabs
      setPrototypeTabs(normalizeTabsForTemplate(prototypeTabsFromConfig))
      setPrototypeTabsVariant(fullConfig.prototype_tabs_variant || 'tab')
      setPrototypeTabsBorderRadius(
        fullConfig.prototype_tabs_border_radius || 'round',
      )
      setLocalSidebarPlugin(fullConfig.prototype_sidebar_plugin || null)
      // Extract staging config and non-staging right nav buttons from prototype_right_nav_buttons
      const rightNavRaw2: RightNavPluginButton[] = Array.isArray(
        fullConfig.prototype_right_nav_buttons,
      )
        ? fullConfig.prototype_right_nav_buttons
        : []
      const stagingItem2 = rightNavRaw2.find((b) => b.builtin === 'staging')
      const stagingItemConfig2: StagingConfig = stagingItem2
        ? {
            label: stagingItem2.label,
            iconSvg: stagingItem2.iconSvg,
            hideIcon: stagingItem2.hideIcon,
            variant: stagingItem2.variant,
            hidden: stagingItem2.hidden,
            corners: stagingItem2.corners,
          }
        : {}
      setPrototypeStagingConfig(stagingItemConfig2)
      setPrototypeRightNavButtons(
        ensureStagingRightNavButton(rightNavRaw2, stagingItemConfig2),
      )
    }
  }, [open, isCreate, initialData])

  const onChange = (k: keyof ModelTemplate, v: any) =>
    setForm((s) => ({ ...s, [k]: v }))

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        description: form.description,
        image: form.image,
        visibility: form.visibility || 'public',
        config: {
          ...(form.config || {}),
          model_tabs: [...modelTabs],
          prototype_tabs: [...prototypeTabs],
          prototype_tabs_variant:
            prototypeTabsVariant !== 'tab' ? prototypeTabsVariant : null,
          prototype_tabs_border_radius:
            prototypeTabsBorderRadius !== 'round'
              ? prototypeTabsBorderRadius
              : null,
          prototype_sidebar_plugin: localSidebarPlugin,
          prototype_right_nav_buttons: prototypeRightNavButtons,
        },
      }
      if (isCreate) return createModelTemplate(payload)
      if (!templateId) throw new Error('Missing id')
      return updateModelTemplate(templateId, payload)
    },
    onSuccess: () => {
      toast.success('Template saved')
      qc.invalidateQueries({ queryKey: ['model-templates'] })
      onClose()
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message || e.message || 'Save failed'),
  })

  // Helper function to get icon for builtin tabs
  const getBuiltinIcon = (key?: string) => {
    switch (key) {
      case 'overview':
        return <TbRoute className="w-4 h-4" />
      case 'journey':
        return <TbMapPin className="w-4 h-4" />
      case 'code':
        return <TbCode className="w-4 h-4" />
      case 'dashboard':
        return <TbGauge className="w-4 h-4" />
      case 'feedback':
        return <TbMessagePlus className="w-4 h-4" />
      case 'flow':
        return <MdOutlineDoubleArrow className="w-4 h-4" />
      default:
        return <TbPuzzle className="w-4 h-4" />
    }
  }

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return
    const items = Array.from(prototypeTabs)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)
    setPrototypeTabs(items)
  }

  const handleStartEdit = (index: number) => {
    setEditingTabIndex(index)
    setEditingTabLabel(prototypeTabs[index].label)
    setEditingTabIconSvg(prototypeTabs[index].iconSvg || '')
  }

  const handleSaveEdit = () => {
    if (editingTabIndex !== null && editingTabLabel.trim()) {
      const updatedTabs = [...prototypeTabs]
      updatedTabs[editingTabIndex] = {
        ...updatedTabs[editingTabIndex],
        label: editingTabLabel.trim(),
        iconSvg: editingTabIconSvg.trim() || undefined,
      }
      setPrototypeTabs(updatedTabs)
      setEditingTabIndex(null)
      setEditingTabLabel('')
      setEditingTabIconSvg('')
    }
  }

  const handleCancelEdit = () => {
    setEditingTabIndex(null)
    setEditingTabLabel('')
    setEditingTabIconSvg('')
  }

  const handleRemoveTab = (index: number) => {
    if (prototypeTabs[index].type === 'custom') {
      setPrototypeTabs(prototypeTabs.filter((_, i) => i !== index))
    }
  }

  const handleToggleHidden = (index: number) => {
    const updatedTabs = [...prototypeTabs]
    updatedTabs[index] = {
      ...updatedTabs[index],
      hidden: !updatedTabs[index].hidden,
    }
    setPrototypeTabs(updatedTabs)
  }

  // Get selected sidebar plugin data
  const { data: pluginsData, isLoading: pluginsLoading } = useQuery({
    queryKey: ['plugins-for-sidebar'],
    queryFn: () => listPlugins({ page: 1, limit: 100 }),
    enabled:
      activePrototypeTab === 'sidebar' || activePrototypeTab === 'actions',
  })

  const selectedSidebarPluginData = pluginsData?.results?.find(
    (p) => p.slug === localSidebarPlugin,
  )

  const filteredSidebarPlugins =
    pluginsData?.results?.filter(
      (plugin) =>
        plugin.name.toLowerCase().includes(sidebarSearchTerm.toLowerCase()) ||
        plugin.slug?.toLowerCase().includes(sidebarSearchTerm.toLowerCase()) ||
        plugin.description
          ?.toLowerCase()
          .includes(sidebarSearchTerm.toLowerCase()),
    ) ?? []

  return (
    <div className="flex flex-col w-full h-full overflow-auto">
      <div className="flex border-b border-input">
        <DaTabItem
          small
          active={activeTab === 'meta'}
          onClick={() => setActiveTab('meta')}
        >
          Meta
        </DaTabItem>
        <DaTabItem
          small
          active={activeTab === 'model'}
          onClick={() => setActiveTab('model')}
        >
          Model Config
        </DaTabItem>
        <DaTabItem
          small
          active={activeTab === 'prototype'}
          onClick={() => setActiveTab('prototype')}
        >
          Prototype Config
        </DaTabItem>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-6">
        {isFetching && !isCreate ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          <>
            {activeTab === 'meta' && (
              <div className="flex gap-6">
                <div className="flex-1 space-y-3">
                  <div className="flex flex-col gap-1.5">
                    <Label>Name *</Label>
                    <Input
                      required
                      value={form.name || ''}
                      onChange={(e) => onChange('name', e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Description</Label>
                    <Textarea
                      rows={3}
                      value={form.description || ''}
                      onChange={(e) => onChange('description', e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Visibility</Label>
                    <DaSelect
                      value={
                        form.visibility === 'default'
                          ? 'public'
                          : form.visibility || 'public'
                      }
                      onValueChange={(v) =>
                        onChange(
                          'visibility',
                          form.visibility === 'default' ? 'default' : v,
                        )
                      }
                      disabled={form.visibility === 'default'}
                      className="h-9 text-sm"
                    >
                      <DaSelectItem value="public">public</DaSelectItem>
                      <DaSelectItem value="private">private</DaSelectItem>
                    </DaSelect>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="checkbox"
                      id="is-default-template"
                      checked={form.visibility === 'default'}
                      onChange={(e) =>
                        onChange(
                          'visibility',
                          e.target.checked ? 'default' : 'public',
                        )
                      }
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label
                      htmlFor="is-default-template"
                      className="cursor-pointer text-sm"
                    >
                      Set as default template
                    </Label>
                    <span className="text-xs text-muted-foreground">
                      (auto-selected when creating new models)
                    </span>
                  </div>
                </div>
                <div className="w-44 shrink-0">
                  <div className="relative aspect-square w-full border border-input rounded-md overflow-hidden bg-white">
                    <img
                      src={form.image || '/imgs/plugin.png'}
                      alt="Template Image"
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                    <DaImportFile
                      onFileChange={async (file) => {
                        try {
                          const { url } = await uploadFileService(file)
                          onChange('image', url)
                          toast.success('Image uploaded')
                        } catch {
                          toast.error('Image upload failed')
                        }
                      }}
                      accept="image/*"
                      className="absolute top-1 right-1"
                    >
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="rounded-full bg-white shadow-sm"
                      >
                        <TbPhotoEdit className="w-4 h-4" />
                      </Button>
                    </DaImportFile>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'model' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-foreground">
                    Model Tabs
                  </span>
                  <Button
                    size="sm"
                    onClick={() =>
                      setModelTabs((t) => [...t, { label: '', plugin: '' }])
                    }
                  >
                    Add Item
                  </Button>
                </div>
                {modelTabs.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No items. Click Add Item.
                  </p>
                )}
                {modelTabs.map((it, idx) => (
                  <div key={idx} className="flex flex-wrap gap-3 items-center">
                    <div className="flex-1 min-w-[180px]">
                      <Input
                        placeholder="Label"
                        value={it.label}
                        onChange={(e) => {
                          const v = e.target.value
                          setModelTabs((arr) =>
                            arr.map((x, i) =>
                              i === idx ? { ...x, label: v } : x,
                            ),
                          )
                        }}
                      />
                    </div>
                    <div className="col-span-6">
                      <DaSelect
                        value={it.plugin || '__none__'}
                        onValueChange={(v) => {
                          setModelTabs((arr) =>
                            arr.map((x, i) =>
                              i === idx
                                ? { ...x, plugin: v === '__none__' ? '' : v }
                                : x,
                            ),
                          )
                        }}
                        className="h-9 text-sm"
                      >
                        <DaSelectItem value="__none__">
                          Select plugin
                        </DaSelectItem>
                        {pluginData?.results?.map((p: Plugin) => (
                          <DaSelectItem key={p.id} value={p.id}>
                            {p.name}
                          </DaSelectItem>
                        ))}
                      </DaSelect>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          setModelTabs((arr) => arr.filter((_, i) => i !== idx))
                        }
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'prototype' && (
              <div className="flex flex-col gap-4">
                {/* Sub-tab navigation */}
                <div className="flex border-b border-border gap-1">
                  <button
                    onClick={() => setActivePrototypeTab('tabs')}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                      activePrototypeTab === 'tabs'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <TbPuzzle className="w-4 h-4" />
                    Tab Bar
                  </button>
                  <button
                    onClick={() => setActivePrototypeTab('style')}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                      activePrototypeTab === 'style'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <TbEye className="w-4 h-4" />
                    Appearance
                  </button>
                  <button
                    onClick={() => setActivePrototypeTab('sidebar')}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                      activePrototypeTab === 'sidebar'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <TbLayoutSidebar className="w-4 h-4" />
                    Sidebar Panel
                  </button>
                  <button
                    onClick={() => setActivePrototypeTab('actions')}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                      activePrototypeTab === 'actions'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <TbListCheck className="w-4 h-4" />
                    Action Buttons
                  </button>
                </div>

                {/* Tab Bar Sub-tab */}
                {activePrototypeTab === 'tabs' && (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Configure which tabs appear in the prototype tab bar,
                      their order, labels, and visibility.
                    </p>
                    {prototypeTabs.length > 0 ? (
                      <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="prototype-tabs">
                          {(provided, snapshot) => (
                            <div
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                              className="flex flex-col gap-2"
                            >
                              {prototypeTabs.map((tab, index) => {
                                const draggableId =
                                  tab.type === 'builtin'
                                    ? `builtin-${tab.key}`
                                    : `custom-${tab.plugin}`
                                return (
                                  <Draggable
                                    key={draggableId}
                                    draggableId={draggableId}
                                    index={index}
                                  >
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        className={`flex items-center gap-3 p-4 border border-border rounded bg-background ${
                                          snapshot.isDragging
                                            ? 'opacity-40'
                                            : ''
                                        } ${tab.hidden ? 'opacity-60' : ''}`}
                                      >
                                        {/* Drag Handle */}
                                        <div
                                          {...provided.dragHandleProps}
                                          className="flex items-center justify-center text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
                                        >
                                          <TbGripVertical className="w-5 h-5" />
                                        </div>

                                        {/* Icon */}
                                        {tab.iconSvg ? (
                                          <span
                                            className="inline-flex size-5 [&>svg]:w-full [&>svg]:h-full"
                                            dangerouslySetInnerHTML={{
                                              __html: DOMPurify.sanitize(
                                                tab.iconSvg,
                                                {
                                                  USE_PROFILES: {
                                                    svg: true,
                                                    svgFilters: true,
                                                  },
                                                },
                                              ),
                                            }}
                                          />
                                        ) : (
                                          tab.type === 'builtin' && (
                                            <div className="text-muted-foreground">
                                              {getBuiltinIcon(tab.key)}
                                            </div>
                                          )
                                        )}

                                        {/* Content */}
                                        <div className="flex-1 flex flex-col gap-1 min-w-0">
                                          {editingTabIndex === index ? (
                                            <div className="flex flex-col gap-2">
                                              <Label
                                                htmlFor={`edit-label-${index}`}
                                                className="text-xs"
                                              >
                                                Tab Label
                                              </Label>
                                              <Input
                                                id={`edit-label-${index}`}
                                                value={editingTabLabel}
                                                onChange={(e) =>
                                                  setEditingTabLabel(
                                                    e.target.value,
                                                  )
                                                }
                                                onKeyDown={(e) => {
                                                  if (e.key === 'Enter')
                                                    handleSaveEdit()
                                                  if (e.key === 'Escape')
                                                    handleCancelEdit()
                                                }}
                                                className="text-sm"
                                                autoFocus
                                              />
                                              <Label
                                                htmlFor={`edit-svg-${index}`}
                                                className="text-xs mt-1"
                                              >
                                                Custom Icon (SVG)
                                              </Label>
                                              <textarea
                                                id={`edit-svg-${index}`}
                                                value={editingTabIconSvg}
                                                onChange={(e) =>
                                                  setEditingTabIconSvg(
                                                    e.target.value,
                                                  )
                                                }
                                                placeholder='<svg xmlns="...">...</svg>'
                                                className="text-xs font-mono flex-1 min-h-15 resize-y rounded border border-input bg-background px-2 py-1.5 outline-none focus:ring-1 focus:ring-ring"
                                                spellCheck={false}
                                              />
                                            </div>
                                          ) : (
                                            <>
                                              <div className="flex items-center gap-2">
                                                <p className="text-sm font-medium text-foreground truncate">
                                                  {tab.label}
                                                </p>
                                                {tab.type === 'builtin' && (
                                                  <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded">
                                                    Built-in
                                                  </span>
                                                )}
                                              </div>
                                              <p className="text-xs text-muted-foreground font-mono truncate">
                                                {tab.type === 'builtin'
                                                  ? `builtin: ${tab.key}`
                                                  : `plugin: ${tab.plugin}`}
                                              </p>
                                            </>
                                          )}
                                        </div>

                                        {/* Visibility Toggle */}
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() =>
                                            handleToggleHidden(index)
                                          }
                                          className="h-8 w-8"
                                          title={
                                            tab.hidden ? 'Show tab' : 'Hide tab'
                                          }
                                        >
                                          {tab.hidden ? (
                                            <TbEyeOff className="w-4 h-4 text-muted-foreground" />
                                          ) : (
                                            <TbEye className="w-4 h-4" />
                                          )}
                                        </Button>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2">
                                          {editingTabIndex === index ? (
                                            <>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={handleSaveEdit}
                                                className="h-8 w-8"
                                              >
                                                <TbCheck className="w-4 h-4 text-green-600" />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={handleCancelEdit}
                                                className="h-8 w-8"
                                              >
                                                <TbX className="w-4 h-4 text-muted-foreground" />
                                              </Button>
                                            </>
                                          ) : (
                                            <>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                  handleStartEdit(index)
                                                }
                                                className="h-8 w-8"
                                              >
                                                <TbPencil className="w-4 h-4" />
                                              </Button>
                                              {tab.type === 'custom' && (
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  onClick={() =>
                                                    handleRemoveTab(index)
                                                  }
                                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                                >
                                                  <TbTrash className="w-4 h-4" />
                                                </Button>
                                              )}
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </Draggable>
                                )
                              })}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </DragDropContext>
                    ) : (
                      <div className="flex items-center justify-center p-8 border border-dashed border-border rounded">
                        <p className="text-sm text-muted-foreground">
                          No tabs configured
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* Appearance Sub-tab */}
                {activePrototypeTab === 'style' && (
                  <div className="flex flex-col gap-5">
                    <p className="text-sm text-muted-foreground">
                      Choose the visual style for all tab bar buttons.
                    </p>
                    <div className="gap-3 grid grid-cols-[auto_1fr]">
                      <Label className="text-xs w-20 shrink-0 text-foreground mt-1">
                        Style
                      </Label>
                      <div className="flex flex-col gap-3 flex-1">
                        <div className="flex flex-wrap gap-2">
                          {(
                            ['tab', 'primary', 'outline', 'ghost'] as const
                          ).map((v) => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => setPrototypeTabsVariant(v)}
                              className={`px-3 py-1 text-xs rounded border capitalize transition-colors ${
                                prototypeTabsVariant === v
                                  ? 'bg-primary text-primary-foreground border-primary'
                                  : 'bg-background text-foreground border-border hover:bg-accent'
                              }`}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>

                      <Label className="text-xs w-20 shrink-0 text-foreground mt-1">
                        Corners
                      </Label>
                      <div className="flex flex-col gap-3 flex-1">
                        <div className="flex flex-wrap gap-2">
                          {(
                            [
                              { value: 'none', label: 'Square' },
                              { value: 'round', label: 'Round' },
                              { value: 'full', label: 'Pill' },
                            ] as const
                          ).map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() =>
                                setPrototypeTabsBorderRadius(opt.value)
                              }
                              className={`px-3 py-1 text-xs rounded border transition-colors ${
                                prototypeTabsBorderRadius === opt.value
                                  ? 'bg-primary text-primary-foreground border-primary'
                                  : 'bg-background text-foreground border-border hover:bg-accent'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sidebar Panel Sub-tab */}
                {activePrototypeTab === 'sidebar' && (
                  <div className="flex flex-col gap-3">
                    <p className="text-sm text-muted-foreground">
                      Select a plugin to display in a collapsible panel on the
                      left side of the prototype view.
                    </p>

                    {localSidebarPlugin && !showSidebarPluginPicker ? (
                      <div className="flex items-center gap-3 p-3 border border-border rounded bg-accent/50">
                        <TbPuzzle className="w-5 h-5 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {selectedSidebarPluginData?.name ||
                              localSidebarPlugin}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono truncate">
                            plugin: {localSidebarPlugin}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowSidebarPluginPicker(true)}
                          className="h-8 w-8"
                          title="Change plugin"
                        >
                          <TbPencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setLocalSidebarPlugin(null)
                            setShowSidebarPluginPicker(false)
                          }}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          title="Remove sidebar plugin"
                        >
                          <TbTrash className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : showSidebarPluginPicker ? (
                      <div className="flex flex-col gap-2 border border-border rounded p-3">
                        <div className="relative">
                          <TbSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            type="text"
                            placeholder="Search plugins..."
                            value={sidebarSearchTerm}
                            onChange={(e) =>
                              setSidebarSearchTerm(e.target.value)
                            }
                            className="pl-10 text-sm"
                            autoFocus
                          />
                        </div>
                        <div className="flex flex-col max-h-48 overflow-y-auto">
                          {pluginsLoading ? (
                            <div className="flex items-center justify-center p-4">
                              <Spinner size={20} />
                            </div>
                          ) : filteredSidebarPlugins.length === 0 ? (
                            <p className="text-xs text-muted-foreground p-4 text-center">
                              {sidebarSearchTerm
                                ? 'No plugins found'
                                : 'No plugins available'}
                            </p>
                          ) : (
                            filteredSidebarPlugins.map((plugin) => (
                              <button
                                key={plugin.id}
                                onClick={() => {
                                  setLocalSidebarPlugin(plugin.slug)
                                  setShowSidebarPluginPicker(false)
                                  setSidebarSearchTerm('')
                                }}
                                className="flex items-center gap-3 p-2 hover:bg-accent rounded transition-colors text-left"
                              >
                                {plugin.image ? (
                                  <img
                                    src={plugin.image}
                                    alt={plugin.name}
                                    className="w-8 h-8 rounded object-cover shrink-0"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0">
                                    <span className="text-xs text-muted-foreground">
                                      {plugin.name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">
                                    {plugin.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground font-mono truncate">
                                    {plugin.slug}
                                  </p>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setShowSidebarPluginPicker(false)
                              setSidebarSearchTerm('')
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-fit"
                        onClick={() => setShowSidebarPluginPicker(true)}
                      >
                        <TbPuzzle className="w-4 h-4 mr-2" />
                        Set Sidebar Plugin
                      </Button>
                    )}
                  </div>
                )}

                {/* Action Buttons Sub-tab */}
                {activePrototypeTab === 'actions' && (
                  <ActionButtonsTab
                    pluginsData={pluginsData}
                    pluginsLoading={pluginsLoading}
                    localRightNavPlugins={prototypeRightNavButtons}
                    setLocalRightNavPlugins={setPrototypeRightNavButtons}
                  />
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={() => save.mutate()}
                disabled={!form.name || save.isPending}
              >
                {save.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
