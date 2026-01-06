// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useState, useMemo } from 'react'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import DaFilter from '@/components/atoms/DaFilter'
import { cn } from '@/lib/utils'
import { TbPlus, TbTrash, TbSearch } from 'react-icons/tb'
import { Spinner } from '@/components/atoms/spinner'
import { getListViewDisplayValues, extractListViewConfig, extractListViewStyle } from '@/utils/listViewTemplate'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/atoms/tooltip'
import { getTypeColor } from '@/utils/typeColors'

export interface CustomAPIListItem {
  id: string
  [key: string]: any
}

interface CustomAPIListProps {
  items: CustomAPIListItem[]
  selectedItemId?: string | null
  onSelectItem: (itemId: string) => void
  onDeleteItem?: (itemId: string) => void
  onCreateNew?: () => void
  schema?: string | object | null // JSON Schema or CustomApiSchema object
  listViewConfig?: {
    title?: string | null
    description?: string | null
    type?: string | null
    style?: 'compact' | 'badge' | 'badge-image' | null
  } | null
  mode?: 'view' | 'edit' // view mode hides delete button
  isLoading?: boolean
  deletingItemId?: string | null
  // Filter options
  filterOptions?: {
    typeField?: string // Field name to filter by (e.g., 'method')
    typeOptions?: string[] // Available filter options (e.g., ['GET', 'POST', 'PUT'])
  }
  // Footer image (e.g., CustomApiSet avatar)
  footerImage?: string | null
  // Provider URL - opens when clicking on the image
  providerUrl?: string | null
}

