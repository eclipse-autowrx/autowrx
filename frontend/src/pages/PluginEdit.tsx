// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createPlugin,
  getPluginById,
  updatePlugin,
  uploadInternalZip,
  type Plugin,
} from '@/services/plugin.service'
import { useNavigate, useParams } from 'react-router-dom'
import { Input } from '@/components/atoms/input'
import { Textarea } from '@/components/atoms/textarea'
import { Button } from '@/components/atoms/button'
import { Label } from '@/components/atoms/label'
import { Checkbox } from '@/components/atoms/checkbox'
import JsonEditor from '@/components/atoms/JsonEditor'
import { toast } from 'react-toastify'

const PluginEdit = ({ mode }: { mode: 'create' | 'edit' }) => {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: initial, isFetching } = useQuery({
    queryKey: ['plugin', id],
    queryFn: () => (id ? getPluginById(id) : Promise.resolve(undefined)),
    enabled: mode === 'edit' && !!id,
  })

  const [form, setForm] = useState<Partial<Plugin>>({
    name: '',
    slug: '',
    is_internal: false,
    image: '',
    description: '',
    url: '',
    config: {},
  })
  const [zip, setZip] = useState<File | null>(null)

  useEffect(() => {
    if (initial) setForm(initial)
  }, [initial])

  const onChange = (k: keyof Plugin, v: any) =>
    setForm((s) => ({ ...s, [k]: v }))

  const save = useMutation({
    mutationFn: async () => {
      const payload: any = {
        name: form.name,
        slug: form.slug,
        image: form.image,
        description: form.description,
        is_internal: !!form.is_internal,
        url: form.is_internal ? undefined : form.url,
        config: form.config,
      }
      if (mode === 'create') return createPlugin(payload)
      if (!id) throw new Error('Missing id')
      return updatePlugin(id, payload)
    },
    onSuccess: (p: Plugin) => {
      toast.success('Saved')
      qc.invalidateQueries({ queryKey: ['plugins'] })
      if (mode === 'create') navigate(`/plugins/${p.id}`)
      else qc.invalidateQueries({ queryKey: ['plugin', id] })
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message || e.message || 'Save failed'),
  })

  const doUpload = useMutation({
    mutationFn: async () => {
      if (!form.slug) throw new Error('Slug required for internal upload')
      if (!zip) throw new Error('Select a ZIP file')
      return uploadInternalZip(form.slug, zip)
    },
    onSuccess: ({ url }) => {
      onChange('url', url as any)
      toast.success('Uploaded and extracted')
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message || e.message || 'Upload failed'),
  })

  const isCreate = useMemo(() => mode === 'create', [mode])

  return (
    <div className="p-6 !w-[800px] max-w-[calc(100vw-80px)]">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-foreground">
          {isCreate ? 'Create Plugin' : 'Edit Plugin'}
        </h2>
      </div>

      {isFetching && mode === 'edit' ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <div className="space-y-4">
          <Input
            value={form.name || ''}
            onChange={(e) => onChange('name', e.target.value)}
            placeholder="Name"
          />
          <Input
            value={form.slug || ''}
            onChange={(e) => onChange('slug', e.target.value)}
            placeholder="Slug"
            className="disabled:opacity-60"
            disabled={!isCreate}
          />

          <div className="flex items-center gap-2">
            <Checkbox
              checked={!!form.is_internal}
              onCheckedChange={(checked) => onChange('is_internal', checked)}
              id="is-internal"
            />
            <Label htmlFor="is-internal" className="cursor-pointer">
              Internal plugin
            </Label>
          </div>

          <Input
            value={form.image || ''}
            onChange={(e) => onChange('image', e.target.value)}
            placeholder="Image URL"
          />

          <div className="flex flex-col gap-1.5">
            <Label>Description</Label>
            <Textarea
              value={form.description || ''}
              onChange={(e) => onChange('description', e.target.value)}
              rows={3}
            />
          </div>

          {!form.is_internal && (
            <Input
              value={form.url || ''}
              onChange={(e) => onChange('url', e.target.value)}
              placeholder="External URL (https)"
            />
          )}

          {form.is_internal && (
            <div className="space-y-2">
              <Input
                type="file"
                onChange={(e) => setZip(e.target.files?.[0] || null)}
              />
              <div className="flex gap-2 items-center">
                <Button
                  onClick={() => doUpload.mutate()}
                  disabled={!zip || !form.slug || doUpload.isPending}
                >
                  {doUpload.isPending ? 'Uploading...' : 'Upload ZIP'}
                </Button>
                {form.url && (
                  <p className="text-sm text-muted-foreground break-all">
                    {form.url}
                  </p>
                )}
              </div>
            </div>
          )}

          <div>
            <span className="text-sm font-semibold mb-1 block text-foreground">
              Config (JSON)
            </span>
            <JsonEditor
              value={form.config || {}}
              onChange={(v) => onChange('config', v)}
              valueType="object"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? 'Saving...' : 'Save'}
            </Button>
            <Button variant="outline" onClick={() => navigate('/plugins')}>
              Back
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default PluginEdit
