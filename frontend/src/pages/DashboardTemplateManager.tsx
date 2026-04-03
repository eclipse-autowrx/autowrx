// Copyright (c) 2025 Eclipse Foundation.
// SPDX-License-Identifier: MIT

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    listDashboardTemplates,
    createDashboardTemplate,
    updateDashboardTemplate,
    deleteDashboardTemplate,
    getDashboardTemplateById,
    type DashboardTemplate,
} from '@/services/dashboardTemplate.service'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { Textarea } from '@/components/atoms/textarea'
import { Label } from '@/components/atoms/label'
import DaDialog from '@/components/molecules/DaDialog'
import DaDashboardEditor from '@/components/molecules/dashboard/DaDashboardEditor'
import { TbPencil, TbTrash, TbLayoutDashboard } from 'react-icons/tb'
import { toast } from 'react-toastify'

const DEFAULT_WIDGET_CONFIG = JSON.stringify({ autorun: false, widgets: [] }, null, 2)

interface FormState {
    name: string
    description: string
    visibility: 'public' | 'private' | 'default'
}

const emptyForm: FormState = {
    name: '',
    description: '',
    visibility: 'public',
}

function DashboardTemplateForm({
    open,
    onOpenChange,
    editId,
    onSuccess,
}: {
    open: boolean
    onOpenChange: (v: boolean) => void
    editId?: string
    onSuccess: () => void
}) {
    const qc = useQueryClient()
    const isEdit = !!editId
    const [form, setForm] = useState<FormState>(emptyForm)
    const [widgetConfig, setWidgetConfig] = useState<string>(DEFAULT_WIDGET_CONFIG)

    const { data: editData } = useQuery({
        queryKey: ['dashboard-template-edit', editId],
        queryFn: () => getDashboardTemplateById(editId!),
        enabled: isEdit && open,
    })

    useEffect(() => {
        if (editData) {
            setForm({
                name: editData.name || '',
                description: editData.description || '',
                visibility: (editData.visibility as FormState['visibility']) || 'public',
            })
            setWidgetConfig(
                editData.widget_config
                    ? JSON.stringify(editData.widget_config, null, 2)
                    : DEFAULT_WIDGET_CONFIG,
            )
        } else if (!open) {
            setForm(emptyForm)
            setWidgetConfig(DEFAULT_WIDGET_CONFIG)
        }
    }, [editData, open])

    const save = useMutation({
        mutationFn: async () => {
            let parsedConfig: any
            try {
                parsedConfig = JSON.parse(widgetConfig)
            } catch {
                parsedConfig = { autorun: false, widgets: [] }
            }
            const payload = {
                name: form.name,
                description: form.description,
                visibility: form.visibility,
                widget_config: parsedConfig,
            }
            if (isEdit) return updateDashboardTemplate(editId!, payload)
            return createDashboardTemplate(payload)
        },
        onSuccess: () => {
            toast.success(isEdit ? 'Template updated' : 'Template created')
            qc.invalidateQueries({ queryKey: ['dashboard-templates'] })
            onOpenChange(false)
            onSuccess()
        },
        onError: (e: any) =>
            toast.error(e?.response?.data?.message || e.message || 'Save failed'),
    })

    return (
        <DaDialog
            open={open}
            onOpenChange={(v) => {
                if (!v) {
                    setForm(emptyForm)
                    setWidgetConfig(DEFAULT_WIDGET_CONFIG)
                }
                onOpenChange(v)
            }}
            className="w-[90vw] max-w-[1200px] h-[90vh]"
        >
            <div className="flex flex-col h-full p-6 gap-4">
                <h2 className="text-lg font-semibold shrink-0">
                    {isEdit ? 'Edit Dashboard Template' : 'New Dashboard Template'}
                </h2>

                <div className="flex gap-4 shrink-0">
                    <div className="flex-1 space-y-2">
                        <Label>Name *</Label>
                        <Input
                            value={form.name}
                            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                            placeholder="Template name"
                        />
                    </div>
                    <div className="flex-1 space-y-2">
                        <Label>Description</Label>
                        <Textarea
                            value={form.description}
                            onChange={(e) =>
                                setForm((f) => ({ ...f, description: e.target.value }))
                            }
                            placeholder="Short description"
                            rows={1}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <input
                        type="checkbox"
                        id="is-default-dashboard-template"
                        checked={form.visibility === 'default'}
                        onChange={(e) =>
                            setForm((f) => ({ ...f, visibility: e.target.checked ? 'default' : 'public' }))
                        }
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="is-default-dashboard-template" className="cursor-pointer text-sm">
                        Set as default template
                    </Label>
                    <span className="text-xs text-muted-foreground">
                        (auto-applied when opening a new prototype)
                    </span>
                </div>

                <div className="flex flex-col flex-1 min-h-0 space-y-2">
                    <Label className="shrink-0">Widget Layout</Label>
                    <div className="flex-1 min-h-0">
                        <DaDashboardEditor
                            entireWidgetConfig={widgetConfig}
                            editable={true}
                            onDashboardConfigChanged={setWidgetConfig}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2 shrink-0">
                    <Button
                        variant="outline"
                        onClick={() => {
                            setForm(emptyForm)
                            setWidgetConfig(DEFAULT_WIDGET_CONFIG)
                            onOpenChange(false)
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => save.mutate()}
                        disabled={!form.name.trim() || save.isPending}
                    >
                        {save.isPending ? 'Saving…' : isEdit ? 'Update' : 'Create'}
                    </Button>
                </div>
            </div>
        </DaDialog>
    )
}

export default function DashboardTemplateManager() {
    const qc = useQueryClient()
    const [openForm, setOpenForm] = useState(false)
    const [editId, setEditId] = useState<string | undefined>(undefined)

    const { data } = useQuery({
        queryKey: ['dashboard-templates'],
        queryFn: () => listDashboardTemplates({ limit: 100, page: 1 }),
    })

    const del = useMutation({
        mutationFn: (id: string) => deleteDashboardTemplate(id),
        onSuccess: () => {
            toast.success('Deleted')
            qc.invalidateQueries({ queryKey: ['dashboard-templates'] })
        },
        onError: (e: any) =>
            toast.error(e?.response?.data?.message || e.message || 'Delete failed'),
    })

    return (
        <div className="p-6">
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-xl font-semibold">Dashboard Templates</h1>
                <Button
                    onClick={() => {
                        setEditId(undefined)
                        setOpenForm(true)
                    }}
                >
                    New Template
                </Button>
            </div>

            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {data?.results?.map((t: DashboardTemplate) => (
                    <div
                        key={t.id}
                        className="rounded-md border border-input bg-background p-3 shadow-sm flex flex-col cursor-pointer hover:shadow-md transition"
                        onClick={() => {
                            setEditId(t.id)
                            setOpenForm(true)
                        }}
                    >
                        <div className="relative aspect-video w-full rounded overflow-hidden bg-muted flex items-center justify-center">
                            {t.image ? (
                                <img
                                    src={t.image}
                                    alt={t.name}
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                            ) : (
                                <TbLayoutDashboard className="size-10 text-muted-foreground" />
                            )}
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                            <h3 className="text-base font-semibold text-foreground truncate">
                                {t.name}
                            </h3>
                            {t.visibility === 'default' && (
                                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide bg-primary text-primary-foreground rounded px-1.5 py-0.5">
                                    Default
                                </span>
                            )}
                        </div>
                        {t.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {t.description}
                            </p>
                        )}
                        <div className="mt-2 flex items-center justify-between">
                            <span
                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.visibility === 'default'
                                    ? 'bg-primary/10 text-primary'
                                    : t.visibility === 'public'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-gray-100 text-gray-600'
                                    }`}
                            >
                                {t.visibility}
                            </span>
                            <div className="flex gap-1">
                                <Button
                                    title="Edit"
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setEditId(t.id)
                                        setOpenForm(true)
                                    }}
                                >
                                    <TbPencil className="text-base" />
                                </Button>
                                <Button
                                    title="Delete"
                                    variant="ghost"
                                    size="icon"
                                    onClick={async (e) => {
                                        e.stopPropagation()
                                        if (!confirm('Delete this dashboard template?')) return
                                        del.mutate(t.id)
                                    }}
                                >
                                    <TbTrash className="text-base" />
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
                {!data?.results?.length && (
                    <div className="col-span-full text-center py-12">
                        <TbLayoutDashboard className="size-12 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                            No dashboard templates yet
                        </p>
                    </div>
                )}
            </div>

            <DashboardTemplateForm
                open={openForm}
                onOpenChange={(v) => {
                    setOpenForm(v)
                    if (!v) setEditId(undefined)
                }}
                editId={editId}
                onSuccess={() => { }}
            />
        </div>
    )
}
