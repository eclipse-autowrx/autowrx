// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC, useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listPlugins, Plugin } from '@/services/plugin.service'
import { Input } from '@/components/atoms/input'
import { Button } from '@/components/atoms/button'
import { Spinner } from '@/components/atoms/spinner'
import { Label } from '@/components/atoms/label'
import { TbSearch, TbArrowLeft } from 'react-icons/tb'

interface AddonSelectProps {
  onSelect: (plugin: Plugin, label: string) => void
  onCancel?: () => void
}

const AddonSelect: FC<AddonSelectProps> = ({ onSelect, onCancel }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredPlugins, setFilteredPlugins] = useState<Plugin[]>([])
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null)
  const [labelName, setLabelName] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['plugins'],
    queryFn: () => listPlugins({ page: 1, limit: 100 }),
  })

  useEffect(() => {
    if (data?.results) {
      const filtered = data.results.filter(
        (plugin) =>
          plugin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          plugin.slug?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          plugin.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredPlugins(filtered)
    }
  }, [data, searchTerm])

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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-4">
        <Spinner size={32} />
        <p className="text-sm text-muted-foreground">Loading addons...</p>
      </div>
    )
  }

  if (error) {
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
        {filteredPlugins.length === 0 ? (
          <div className="flex items-center justify-center p-8">
            <p className="text-sm text-muted-foreground">
              {searchTerm ? 'No addons found matching your search' : 'No addons available'}
            </p>
          </div>
        ) : (
          filteredPlugins.map((plugin) => (
            <button
              key={plugin.id}
              onClick={() => handlePluginClick(plugin)}
              className="flex items-start gap-4 p-4 border-b border-border hover:bg-accent transition-colors text-left"
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
          ))
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
    </div>
  )
}

export default AddonSelect
