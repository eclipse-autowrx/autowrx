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
import { listCustomApiSets, type CustomApiSet } from '@/services/customApiSet.service'
import { Spinner } from '@/components/atoms/spinner'
import { DaImage } from '@/components/atoms/DaImage'
import { cn } from '@/lib/utils'

interface CustomApiSetPickerProps {
  open: boolean
  onClose: () => void
  onSelect: (setId: string) => void
  excludeIds?: string[] // Set IDs to exclude (already added)
}

const CustomApiSetPicker: React.FC<CustomApiSetPickerProps> = ({
  open,
  onClose,
  onSelect,
  excludeIds = [],
}) => {
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch system-scoped sets only
  const { data, isLoading } = useQuery({
    queryKey: ['custom-api-sets', 'system', searchQuery],
    queryFn: () =>
      listCustomApiSets({
        scope: 'system',
        name: searchQuery || undefined,
        limit: 100,
      }),
    enabled: open,
  })

  const sets = data?.results || []
  const availableSets = sets.filter((set) => !excludeIds.includes(set.id))

  const handleSelect = (setId: string) => {
    onSelect(setId)
    onClose()
    setSearchQuery('')
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select API Set</DialogTitle>
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
                <span className="text-sm text-muted-foreground">Loading sets...</span>
              </div>
            ) : availableSets.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                {searchQuery ? 'No sets match your search.' : 'No available sets.'}
              </div>
            ) : (
              <div className="space-y-2">
                {availableSets.map((set) => (
                  <div
                    key={set.id}
                    onClick={() => handleSelect(set.id)}
                    className={cn(
                      'p-3 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {set.avatar && (
                        <div className="w-12 h-9 flex-shrink-0 border rounded overflow-hidden bg-muted">
                          <DaImage
                            src={set.avatar}
                            className="w-full h-full object-contain"
                            alt={set.name}
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{set.name}</div>
                        {set.description && (
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {set.description}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">
                          {set.data?.items?.length || 0} APIs
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

export default CustomApiSetPicker

