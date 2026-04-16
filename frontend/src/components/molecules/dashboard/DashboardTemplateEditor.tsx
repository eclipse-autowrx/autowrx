// Copyright (c) 2025 Eclipse Foundation.
// SPDX-License-Identifier: MIT

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    getDashboardTemplateById,
    createDashboardTemplate,
    updateDashboardTemplate,
} from '@/services/dashboardTemplate.service'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { Textarea } from '@/components/atoms/textarea'
import { Label } from '@/components/atoms/label'
import DaDialog from '@/components/molecules/DaDialog'
import DaDashboardEditor from '@/components/molecules/dashboard/DaDashboardEditor'
import { toast } from 'react-toastify'

const DEFAULT_WIDGET_CONFIG = JSON.stringify({ autorun: false, widgets: [] }, null, 2)

interface FormState {
    name: string
    description: string
    visibility: 'public' | 'private'
    is_default: boolean
}

const emptyForm: FormState = {
    name: '',
    description: '',
    visibility: 'public',
    is_default: false,
}

export interface DashboardTemplateEditorProps {
    open: boolean
    onOpenChange: (v: boolean) => void
    editId?: string
    onSuccess: () => void
}

export default function DashboardTemplateEditor({
    open,
    onOpenChange,
    editId,
    onSuccess,
}: DashboardTemplateEditorProps) {
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
                is_default: editData.is_default || false,
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
                is_default: form.is_default,
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
            className="w-[95vw] sm:w-[90vw] max-w-[1200px] h-[90vh] max-h-[calc(100dvh-2rem)]"
        >
            <div className="flex flex-col h-full p-4 sm:p-6 gap-4 overflow-y-auto">
                <h2 className="text-lg font-semibold shrink-0">
                    {isEdit ? 'Edit Dashboard Template' : 'New Dashboard Template'}
                </h2>

                <div className="flex flex-col sm:flex-row gap-4 shrink-0">
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
                        checked={form.is_default}
                        onChange={(e) =>
                            setForm((f) => ({ ...f, is_default: e.target.checked }))
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
