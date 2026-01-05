// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/atoms/dialog'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { useQuery } from '@tanstack/react-query'
import { listPluginApiInstances, type PluginApiInstance } from '@/services/pluginApiInstance.service'
import { Spinner } from '@/components/atoms/spinner'
import { DaImage } from '@/components/atoms/DaImage'
import { cn } from '@/lib/utils'

interface PluginApiInstancePickerProps {
  open: boolean
  onClose: () => void
  onSelect: (instanceId: string) => void
  excludeIds?: string[] // Instance IDs to exclude (already added)
}

const PluginApiInstancePicker: React.FC<PluginApiInstancePickerProps> = ({
  open,
  onClose,
  onSelect,
  excludeIds = [],
}) => {
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch system-scoped instances only
  const { data, isLoading } = useQuery({
    queryKey: ['plugin-api-instances', 'system', searchQuery],
    queryFn: () =>
      listPluginApiInstances({
        scope: 'system',
        name: searchQuery || undefined,
        limit: 100,
      }),
    enabled: open,
  })

  const instances = data?.results || []
  const availableInstances = instances.filter((instance) => !excludeIds.includes(instance.id))

  const handleSelect = (instanceId: string) => {
    onSelect(instanceId)
    onClose()
    setSearchQuery('')
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select API Instance</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col flex-1 min-h-0">
          {/* Search */}
          <div className="mb-4 shrink-0">
            <Input
              placeholder="Search instances..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner className="mr-2" />
                <span className="text-sm text-muted-foreground">Loading instances...</span>
              </div>
            ) : availableInstances.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                {searchQuery ? 'No instances match your search.' : 'No available instances.'}
              </div>
            ) : (
              <div className="space-y-2">
                {availableInstances.map((instance) => (
                  <div
                    key={instance.id}
                    onClick={() => handleSelect(instance.id)}
                    className={cn(
                      'p-3 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {instance.avatar && (
                        <div className="w-12 h-9 flex-shrink-0 border rounded overflow-hidden bg-muted">
                          <DaImage
                            src={instance.avatar}
                            className="w-full h-full object-contain"
                            alt={instance.name}
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{instance.name}</div>
                        {instance.description && (
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {instance.description}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">
                          {instance.data?.items?.length || 0} APIs
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default PluginApiInstancePicker

