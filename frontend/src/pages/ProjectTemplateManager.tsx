// Copyright (c) 2025 Eclipse Foundation.
// SPDX-License-Identifier: MIT

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listProjectTemplates,
  getProjectTemplateById,
  updateProjectTemplate,
  deleteProjectTemplate,
  type ProjectTemplate,
} from '@/services/projectTemplate.service'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { Textarea } from '@/components/atoms/textarea'
import { Label } from '@/components/atoms/label'
import DaDialog from '@/components/molecules/DaDialog'
import DaConfirmPopup from '@/components/molecules/DaConfirmPopup'
import { TbPencil, TbTrash, TbFileCode } from 'react-icons/tb'
import { toast } from 'react-toastify'

function ProjectTemplateEditForm({
  open,
  onOpenChange,
  editId,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  editId: string
  onSuccess: () => void
}) {
  const qc = useQueryClient()
  const [name, setName] = useState('')
  const [data, setData] = useState('')

  const { data: editData } = useQuery({
    queryKey: ['project-template-edit', editId],
    queryFn: () => getProjectTemplateById(editId),
    enabled: !!editId && open,
  })

  useEffect(() => {
    if (editData) {
      setName(editData.name || '')
      try {
        setData(JSON.stringify(JSON.parse(editData.data), null, 2))
      } catch {
        setData(editData.data || '')
      }
    } else if (!open) {
      setName('')
      setData('')
    }
  }, [editData, open])

  const save = useMutation({
    mutationFn: async () => {
      JSON.parse(data) // validate JSON
      return updateProjectTemplate(editId, { name, data })
    },
    onSuccess: () => {
      toast.success('Template updated')
      qc.invalidateQueries({ queryKey: ['project-templates'] })
      qc.invalidateQueries({ queryKey: ['project-templates-list'] })
      onOpenChange(false)
      onSuccess()
    },
    onError: (e: any) => {
      if (e instanceof SyntaxError) {
        toast.error('Invalid JSON format in data field')
      } else {
        toast.error(e?.response?.data?.message || e.message || 'Save failed')
      }
    },
  })

  return (
    <DaDialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setName('')
          setData('')
        }
        onOpenChange(v)
      }}
      className="w-[680px] max-w-[calc(100vw-80px)]"
    >
      <div className="p-6 space-y-4 min-w-0 overflow-hidden">
        <h2 className="text-lg font-semibold">Edit Project Template</h2>

        <div className="space-y-2">
          <Label>Name *</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Template name"
          />
        </div>

        <div className="space-y-2 w-full overflow-hidden">
          <Label>Data (JSON) *</Label>
          <Textarea
            value={data}
            onChange={(e) => setData(e.target.value)}
            placeholder='{"language": "python", "code": "...", ...}'
            style={{ 
              width: '100%',
              maxWidth: '100%',
              minWidth: '0',
              display: 'block',
              whiteSpace: 'pre-wrap',
              overflowWrap: 'anywhere'
            }}
            className="h-64 resize-none font-mono text-sm border p-2"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => {
              setName('')
              setData('')
              onOpenChange(false)
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => save.mutate()}
            disabled={!name.trim() || !data.trim() || save.isPending}
          >
            {save.isPending ? 'Saving…' : 'Update'}
          </Button>
        </div>
      </div>
    </DaDialog>
  )
}

export default function ProjectTemplateManager() {
  const qc = useQueryClient()
  const [editId, setEditId] = useState<string | undefined>(undefined)
  const [openForm, setOpenForm] = useState(false)
  const [deleteId, setDeleteId] = useState<string | undefined>(undefined)
  const [openConfirm, setOpenConfirm] = useState(false)

  const { data } = useQuery({
    queryKey: ['project-templates'],
    queryFn: () => listProjectTemplates({ limit: 100, page: 1 }),
  })

  const del = useMutation({
    mutationFn: (id: string) => deleteProjectTemplate(id),
    onSuccess: () => {
      toast.success('Deleted')
      qc.invalidateQueries({ queryKey: ['project-templates'] })
      qc.invalidateQueries({ queryKey: ['project-templates-list'] })
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message || e.message || 'Delete failed'),
  })

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Project Templates</h1>
      </div>

      <div className="flex flex-col gap-2">
        {data?.results?.map((t: ProjectTemplate) => (
          <div
            key={t.id}
            className="flex items-center justify-between rounded-md border border-input bg-background p-3 shadow-sm cursor-pointer hover:shadow-md transition"
            onClick={() => {
              setEditId(t.id)
              setOpenForm(true)
            }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <TbFileCode className="size-5 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium truncate">{t.name}</span>
            </div>
            <div className="flex gap-1 shrink-0">
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
        ))}
        {!data?.results?.length && (
          <div className="text-center py-12">
            <TbFileCode className="size-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No project templates yet
            </p>
          </div>
        )}
      </div>

      {editId && (
        <ProjectTemplateEditForm
          open={openForm}
          onOpenChange={(v) => {
            setOpenForm(v)
            if (!v) setEditId(undefined)
          }}
          editId={editId}
          onSuccess={() => {}}
        />
      )}

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