const CustomAPIList: React.FC<CustomAPIListProps> = ({
  items,
  selectedItemId,
  onSelectItem,
  onDeleteItem,
  onCreateNew,
  schema,
  listViewConfig: providedListViewConfig,
  mode = 'edit',
  isLoading = false,
  deletingItemId = null,
  filterOptions,
  footerImage,
  providerUrl,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])

  // Extract list view config from schema if not provided
  const listViewConfig = useMemo(() => {
    if (providedListViewConfig) {
      return providedListViewConfig
    }
    if (schema) {
      return extractListViewConfig(schema)
    }
    return null
  }, [providedListViewConfig, schema])

  // Extract list view style (default: 'compact')
  const listViewStyle = useMemo(() => {
    if (schema) {
      const style = extractListViewStyle(schema)
      // Also check listViewConfig.style if available (for direct prop passing)
      if (listViewConfig?.style) {
        return listViewConfig.style === 'badge-image' ? 'badge-image' : listViewConfig.style === 'badge' ? 'badge' : 'compact'
      }
      return style
    }
    // Check provided listViewConfig for style
    if (providedListViewConfig?.style) {
      return providedListViewConfig.style === 'badge-image' ? 'badge-image' : providedListViewConfig.style === 'badge' ? 'badge' : 'compact'
    }
    return 'compact' // Default style
  }, [schema, listViewConfig, providedListViewConfig])

  // Debug: Log footerImage when it changes (moved after listViewStyle definition)
  React.useEffect(() => {
    console.log('CustomAPIList footerImage:', footerImage)
    console.log('CustomAPIList footerImage type:', typeof footerImage)
    console.log('CustomAPIList footerImage truthy?', !!footerImage)
    console.log('CustomAPIList listViewStyle:', listViewStyle)
  }, [footerImage, listViewStyle])

  // Initialize filters with all options selected by default
  React.useEffect(() => {
    if (filterOptions?.typeOptions && filterOptions.typeOptions.length > 0) {
      const allOptions = filterOptions.typeOptions.map(opt => opt.toLowerCase())
      setSelectedFilters((prev) => {
        // Only initialize if not already set
        if (prev.length === 0) {
          return allOptions
        }
        return prev
      })
    }
  }, [filterOptions?.typeOptions])

  // Filter and search items
  const filteredItems = useMemo(() => {
    let filtered = items

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((item) => {
        const displayValues = getListViewDisplayValues(item, listViewConfig)
        return (
          displayValues.title.toLowerCase().includes(query) ||
          displayValues.description.toLowerCase().includes(query) ||
          displayValues.type.toLowerCase().includes(query) ||
          item.id.toLowerCase().includes(query)
        )
      })
    }

    // Apply type filter
    if (filterOptions?.typeField && selectedFilters.length > 0) {
      filtered = filtered.filter((item) => {
        const value = String(item[filterOptions.typeField!]).toLowerCase()
        return selectedFilters.includes(value)
      })
    }

    return filtered
  }, [items, searchQuery, selectedFilters, listViewConfig, filterOptions])

  // Build filter categories for DaFilter
  const filterCategories = useMemo(() => {
    if (!filterOptions?.typeOptions || filterOptions.typeOptions.length === 0) {
      return {}
    }
    return {
      Type: filterOptions.typeOptions,
    }
  }, [filterOptions])

  const handleFilterChange = (selectedOptions: string[]) => {
    setSelectedFilters(selectedOptions.map(opt => opt.toLowerCase()))
  }

  // Convert selectedFilters back to original case for DaFilter
  const filterDefaultValue = useMemo(() => {
    if (selectedFilters.length === 0 && filterOptions?.typeOptions) {
      return filterOptions.typeOptions // Return all options in original case
    }
    // Map selectedFilters (lowercase) back to original case from typeOptions
    return selectedFilters
      .map(lowercase => {
        const original = filterOptions?.typeOptions?.find(opt => opt.toLowerCase() === lowercase)
        return original || lowercase
      })
      .filter(Boolean)
  }, [selectedFilters, filterOptions?.typeOptions])

  return (
    <div className="flex flex-col h-full min-h-0 p-3">
      {/* Top Row: Search, Filter */}
      <div className="mb-2 flex items-center shrink-0">
        <div className="relative w-full mr-2">
          <TbSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search APIs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-full"
          />
        </div>
        {filterOptions && filterOptions.typeOptions && filterOptions.typeOptions.length > 0 && (
          <DaFilter
            categories={filterCategories}
            onChange={handleFilterChange}
            className="w-full"
            defaultValue={filterDefaultValue}
          />
        )}
      </div>

      {/* List Items */}
      <div className="flex flex-1 flex-col min-h-0">
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-[200px]">
              <Spinner className="mr-2" />
              <span className="text-sm font-medium text-muted-foreground">Loading API List...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex w-full h-full items-center justify-center mb-24">
              <div className="text-sm font-medium flex justify-center mt-6">
                {searchQuery || selectedFilters.length < (filterOptions?.typeOptions?.length || 0)
                  ? 'No signal found'
                  : 'No items yet.'}
              </div>
            </div>
          ) : (
            filteredItems.map((item) => {
              const displayValues = getListViewDisplayValues(item, listViewConfig)
              const isSelected = selectedItemId === item.id
              const typeColor = displayValues.type ? getTypeColor(displayValues.type, schema) : undefined

              // Render based on list view style
              if (listViewStyle === 'badge-image') {
                // Badge-image style: type badge on left, title/description in middle, image on right
                return (
                  <TooltipProvider key={item.id}>
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <div
                          onClick={() => onSelectItem(item.id)}
                          className={cn(
                            'signal-list-item flex w-full min-w-full py-1.5 text-muted-foreground cursor-pointer hover:bg-primary/10 items-center px-2 rounded gap-2',
                            isSelected ? 'bg-primary/10 text-primary' : '',
                          )}
                        >
                          {/* Type badge on left */}
                          {displayValues.type && (
                            <div 
                              className="px-2 py-0.5 rounded text-xs font-medium text-white shrink-0"
                              style={{ backgroundColor: typeColor || '#6b7280' }}
                            >
                              {displayValues.type.toUpperCase()}
                            </div>
                          )}
                          {/* Title and description in middle */}
                          <div className="flex flex-1 flex-col min-w-0 cursor-pointer">
                            <div
                              className={cn(
                                'signal-list-item-name text-sm cursor-pointer truncate',
                                isSelected ? 'font-medium' : 'font-normal',
                              )}
                            >
                              {displayValues.title}
                            </div>
                            {displayValues.description && (
                              <div className="text-xs text-muted-foreground truncate">
                                {displayValues.description}
                              </div>
                            )}
                          </div>
                          {/* Image on right - always show container in badge-image style */}
                          <div 
                            className={cn(
                              "h-8 w-16 shrink-0 flex items-center justify-center overflow-hidden rounded bg-muted/30",
                              providerUrl && footerImage && footerImage.trim() && "cursor-pointer hover:bg-muted/50 transition-colors"
                            )}
                            style={{ aspectRatio: '2/1' }}
                            onClick={(e) => {
                              if (providerUrl && providerUrl.trim()) {
                                e.stopPropagation()
                                window.open(providerUrl, '_blank', 'noopener,noreferrer')
                              }
                            }}
                          >
                            {footerImage && footerImage.trim() ? (
                              <img
                                src={footerImage}
                                alt="API Instance Logo"
                                className="h-full w-full object-contain p-0.5"
                                onError={(e) => {
                                  console.error('Failed to load footer image:', footerImage, 'Error:', e)
                                  // Show placeholder on error
                                  const container = e.currentTarget.parentElement
                                  if (container) {
                                    container.innerHTML = '<span class="text-xs text-muted-foreground">No img</span>'
                                  }
                                }}
                                onLoad={() => {
                                  console.log('Footer image loaded successfully:', footerImage)
                                }}
                              />
                            ) : (
                              <span className="text-xs text-muted-foreground">No img</span>
                            )}
                          </div>
                          {/* Delete button on far right */}
                          {mode === 'edit' && onDeleteItem && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                onDeleteItem(item.id)
                              }}
                              disabled={deletingItemId === item.id}
                            >
                              {deletingItemId === item.id ? (
                                <Spinner className="h-4 w-4" />
                              ) : (
                                <TbTrash className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TooltipTrigger>
                      {displayValues.description && (
                        <TooltipContent>
                          <p>{displayValues.description}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                )
              } else if (listViewStyle === 'badge') {
                // Badge style: type badge on left, title/description on right
                return (
                  <TooltipProvider key={item.id}>
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <div
                          onClick={() => onSelectItem(item.id)}
                          className={cn(
                            'signal-list-item flex w-full min-w-full py-1.5 text-muted-foreground cursor-pointer hover:bg-primary/10 items-center px-2 rounded gap-2',
                            isSelected ? 'bg-primary/10 text-primary' : '',
                          )}
                        >
                          {/* Type badge on left */}
                          {displayValues.type && (
                            <div 
                              className="px-2 py-0.5 rounded text-xs font-medium text-white shrink-0"
                              style={{ backgroundColor: typeColor || '#6b7280' }}
                            >
                              {displayValues.type.toUpperCase()}
                            </div>
                          )}
                          {/* Title and description on right */}
                          <div className="flex flex-1 flex-col min-w-0 cursor-pointer">
                            <div
                              className={cn(
                                'signal-list-item-name text-sm cursor-pointer truncate',
                                isSelected ? 'font-medium' : 'font-normal',
                              )}
                            >
                              {displayValues.title}
                            </div>
                            {displayValues.description && (
                              <div className="text-xs text-muted-foreground truncate">
                                {displayValues.description}
                              </div>
                            )}
                          </div>
                          {/* Delete button on far right */}
                          {mode === 'edit' && onDeleteItem && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                onDeleteItem(item.id)
                              }}
                              disabled={deletingItemId === item.id}
                            >
                              {deletingItemId === item.id ? (
                                <Spinner className="h-4 w-4" />
                              ) : (
                                <TbTrash className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TooltipTrigger>
                      {displayValues.description && (
                        <TooltipContent>
                          <p>{displayValues.description}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                )
              } else {
                // Compact style (default): title on left, type on right
                return (
                  <TooltipProvider key={item.id}>
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <div
                          onClick={() => onSelectItem(item.id)}
                          className={cn(
                            'signal-list-item flex w-full min-w-full justify-between py-1.5 text-muted-foreground cursor-pointer hover:bg-primary/10 items-center px-2 rounded',
                            isSelected ? 'bg-primary/10 text-primary' : '',
                          )}
                        >
                          <div className="flex flex-1 truncate cursor-pointer items-center">
                            <div
                              className={cn(
                                'signal-list-item-name text-sm cursor-pointer truncate',
                                isSelected ? 'font-medium' : 'font-normal',
                              )}
                            >
                              {displayValues.title}
                            </div>
                          </div>
                          <div className="flex w-fit justify-end cursor-pointer pl-4 items-center gap-2">
                            {displayValues.type && (
                              <div 
                                className="uppercase text-sm font-medium cursor-pointer"
                                style={{ color: typeColor }}
                              >
                                {displayValues.type}
                              </div>
                            )}
                            {mode === 'edit' && onDeleteItem && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onDeleteItem(item.id)
                                }}
                                disabled={deletingItemId === item.id}
                              >
                                {deletingItemId === item.id ? (
                                  <Spinner className="h-4 w-4" />
                                ) : (
                                  <TbTrash className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </TooltipTrigger>
                      {displayValues.description && (
                        <TooltipContent>
                          <p>{displayValues.description}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                )
              }
            })
          )}
        </div>
        
        {/* Footer Image - only show if not using badge-image style (images shown per item) */}
        {footerImage && listViewStyle !== 'badge-image' && (
          <div className="w-full h-[60px] shrink-0 mt-2 overflow-hidden rounded-md">
            <img
              src={footerImage}
              alt="API Instance Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none'
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default CustomAPIList

