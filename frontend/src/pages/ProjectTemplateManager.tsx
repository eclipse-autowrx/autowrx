// Copyright (c) 2025 Eclipse Foundation.
// SPDX-License-Identifier: MIT

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listProjectTemplates,
  deleteProjectTemplate,
  type ProjectTemplate,
} from '@/services/projectTemplate.service'
import { Button } from '@/components/atoms/button'
import { Spinner } from '@/components/atoms/spinner'
import ProjectTemplateEditor from '@/components/molecules/project/ProjectTemplateEditor'
import DaConfirmPopup from '@/components/molecules/DaConfirmPopup'
import { TbPencil, TbTrash, TbFileCode, TbBrandPython } from 'react-icons/tb'
import { toast } from 'react-toastify'
import {
  getProjectTemplateLanguage,
  invalidateProjectTemplateQueries,
  PROJECT_TEMPLATE_QUERY_KEYS,
} from '@/utils/projectTemplate'

function LanguageIcon({ language }: { language: string }) {
  if (language === 'python') {
    return <TbBrandPython className="size-10 text-muted-foreground" />
  }
  return (
    <div className="flex flex-col items-center gap-1 text-muted-foreground">
      <TbFileCode className="size-8" />
      <span className="text-xs font-medium uppercase">Rust</span>
    </div>
  )
}

export default function ProjectTemplateManager() {
  const qc = useQueryClient()
  const [editId, setEditId] = useState<string | undefined>(undefined)
  const [openForm, setOpenForm] = useState(false)
  const [deleteId, setDeleteId] = useState<string | undefined>(undefined)
  const [openConfirm, setOpenConfirm] = useState(false)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [...PROJECT_TEMPLATE_QUERY_KEYS.adminList],
    queryFn: () => listProjectTemplates({ limit: 100, page: 1 }),
  })

  useEffect(() => {
    if (!isError) return
    const err = error as { response?: { data?: { message?: string } }; message?: string }
    toast.error(
      err?.response?.data?.message || err?.message || 'Failed to load templates',
    )
  }, [isError, error])

  const del = useMutation({
    mutationFn: (id: string) => deleteProjectTemplate(id),
    onSuccess: () => {
      toast.success('Deleted')
      invalidateProjectTemplateQueries(qc)
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message || e.message || 'Delete failed'),
  })

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Project Templates</h1>
        <Button
          onClick={() => {
            setEditId(undefined)
            setOpenForm(true)
          }}
        >
          New Template
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size={32} />
        </div>
      ) : isError ? (
        <div className="text-center py-12 text-destructive">
          Failed to load templates
        </div>
      ) : (
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {data?.results?.map((t: ProjectTemplate) => {
          const language = getProjectTemplateLanguage(t)
          return (
            <div
              key={t.id}
              className="rounded-md border border-input bg-background p-3 shadow-sm flex flex-col cursor-pointer hover:shadow-md transition"
              onClick={() => {
                setEditId(t.id)
                setOpenForm(true)
              }}
            >
              <div className="relative aspect-video w-full rounded overflow-hidden bg-muted flex items-center justify-center">
                <LanguageIcon language={language} />
              </div>
              <div className="flex items-center gap-2 mt-3">
                <h3 className="text-base font-semibold text-foreground truncate">
                  {t.name}
                </h3>
              </div>
              {t.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {t.description}
                </p>
              )}
              <div className="mt-2 flex items-center justify-between">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    t.visibility === 'public'
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
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteId(t.id)
                      setOpenConfirm(true)
                    }}
                  >
                    <TbTrash className="text-base" />
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
        {!data?.results?.length && (
          <div className="col-span-full text-center py-12">
            <TbFileCode className="size-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No project templates yet
            </p>
          </div>
        )}
      </div>
      )}

      <ProjectTemplateEditor
        open={openForm}
        onOpenChange={(v) => {
          setOpenForm(v)
          if (!v) setEditId(undefined)
        }}
        editId={editId}
      />

      <DaConfirmPopup
        title="Delete Project Template"
        label="This will permanently delete the project template. This action cannot be undone."
        state={[openConfirm, setOpenConfirm]}
        onConfirm={() => {
          if (deleteId) del.mutate(deleteId)
          setDeleteId(undefined)
        }}
      >
        <></>
      </DaConfirmPopup>
    </div>
  )
}
