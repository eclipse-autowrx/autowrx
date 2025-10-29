// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useEffect, useMemo, useState } from 'react'
import DaDialog from '@/components/molecules/DaDialog'
import { Input } from '@/components/atoms/input'
import { Textarea } from '@/components/atoms/textarea'
import { Button } from '@/components/atoms/button'
import { Label } from '@/components/atoms/label'
import DaTabItem from '@/components/atoms/DaTabItem'
import CodeEditor from '@/components/molecules/CodeEditor'
import DaImportFile from '@/components/atoms/DaImportFile'
import { uploadFileService } from '@/services/upload.service'
import { TbPhotoEdit } from 'react-icons/tb'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createPlugin, getPluginById, updatePlugin, uploadInternalZip, type Plugin } from '@/services/plugin.service'
import { toast } from 'react-toastify'

type PluginFormProps = {
  open: boolean
  onClose: () => void
  mode: 'create' | 'edit'
  pluginId?: string
  onSaved?: (plugin: Plugin) => void
}

const PluginForm = ({ open, onClose, mode, pluginId, onSaved }: PluginFormProps) => {
  const qc = useQueryClient()
  const [isOpen, setIsOpen] = useState(open)

  useEffect(() => setIsOpen(open), [open])
  useEffect(() => { if (!isOpen && open) onClose() }, [isOpen])

  // Reset when opening in create mode
  useEffect(() => {
    if (open && mode === 'create') {
      setForm({
        name: '',
        is_internal: false,
        image: '',
        description: '',
        url: '',
        config: {},
      })
      setJsonText('{}')
      setActiveTab('meta')
    }
  }, [open, mode])

  const { data: initial, isFetching } = useQuery({
    queryKey: ['plugin', pluginId],
    queryFn: () => (mode === 'edit' && pluginId ? getPluginById(pluginId) : Promise.resolve(undefined)),
    enabled: isOpen && mode === 'edit' && !!pluginId,
  })

  const [form, setForm] = useState<Partial<Plugin>>({
    name: '',
    is_internal: false,
    image: '',
    description: '',
    url: '',
    config: {},
  })
  const [zip, setZip] = useState<File | null>(null)
  const [activeTab, setActiveTab] = useState<'meta' | 'config'>('meta')
  const [jsonText, setJsonText] = useState<string>('{}')
  const [jsonError, setJsonError] = useState<string | null>(null)

  useEffect(() => {
    if (initial) setForm(initial)
    if (!isOpen) {
      setZip(null)
    }
  }, [initial, isOpen])

  useEffect(() => {
    try {
      setJsonText(JSON.stringify(form.config || {}, null, 2))
      setJsonError(null)
    } catch {
      setJsonText('{}')
    }
  }, [isOpen, initial])

  const onChange = (k: keyof Plugin, v: any) => setForm((s) => ({ ...s, [k]: v }))

  const save = useMutation({
    mutationFn: async () => {
      // Parse latest JSON text regardless of editor blur
      let parsedConfig: any = form.config
      try {
        parsedConfig = JSON.parse(jsonText || '{}')
        setJsonError(null)
      } catch (e: any) {
        setJsonError(e?.message || 'Invalid JSON')
        throw new Error('Invalid JSON in Config tab')
      }
      const payload: any = {
        name: form.name,
        image: form.image,
        description: form.description,
        is_internal: !!form.is_internal,
        url: form.url,
        config: parsedConfig,
      }
      if (mode === 'create') return createPlugin(payload)
      if (!pluginId) throw new Error('Missing id')
      return updatePlugin(pluginId, payload)
    },
    onSuccess: (p: Plugin) => {
      toast.success('Saved')
      qc.invalidateQueries({ queryKey: ['plugins'] })
      qc.invalidateQueries({ queryKey: ['plugin', pluginId] })
      onSaved && onSaved(p)
      onClose()
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || e.message || 'Save failed'),
  })

  const doUpload = useMutation({
    mutationFn: async (file?: File) => {
      if (!form.name) throw new Error('Name required for internal upload')
      const selectedFile = file || zip
      if (!selectedFile) throw new Error('Select a ZIP file')
      // Temporarily use name as slug base; backend ensures uniqueness
      const base = form.name!.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || 'plugin'
      return uploadInternalZip(base, selectedFile)
    },
    onSuccess: ({ url }) => {
      onChange('url', url as any)
      toast.success('Uploaded and extracted')
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || e.message || 'Upload failed'),
  })

  const isCreate = useMemo(() => mode === 'create', [mode])
  const canSave = useMemo(() => {
    const hasName = !!(form.name && String(form.name).trim())
    const hasUrl = !!(form.url && String(form.url).trim())
    return hasName && hasUrl
  }, [form.name, form.url])

  return (
    <DaDialog
      open={isOpen}
      onOpenChange={setIsOpen}
      dialogTitle={isCreate ? 'Create Plugin' : 'Edit Plugin'}
      className="w-[840px] max-w-[calc(100vw-80px)]"
    >
      {isFetching && mode === 'edit' ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
          <div className="space-y-4">
            <div className="flex border-b border-border mb-2">
              <DaTabItem small active={activeTab === 'meta'} onClick={() => setActiveTab('meta')}>
                Meta
              </DaTabItem>
              <DaTabItem small active={activeTab === 'config'} onClick={() => setActiveTab('config')}>
                Config
              </DaTabItem>
            </div>

            {activeTab === 'meta' && (
              <div className="space-y-4">
                {/* Row 1: Left (name + description), Right (image + upload) */}
                <div className="flex gap-6 items-start">
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-col gap-1">
                      <Label>Name *</Label>
                      <Input
                        value={form.name || ''}
                        onChange={(e) => onChange('name', e.target.value)}
                        placeholder="Name *"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label>Description</Label>
                      <Textarea
                        value={form.description || ''}
                        onChange={(e) => onChange('description', e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="w-44 relative">
                    <div className="w-44 h-44 border border-border rounded-md overflow-hidden bg-white flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={form.image || '/imgs/plugin.png'}
                        alt="plugin"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/imgs/plugin.png'
                        }}
                      />
                    </div>
                    <DaImportFile
                      accept="image/*"
                      onFileChange={async (file) => {
                        try {
                          const { url } = await uploadFileService(file)
                          onChange('image', url)
                          toast.success('Image uploaded')
                        } catch (err) {
                          toast.error('Upload image failed')
                        }
                      }}
                    >
                      <Button variant="outline" size="icon-sm" className="absolute right-1 top-1 rounded-full">
                        <TbPhotoEdit className="w-4 h-4" />
                      </Button>
                    </DaImportFile>
                  </div>
                </div>

                {/* URL textbox always visible */}
                <div className="flex flex-col gap-1">
                  <Label>URL *: (plugin entry point)</Label>
                  <Textarea
                    value={form.url || ''}
                    onChange={(e) => {
                      const value = e.target.value
                      onChange('url', value)
                      // Auto mark as external when entering http(s)
                      if (value?.startsWith('http')) onChange('is_internal', false as any)
                    }}
                    rows={2}
                    required
                  />
                </div>

                {/* Upload button to derive URL via internal ZIP */}
                <div className="space-y-2 flex items-center gap-2">
                  <DaImportFile
                    accept=".zip"
                    onFileChange={async (file) => {
                      setZip(file)
                      try {
                        const res = await doUpload.mutateAsync(file)
                        // onSuccess already sets url; ensure internal flag
                        onChange('is_internal', true as any)
                      } catch (err) {}
                    }}
                  >
                    <Button disabled={!form.name || doUpload.isPending}>
                      {doUpload.isPending ? 'Uploading...' : 'Upload ZIP'}
                    </Button>
                  </DaImportFile>
                </div>
              </div>
            )}

            {activeTab === 'config' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">Config (JSON)</span>
                  <div className="grow" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      try {
                        const formatted = JSON.stringify(JSON.parse(jsonText || '{}'), null, 2)
                        setJsonText(formatted)
                        setJsonError(null)
                      } catch (e: any) {
                        setJsonError(e?.message || 'Invalid JSON')
                      }
                    }}
                  >
                    Format
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      try {
                        const parsed = JSON.parse(jsonText || '{}')
                        onChange('config', parsed)
                        setJsonError(null)
                        toast.success('Valid JSON')
                      } catch (e: any) {
                        setJsonError(e?.message || 'Invalid JSON')
                        toast.error('Invalid JSON')
                      }
                    }}
                  >
                    Validate
                  </Button>
                </div>
                <div className="h-[360px] border rounded-md">
                  <CodeEditor
                    code={jsonText}
                    setCode={setJsonText}
                    editable={true}
                    language="json"
                    onBlur={() => {
                      try {
                        const parsed = JSON.parse(jsonText || '{}')
                        onChange('config', parsed)
                        setJsonError(null)
                      } catch (e: any) {
                        setJsonError(e?.message || 'Invalid JSON')
                      }
                    }}
                  />
                </div>
                {jsonError && (
                  <p className="text-sm text-destructive">{jsonError}</p>
                )}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={() => save.mutate()} disabled={!canSave || save.isPending}>
                {save.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        )}
    </DaDialog>
  )
}

export default PluginForm


