// Copyright (c) 2025 Eclipse Foundation.
// SPDX-License-Identifier: MIT

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    listDashboardTemplates,
    deleteDashboardTemplate,
    type DashboardTemplate,
} from '@/services/dashboardTemplate.service'
import { Button } from '@/components/atoms/button'
import DashboardTemplateEditor from '@/components/molecules/dashboard/DashboardTemplateEditor'
import { TbPencil, TbTrash, TbLayoutDashboard } from 'react-icons/tb'
import { toast } from 'react-toastify'

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
                            {t.is_default && (
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
                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.is_default
                                    ? 'bg-primary/10 text-primary'
                                    : t.visibility === 'public'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-gray-100 text-gray-600'
                                    }`}
                            >
                                {t.is_default ? 'default' : t.visibility}
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

            <DashboardTemplateEditor
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
