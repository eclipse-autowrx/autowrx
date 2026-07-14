// Copyright (c) 2025 Eclipse Foundation.
// SPDX-License-Identifier: MIT

import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getProjectTemplateById,
  createProjectTemplate,
  updateProjectTemplate,
} from '@/services/projectTemplate.service'
import { Button } from '@/components/atoms/button'
import { Label } from '@/components/atoms/label'
import { Spinner } from '@/components/atoms/spinner'
import { DaSelect, DaSelectItem } from '@/components/atoms/DaSelect'
import DaDialog from '@/components/molecules/DaDialog'
import DaDashboardEditor from '@/components/molecules/dashboard/DaDashboardEditor'
import CodeEditor from '@/components/molecules/CodeEditor'
import ProjectTemplateMetadataFields from '@/components/molecules/project/ProjectTemplateMetadataFields'
import { Textarea } from '@/components/atoms/textarea'
import {
  EMPTY_PROJECT_TEMPLATE_FORM,
  deserializeProjectTemplate,
  serializeProjectTemplateData,
  getDefaultDashboardCfg,
  getProjectTemplateErrorMessage,
  isDefaultDashboardCfg,
  invalidateProjectTemplateQueries,
  PROJECT_TEMPLATE_QUERY_KEYS,
  type ProjectTemplateFormState,
} from '@/utils/projectTemplate'
import { toast } from 'react-toastify'

export interface ProjectTemplateEditorProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  editId?: string
  onSuccess?: () => void
}

export default function ProjectTemplateEditor({
  open,
  onOpenChange,
  editId,
  onSuccess,
}: ProjectTemplateEditorProps) {
  const qc = useQueryClient()
  const isEdit = !!editId
  const [form, setForm] = useState<ProjectTemplateFormState>(EMPTY_PROJECT_TEMPLATE_FORM)

  const {
    data: editData,
    isLoading: isEditLoading,
    isFetching: isEditFetching,
    isError: isEditFetchError,
    error: editFetchError,
    refetch: refetchEditData,
  } = useQuery({
    queryKey: PROJECT_TEMPLATE_QUERY_KEYS.edit(editId!),
    queryFn: () => getProjectTemplateById(editId!),
    enabled: isEdit && open,
  })

  const isEditDataLoading = isEdit && (isEditLoading || isEditFetching)
  const isEditDataError = isEdit && isEditFetchError

  useEffect(() => {
    if (!open) {
      setForm(EMPTY_PROJECT_TEMPLATE_FORM)
      return
    }
    if (!isEdit) {
      setForm(EMPTY_PROJECT_TEMPLATE_FORM)
      return
    }
    if (isEditFetchError) {
      return
    }
    if (editData?.id === editId) {
      setForm(deserializeProjectTemplate(editData))
      return
    }
    if (!isEditDataLoading) {
      setForm(EMPTY_PROJECT_TEMPLATE_FORM)
    }
  }, [open, isEdit, editId, editData, isEditFetchError, isEditDataLoading])

  const handleLanguageChange = (language: string) => {
    setForm((f) => ({
      ...f,
      language,
      widget_config: isDefaultDashboardCfg(f.widget_config, f.language)
        ? getDefaultDashboardCfg(language)
        : f.widget_config,
    }))
  }

  const resetAndClose = () => {
    setForm(EMPTY_PROJECT_TEMPLATE_FORM)
    onOpenChange(false)
  }

  const codeEditorHeight = useMemo(() => {
    const lineCount = Math.max(form.code.split('\n').length, 1)
    const lineHeight = 19
    const padding = 20
    const minHeight = 160
    const maxHeight = 480
    return Math.min(Math.max(lineCount * lineHeight + padding, minHeight), maxHeight)
  }, [form.code])

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        visibility: form.visibility,
        data: serializeProjectTemplateData({
          language: form.language,
          code: form.code,
          widget_config: form.widget_config,
          customer_journey: form.customer_journey,
        }),
      }
      if (isEdit) return updateProjectTemplate(editId!, payload)
      return createProjectTemplate(payload)
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Template updated' : 'Template created')
      if (isEdit && editId) {
        qc.invalidateQueries({ queryKey: PROJECT_TEMPLATE_QUERY_KEYS.edit(editId) })
      }
      invalidateProjectTemplateQueries(qc)
      onOpenChange(false)
      onSuccess?.()
    },
    onError: (e: unknown) => {
      toast.error(getProjectTemplateErrorMessage(e, 'Save failed'))
    },
  })

  return (
    <DaDialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setForm(EMPTY_PROJECT_TEMPLATE_FORM)
        onOpenChange(v)
      }}
      className="w-[95vw] sm:w-[90vw] max-w-[1200px] h-[90vh] max-h-[calc(100dvh-2rem)]"
      contentContainerClassName="min-h-0"
      dialogTitle={isEdit ? 'Edit Project Template' : 'Create Project Template'}
      footer={
        <>
          <Button variant="outline" onClick={resetAndClose}>
            Cancel
          </Button>
          <Button
            onClick={() => save.mutate()}
            disabled={
              !form.name.trim() ||
              save.isPending ||
              isEditDataLoading ||
              isEditDataError
            }
          >
            {save.isPending ? 'Saving…' : isEdit ? 'Update' : 'Create'}
          </Button>
        </>
      }
    >
      {isEditDataLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size={32} />
        </div>
      ) : isEditDataError ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-destructive">
            {getProjectTemplateErrorMessage(editFetchError, 'Failed to load template')}
          </p>
          <Button variant="outline" onClick={() => refetchEditData()}>
            Retry
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <ProjectTemplateMetadataFields
            layout="split"
            descriptionRows={1}
            showVisibility={false}
            name={form.name}
            description={form.description}
            onNameChange={(name) => setForm((f) => ({ ...f, name }))}
            onDescriptionChange={(description) =>
              setForm((f) => ({ ...f, description }))
            }
          />

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <Label>Visibility</Label>
              <DaSelect
                value={form.visibility}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    visibility: v as ProjectTemplateFormState['visibility'],
                  }))
                }
                className="h-9 text-sm"
              >
                <DaSelectItem value="public">public</DaSelectItem>
                <DaSelectItem value="private">private</DaSelectItem>
              </DaSelect>
            </div>
            <div className="flex-1 space-y-2">
              <Label>Language</Label>
              <DaSelect
                value={form.language}
                onValueChange={handleLanguageChange}
                className="h-9 text-sm"
              >
                <DaSelectItem value="python">python</DaSelectItem>
                <DaSelectItem value="rust">rust</DaSelectItem>
              </DaSelect>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Code</Label>
            <div
              className="border rounded-md overflow-hidden"
              style={{ height: codeEditorHeight }}
            >
              <CodeEditor
                code={form.code}
                setCode={(code) => setForm((f) => ({ ...f, code }))}
                editable={true}
                language={form.language}
                onBlur={() => {}}
                alwaysConsumeMouseWheel={false}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Dashboard Config</Label>
            <div className="min-h-[280px]">
              <DaDashboardEditor
                entireWidgetConfig={form.widget_config}
                editable={true}
                onDashboardConfigChanged={(cfg) =>
                  setForm((f) => ({ ...f, widget_config: cfg }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Customer Journey</Label>
            <Textarea
              value={form.customer_journey}
              onChange={(e) =>
                setForm((f) => ({ ...f, customer_journey: e.target.value }))
              }
              placeholder="Customer journey markdown or text"
              rows={3}
            />
          </div>
        </div>
      )}
    </DaDialog>
  )
}
