// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC, useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  listAdminPlugins,
  listMyPlugins,
  deletePlugin,
  Plugin,
} from '@/services/plugin.service'
import { Input } from '@/components/atoms/input'
import { Button } from '@/components/atoms/button'
import { Spinner } from '@/components/atoms/spinner'
import { Label } from '@/components/atoms/label'
import { TbSearch, TbArrowLeft, TbPencil, TbTrash } from 'react-icons/tb'
import PluginForm from '@/components/organisms/PluginForm'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/atoms/dialog'

interface AddonSelectProps {
  onSelect: (plugin: Plugin, label: string) => void
  onCancel?: () => void
}

const AddonSelect: FC<AddonSelectProps> = ({ onSelect, onCancel }) => {
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState<'system' | 'mine'>('system')
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredPlugins, setFilteredPlugins] = useState<Plugin[]>([])
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null)
  const [labelName, setLabelName] = useState('')
  const [openPluginForm, setOpenPluginForm] = useState(false)
  const [editPluginId, setEditPluginId] = useState<string | undefined>(undefined)
  const [pluginToDelete, setPluginToDelete] = useState<Plugin | null>(null)

  const systemQuery = useQuery({
    queryKey: ['plugins', 'admin'],
    queryFn: () => listAdminPlugins({ page: 1, limit: 100 }),
  })

  const mineQuery = useQuery({
    queryKey: ['plugins', 'mine'],
    queryFn: () => listMyPlugins({ page: 1, limit: 100 }),
  })

  const activeQuery = activeTab === 'system' ? systemQuery : mineQuery

  useEffect(() => {
    const results = activeQuery.data?.results || []
    const filtered = results.filter(
        (plugin) =>
          plugin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          plugin.slug?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          plugin.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    setFilteredPlugins(filtered)
  }, [activeQuery.data, searchTerm, activeTab])

  const handlePluginClick = (plugin: Plugin) => {
    setSelectedPlugin(plugin)
    setLabelName(plugin.name) // Pre-fill with plugin name
  }

  const handleConfirm = () => {
    if (selectedPlugin && labelName.trim()) {
      onSelect(selectedPlugin, labelName.trim())
    }
  }

  const handleBack = () => {
    setSelectedPlugin(null)
    setLabelName('')
  }

  if (activeQuery.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-4">
        <Spinner size={32} />
        <p className="text-sm text-muted-foreground">Loading addons...</p>
      </div>
    )
  }

  if (activeQuery.error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-4">
        <p className="text-sm text-destructive">
          Failed to load addons. Please try again.
        </p>
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Close
          </Button>
        )}
      </div>
    )
  }

  // Show label input screen when plugin is selected
  if (selectedPlugin) {
    return (
      <div className="flex flex-col w-full max-w-2xl">
        {/* Header */}
        <div className="flex flex-col gap-2 p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="h-8 w-8"
            >
              <TbArrowLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-lg font-semibold text-primary">
              Configure Tab Label
            </h2>
          </div>
          <p className="text-sm text-muted-foreground ml-10">
            Set the label name for this addon tab
          </p>
        </div>

        {/* Selected Plugin Info */}
        <div className="p-6 border-b border-border">
          <div className="flex items-start gap-4 p-4 bg-accent rounded">
            {selectedPlugin.image ? (
              <img
                src={selectedPlugin.image}
                alt={selectedPlugin.name}
                className="w-12 h-12 rounded object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
                <span className="text-lg text-muted-foreground">
                  {selectedPlugin.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <h3 className="text-sm font-medium text-foreground">
                {selectedPlugin.name}
              </h3>
              {selectedPlugin.description && (
                <p className="text-xs text-muted-foreground">
                  {selectedPlugin.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Label Input */}
        <div className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="label-input">Tab Label</Label>
            <Input
              id="label-input"
              type="text"
              placeholder="Enter tab label..."
              value={labelName}
              onChange={(e) => setLabelName(e.target.value)}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              This label will appear in the prototype tabs
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-6 border-t border-border">
          <Button variant="outline" onClick={handleBack}>
            Back
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!labelName.trim()}
          >
            Add to Tabs
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col w-full max-w-2xl">
      {/* Header */}
      <div className="flex flex-col gap-2 p-6 border-b border-border">
        <h2 className="text-lg font-semibold text-primary">Select an Addon</h2>
        <p className="text-sm text-muted-foreground">
          Choose an addon to add to your prototype tabs
        </p>
      </div>

      {/* Tabs */}
      <div className="px-6 pt-4">
        <div className="flex border-b border-border">
          <button
            type="button"
            onClick={() => {
              setActiveTab('system')
              setSearchTerm('')
            }}
            className={`cursor-pointer px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'system'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            System plugins
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('mine')
              setSearchTerm('')
            }}
            className={`cursor-pointer px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'mine'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            My plugins
          </button>
          <div className="flex-1" />
          {activeTab === 'mine' && (
            <Button
              className="px-3 ml-2 mb-2"
              onClick={() => {
                setEditPluginId(undefined)
                setOpenPluginForm(true)
              }}
              disabled={(mineQuery.error as any)?.response?.status === 401}
            >
              Add plugin
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="p-6 border-b border-border">
        <div className="relative">
          <TbSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search addons..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex flex-col max-h-96 overflow-y-auto">
        {activeTab === 'mine' && (mineQuery.error as any)?.response?.status === 401 ? (
          <div className="flex items-center justify-center p-8">
            <p className="text-sm text-muted-foreground">
              Please sign in to view your plugins.
            </p>
          </div>
        ) : (
        filteredPlugins.length === 0 ? (
          <div className="flex items-center justify-center p-8">
            <p className="text-sm text-muted-foreground">
              {searchTerm ? 'No addons found matching your search' : 'No addons available'}
            </p>
          </div>
        ) : (
          filteredPlugins.map((plugin) => (
            <div
              key={plugin.id}
              className="flex items-start gap-4 p-4 border-b border-border cursor-pointer"
            >
              <button
                type="button"
                onClick={() => handlePluginClick(plugin)}
                className="flex items-start gap-4 flex-1 min-w-0 text-left cursor-pointer"
              >
                {/* Plugin Image */}
                {plugin.image ? (
                  <img
                    src={plugin.image}
                    alt={plugin.name}
                    className="w-12 h-12 rounded object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
                    <span className="text-lg text-muted-foreground">
                      {plugin.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Plugin Info */}
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-foreground truncate">
                    {plugin.name}
                  </h3>
                  {plugin.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {plugin.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="px-2 py-0.5 bg-muted rounded">
                      {plugin.is_internal ? 'Internal' : 'External'}
                    </span>
                    {plugin.slug && (
                      <span className="font-mono">{plugin.slug}</span>
                    )}
                  </div>
                </div>
              </button>
              {activeTab === 'mine' && (
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    title="Edit"
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditPluginId(plugin.id)
                      setOpenPluginForm(true)
                    }}
                  >
                    <TbPencil className="w-4 h-4" />
                  </Button>
                  <Button
                    title="Delete"
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      setPluginToDelete(plugin)
                    }}
                    className="text-destructive hover:text-destructive"
                  >
                    <TbTrash className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          ))
        )
        )}
      </div>

      {/* Footer */}
      {onCancel && (
        <div className="flex justify-end gap-2 p-6 border-t border-border">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      )}

      <PluginForm
        open={openPluginForm}
        onClose={() => {
          setOpenPluginForm(false)
          setEditPluginId(undefined)
        }}
        mode={editPluginId ? 'edit' : 'create'}
        pluginId={editPluginId}
        defaultType="prototype_function"
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ['plugins', 'mine'] })
          setActiveTab('mine')
          setSearchTerm('')
        }}
      />

      <Dialog
        open={!!pluginToDelete}
        onOpenChange={(open) => !open && setPluginToDelete(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete plugin</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{pluginToDelete?.name}
              &quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setPluginToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!pluginToDelete) return
                try {
                  await deletePlugin(pluginToDelete.id)
                  qc.invalidateQueries({ queryKey: ['plugins', 'mine'] })
                  setPluginToDelete(null)
                } catch (e) {}
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AddonSelect
