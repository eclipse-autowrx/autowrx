// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useQuery } from '@tanstack/react-query'
import {
  listPlugins,
  deletePlugin,
  type Plugin,
} from '@/services/plugin.service'
import { Button } from '@/components/atoms/button'
import PluginForm from '@/components/organisms/PluginForm'
import { useState } from 'react'
import { TbPencil, TbTrash } from 'react-icons/tb'
import { useQueryClient } from '@tanstack/react-query'

const PluginList = () => {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['plugins'],
    queryFn: () => listPlugins({ limit: 100, page: 1 }),
  })
  const [openForm, setOpenForm] = useState(false)
  const [editId, setEditId] = useState<string | undefined>(undefined)

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Plugins</h2>
        <Button
          className="px-3"
          onClick={() => {
            setEditId(undefined)
            setOpenForm(true)
          }}
        >
          New
        </Button>
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {data?.results?.map((p: Plugin) => (
            <div
              key={p.id}
              className="rounded-md border border-input bg-background p-3 shadow-sm flex flex-col cursor-pointer hover:shadow-medium transition"
              onClick={() => {
                setEditId(p.id)
                setOpenForm(true)
              }}
            >
              <div className="relative aspect-square w-full rounded overflow-hidden bg-white">
                <img
                  src={p.image || '/imgs/plugin.png'}
                  alt={p.name}
                  className="absolute p-6 inset-0 w-full h-full object-contain"
                />
              </div>
              <h3 className="text-base font-semibold text-foreground mt-3 truncate">
                {p.name}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap break-words">
                {p.description || ''}
              </p>
              <div className="mt-1 flex justify-end gap-1.5">
                <Button
                  title="Edit"
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditId(p.id)
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
                    if (!confirm('Delete this plugin?')) return
                    try {
                      await deletePlugin(p.id)
                      qc.invalidateQueries({ queryKey: ['plugins'] })
                    } catch (e) {}
                  }}
                >
                  <TbTrash className="text-xl" />
                </Button>
              </div>
            </div>
          ))}
          {!data?.results?.length && (
            <div className="col-span-full text-center py-6">
              <p className="text-sm text-muted-foreground">No plugins yet</p>
            </div>
          )}
        </div>
      )}
      <PluginForm
        open={openForm}
        onClose={() => setOpenForm(false)}
        mode={editId ? 'edit' : 'create'}
        pluginId={editId}
      />
    </div>
  )
}

export default PluginList
