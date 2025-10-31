import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listModelTemplates,
  deleteModelTemplate,
  type ModelTemplate,
} from '@/services/modelTemplate.service'
import { Button } from '@/components/atoms/button'
import DaDialog from '@/components/molecules/DaDialog'
import TemplateForm from '@/components/organisms/TemplateForm'
import { useState } from 'react'
import { TbPencil, TbTrash } from 'react-icons/tb'
import { toast } from 'react-toastify'

export default function TemplateManager() {
  const qc = useQueryClient()
  const [openForm, setOpenForm] = useState(false)
  const [editId, setEditId] = useState<string | undefined>(undefined)

  const { data } = useQuery({
    queryKey: ['model-templates'],
    queryFn: () => listModelTemplates({ limit: 100, page: 1 }),
  })

  const del = useMutation({
    mutationFn: (id: string) => deleteModelTemplate(id),
    onSuccess: () => {
      toast.success('Deleted')
      qc.invalidateQueries({ queryKey: ['model-templates'] })
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message || e.message || 'Delete failed'),
  })

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Templates</h1>
        <Button
          onClick={() => {
            setEditId(undefined)
            setOpenForm(true)
          }}
        >
          New Template
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {data?.results?.map((t: ModelTemplate) => (
          <div
            key={t.id}
            className="rounded-md border border-input bg-background p-3 shadow-sm flex flex-col cursor-pointer hover:shadow-medium transition"
            onClick={() => {
              setEditId(t.id)
              setOpenForm(true)
            }}
          >
            <div className="relative aspect-square w-full rounded overflow-hidden bg-white">
              <img
                src={t.image || '/imgs/plugin.png'}
                alt={t.name}
                className="absolute p-6 inset-0 w-full h-full object-contain"
              />
            </div>
            <h3 className="text-base font-semibold text-foreground mt-3 truncate">
              {t.name}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap break-words">
              {t.description || ''}
            </p>
            <div className="mt-1 flex justify-end gap-1.5">
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
                <TbPencil className="text-xl" />
              </Button>
              <Button
                title="Delete"
                variant="ghost"
                size="icon"
                onClick={async (e) => {
                  e.stopPropagation()
                  if (!confirm('Delete this template?')) return
                  await del.mutateAsync(t.id)
                }}
              >
                <TbTrash className="text-xl" />
              </Button>
            </div>
          </div>
        ))}
        {!data?.results?.length && (
          <div className="col-span-full text-center py-6">
            <p className="text-sm text-muted-foreground">No templates yet</p>
          </div>
        )}
      </div>

      <DaDialog
        open={openForm}
        onOpenChange={setOpenForm}
        className="w-[840px] max-w-[calc(100vw-80px)]"
      >
        <TemplateForm
          open={openForm}
          templateId={editId}
          onClose={() => setOpenForm(false)}
        />
      </DaDialog>
    </div>
  )
}
