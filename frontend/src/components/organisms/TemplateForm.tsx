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
import DaTabItem from '@/components/atoms/DaTabItem'
import DaImportFile from '@/components/atoms/DaImportFile'
// No direct JSON editor; we provide structured editors for config
import { uploadFileService } from '@/services/upload.service'
import { TbPhotoEdit, TbListCheck, TbEye, TbEyeOff } from 'react-icons/tb'
import { toast } from 'react-toastify'
import { listPlugins, type Plugin } from '@/services/plugin.service'
import { TabConfig, StagingConfig } from '@/components/organisms/CustomTabEditor'
import { DaSelect, DaSelectItem } from '@/components/atoms/DaSelect'

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

export default function TemplateForm({ templateId, onClose, open, initialData }: Props) {
  const qc = useQueryClient()
  const isCreate = useMemo(() => !templateId, [templateId])
  const [activeTab, setActiveTab] = useState<'meta' | 'model' | 'prototype'>(
    'meta',
  )
  const prevOpenRef = useRef(open)

  // Debug: Log when initialData changes
  // useEffect(() => {
  //   console.log('[TemplateForm] initialData received:', initialData)
  // }, [initialData])

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
  const [prototypeStagingConfig, setPrototypeStagingConfig] = useState<StagingConfig>({})
  const { data: pluginData } = useQuery({
    queryKey: ['plugins-for-template'],
    queryFn: () => listPlugins({ limit: 1000, page: 1 }),
  })

  useEffect(() => {
    if (initial) {
      console.log('[TemplateForm] initial found:', initial)
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
      setPrototypeStagingConfig(cfg.prototype_staging_config || (cfg.prototype_staging_label ? { label: cfg.prototype_staging_label } : {}))
    } else {
      console.log('[TemplateForm] initial not found')
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
    }
  }, [initial])

  // Reset when opening create mode (only when dialog transitions from closed to open)
  useEffect(() => {
    const wasOpen = prevOpenRef.current
    prevOpenRef.current = open

    if (open && !wasOpen && isCreate) {
      console.log('[TemplateForm] Dialog opened in create mode. initialData:', initialData)
      setActiveTab('meta')
      // If no initialData, reset to empty form
      if (!initialData) {
        console.log('[TemplateForm] initialData not found, resetting form')
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
      }
    }
  }, [open, isCreate, initialData])

  // Handle initialData when dialog is open and in create mode
  useEffect(() => {
    if (open && isCreate && initialData) {
      console.log('[TemplateForm] Processing initialData:', initialData)
      // Get the full config from initialData.config (custom_template)
      console.log('[TemplateForm] initialData.config:', initialData.config)
      console.log('[TemplateForm] initialData.config.model_tabs:', initialData.config?.model_tabs)
      console.log('[TemplateForm] initialData.config.prototype_tabs:', initialData.config?.prototype_tabs)
      const fullConfig = initialData.config || {}
      console.log('[TemplateForm] fullConfig:', fullConfig)

      // Extract tabs directly from config (custom_template) - this is the source of truth
      const modelTabsFromConfig = Array.isArray(fullConfig.model_tabs)
        ? fullConfig.model_tabs
        : []
      const prototypeTabsFromConfig = Array.isArray(fullConfig.prototype_tabs)
        ? fullConfig.prototype_tabs
        : []

      console.log('[TemplateForm] Extracted tabs:', {
        modelTabsFromConfig,
        prototypeTabsFromConfig,
      })

      // Pre-populate with initial data, preserving entire config structure
      setForm({
        name: initialData.name || '',
        description: initialData.description || '',
        image: initialData.image || '',
        visibility: (initialData.visibility as 'public' | 'private' | 'default') || 'public',
        config: fullConfig, // Preserve entire custom_template structure
      })
      setModelTabs(
        modelTabsFromConfig.map((x: any) => ({
          label: x.label || '',
          plugin: x.plugin || '',
        }))
      )
      // Preserve full TabConfig structure (type, key, hidden) without adding default builtin tabs
      setPrototypeTabs(normalizeTabsForTemplate(prototypeTabsFromConfig))
      setPrototypeStagingConfig(fullConfig.prototype_staging_config || (fullConfig.prototype_staging_label ? { label: fullConfig.prototype_staging_label } : {}))
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
          prototype_staging_config: Object.keys(prototypeStagingConfig).length ? prototypeStagingConfig : null,
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

  return (
    <div className="flex flex-col w-full">
      <h2 className="text-xl font-semibold text-foreground mb-4">
        {isCreate ? 'Create Template' : 'Edit Template'}
      </h2>
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

      <div className="p-6 overflow-y-auto">
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
                      value={form.visibility || 'public'}
                      onValueChange={(v) => onChange('visibility', v)}
                      className="h-9 text-sm"
                    >
                      <DaSelectItem value="public">public</DaSelectItem>
                      <DaSelectItem value="private">private</DaSelectItem>
                      <DaSelectItem value="default">default</DaSelectItem>
                    </DaSelect>
                  </div>
                </div>
                <div className="w-44 flex-shrink-0">
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
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 items-center"
                  >
                    <div className="col-span-5">
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
                              i === idx ? { ...x, plugin: v === '__none__' ? '' : v } : x,
                            ),
                          )
                        }}
                        className="h-9 text-sm"
                      >
                        <DaSelectItem value="__none__">Select plugin</DaSelectItem>
                        {pluginData?.results?.map((p: Plugin) => (
                          <DaSelectItem key={p.id} value={p.id}>
                            {p.name}
                          </DaSelectItem>
                        ))}
                      </DaSelect>
                    </div>
                    <div className="col-span-1 flex justify-end">
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
              <div className="space-y-3">
                <div className="flex flex-col gap-3 pb-3 border-b border-border">
                  <span className="text-sm font-semibold text-foreground">Staging Tab</span>

                  {/* Visibility */}
                  <div className="flex items-center gap-3">
                    <Label className="text-xs w-20 shrink-0">Show Icon</Label>
                    <button
                      type="button"
                      onClick={() => setPrototypeStagingConfig(c => ({ ...c, hideIcon: !c.hideIcon }))}
                      className="flex items-center gap-2 text-sm hover:opacity-70 transition-opacity"
                    >
                      {prototypeStagingConfig.hideIcon
                        ? <><TbEyeOff className="w-4 h-4 text-muted-foreground" /><span className="text-muted-foreground">Hidden</span></>
                        : <><TbEye className="w-4 h-4" /><span>Visible</span></>}
                    </button>
                  </div>

                  {/* Label */}
                  <div className="flex items-center gap-3">
                    <Label className="text-xs w-20 shrink-0">Label</Label>
                    <Input
                      placeholder="Staging"
                      value={prototypeStagingConfig.label || ''}
                      onChange={(e) => setPrototypeStagingConfig(c => ({ ...c, label: e.target.value }))}
                      className="max-w-xs text-sm"
                    />
                  </div>

                  {/* Icon URL */}
                  <div className="flex items-center gap-3">
                    <Label className="text-xs w-20 shrink-0">Icon URL</Label>
                    <Input
                      placeholder="https://example.com/icon.png"
                      value={prototypeStagingConfig.iconUrl || ''}
                      onChange={(e) => setPrototypeStagingConfig(c => ({ ...c, iconUrl: e.target.value }))}
                      className="max-w-xs text-sm"
                    />
                    {prototypeStagingConfig.iconUrl
                      ? <img src={prototypeStagingConfig.iconUrl} alt="icon" className="w-6 h-6 object-contain rounded border border-border shrink-0" />
                      : <TbListCheck className="w-6 h-6 text-muted-foreground shrink-0" />}
                  </div>

                  {/* Style / Variant */}
                  <div className="flex items-start gap-3">
                    <Label className="text-xs w-20 shrink-0 mt-1">Style</Label>
                    <div className="flex flex-wrap gap-2">
                      {(['tab', 'primary', 'outline', 'secondary', 'ghost'] as const).map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setPrototypeStagingConfig(c => ({ ...c, variant: v }))}
                          className={`px-3 py-1 text-xs rounded border capitalize transition-colors ${(prototypeStagingConfig.variant || 'tab') === v
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background text-foreground border-border hover:bg-accent'
                            }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-foreground">
                    Prototype Tabs
                  </span>
                  <Button
                    size="sm"
                    onClick={() =>
                      setPrototypeTabs((t) => [...t, { type: 'custom', label: '', plugin: '' }])
                    }
                  >
                    Add Item
                  </Button>
                </div>
                {prototypeTabs.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No items. Click Add Item.
                  </p>
                )}
                {prototypeTabs.map((it, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 items-center"
                  >
                    <div className="col-span-5 flex items-center gap-1.5">
                      {it.type === 'builtin' && (
                        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide bg-muted text-muted-foreground rounded px-1.5 py-0.5">
                          built-in
                        </span>
                      )}
                      <Input
                        placeholder="Label"
                        value={it.label}
                        onChange={(e) => {
                          const v = e.target.value
                          setPrototypeTabs((arr) =>
                            arr.map((x, i) =>
                              i === idx ? { ...x, label: v } : x,
                            ),
                          )
                        }}
                      />
                    </div>
                    {it.type === 'builtin' ? (
                      <div className="col-span-6 text-sm text-muted-foreground px-2">
                        Built-in tab ({it.key}){it.hidden ? ' — hidden' : ''}
                      </div>
                    ) : (
                      <div className="col-span-6">
                        <DaSelect
                          value={it.plugin || '__none__'}
                          onValueChange={(v) => {
                            setPrototypeTabs((arr) =>
                              arr.map((x, i) =>
                                i === idx ? { ...x, plugin: v === '__none__' ? '' : v } : x,
                              ),
                            )
                          }}
                          className="h-9 text-sm"
                        >
                          <DaSelectItem value="__none__">Select plugin</DaSelectItem>
                          {pluginData?.results?.map((p: Plugin) => (
                            <DaSelectItem key={p.id} value={p.slug || p.id}>
                              {p.name}
                            </DaSelectItem>
                          ))}
                        </DaSelect>
                      </div>
                    )}
                    <div className="col-span-1 flex justify-end">
                      {it.type !== 'builtin' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            setPrototypeTabs((arr) =>
                              arr.filter((_, i) => i !== idx),
                            )
                          }
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
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
