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
import { TbPencil, TbTrash, TbLayoutDashboard } from 'react-icons/tb'
import { toast } from 'react-toastify'

interface FormState {
    name: string
    description: string
}

const emptyForm: FormState = {
    name: '',
    description: '',
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
            })
        } else if (!open) {
            setForm(emptyForm)
        }
    }, [editData, open])

    const save = useMutation({
        mutationFn: async () => {
            const payload = {
                name: form.name,
                description: form.description,
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
                if (!v) setForm(emptyForm)
                onOpenChange(v)
            }}
            className="w-[680px] max-w-[calc(100vw-80px)]"
        >
            <div className="p-6 space-y-4">
                <h2 className="text-lg font-semibold">
                    {isEdit ? 'Edit Dashboard Template' : 'New Dashboard Template'}
                </h2>

                <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="Template name"
                    />
                </div>

                <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                        value={form.description}
                        onChange={(e) =>
                            setForm((f) => ({ ...f, description: e.target.value }))
                        }
                        placeholder="Short description"
                        rows={2}
                    />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <Button
                        variant="outline"
                        onClick={() => {
                            setForm(emptyForm)
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
                        <h3 className="text-base font-semibold text-foreground mt-3 truncate">
                            {t.name}
                        </h3>
                        {t.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {t.description}
                            </p>
                        )}
                        <div className="mt-2 flex items-center justify-between">
                            <span
                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.visibility === 'public'
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
