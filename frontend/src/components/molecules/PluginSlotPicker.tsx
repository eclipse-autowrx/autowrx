// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC, useState } from 'react'
import { TbPencil, TbPuzzle, TbSearch, TbTrash } from 'react-icons/tb'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { Spinner } from '@/components/atoms/spinner'
import type { Plugin } from '@/services/plugin.service'

interface PluginSlotPickerProps {
  /** Selected plugin slug, or null when the slot uses its built-in default */
  value: string | null
  onChange: (slug: string | null) => void
  plugins?: Plugin[]
  loading?: boolean
  setLabel: string
  removeTitle: string
  dataId?: string
}

/** Picks a single plugin for a layout slot (e.g. the prototype runtime panel). */
const PluginSlotPicker: FC<PluginSlotPickerProps> = ({
  value,
  onChange,
  plugins = [],
  loading,
  setLabel,
  removeTitle,
  dataId,
}) => {
  const [showPicker, setShowPicker] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const selectedPlugin = plugins.find((p) => p.slug === value)
  const term = searchTerm.toLowerCase()
  const filteredPlugins = plugins.filter(
    (plugin) =>
      plugin.name.toLowerCase().includes(term) ||
      plugin.slug?.toLowerCase().includes(term) ||
      plugin.description?.toLowerCase().includes(term),
  )

  const closePicker = () => {
    setShowPicker(false)
    setSearchTerm('')
  }

  if (value && !showPicker) {
    return (
      <div
        data-id={dataId}
        className="flex items-center gap-3 p-3 border border-border rounded bg-accent/50"
      >
        <TbPuzzle className="w-5 h-5 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {selectedPlugin?.name || value}
          </p>
          <p className="text-xs text-muted-foreground font-mono truncate">
            plugin: {value}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowPicker(true)}
          className="h-8 w-8"
          title="Change plugin"
        >
          <TbPencil className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            onChange(null)
            closePicker()
          }}
          className="h-8 w-8 text-destructive hover:text-destructive"
          title={removeTitle}
        >
          <TbTrash className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  if (!showPicker) {
    return (
      <Button
        data-id={dataId}
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={() => setShowPicker(true)}
      >
        <TbPuzzle className="w-4 h-4 mr-2" />
        {setLabel}
      </Button>
    )
  }

  return (
    <div
      data-id={dataId}
      className="flex flex-col gap-2 border border-border rounded p-3"
    >
      <div className="relative">
        <TbSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search plugins..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 text-sm"
          autoFocus
        />
      </div>
      <div className="flex flex-col max-h-48 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-4">
            <Spinner size={20} />
          </div>
        ) : filteredPlugins.length === 0 ? (
          <p className="text-xs text-muted-foreground p-4 text-center">
            {searchTerm ? 'No plugins found' : 'No plugins available'}
          </p>
        ) : (
          filteredPlugins.map((plugin) => (
            <button
              key={plugin.id}
              onClick={() => {
                onChange(plugin.slug)
                closePicker()
              }}
              className="flex items-center gap-3 p-2 hover:bg-accent rounded transition-colors text-left"
            >
              {plugin.image ? (
                <img
                  src={plugin.image}
                  alt={plugin.name}
                  className="w-8 h-8 rounded object-cover shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0">
                  <span className="text-xs text-muted-foreground">
                    {plugin.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {plugin.name}
                </p>
                <p className="text-xs text-muted-foreground font-mono truncate">
                  {plugin.slug}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={closePicker}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

export default PluginSlotPicker
