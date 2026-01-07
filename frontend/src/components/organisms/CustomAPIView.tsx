// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useMemo } from 'react'
import { Button } from '@/components/atoms/button'
import DynamicSchemaForm from '@/components/molecules/DynamicSchemaForm'
import { DaImage } from '@/components/atoms/DaImage'
import { DaCopy } from '@/components/atoms/DaCopy'
import {
  TbEdit,
  TbTrash,
} from 'react-icons/tb'
import DaActionButtons, { type ActionButtonItem } from '@/components/atoms/DaActionButtons'

interface CustomAPIViewProps {
  item: any
  schema: string | object
  itemId: string
  onEdit?: () => void
  onDelete?: () => void
  excludeFields?: string[]
  showActions?: boolean
}

/**
 * Extract image field name from schema
 * Supports:
 * - display_mapping.image mapping (e.g., "image": "Image" means field "Image" is the image field)
 * - Schema property 'image_field' or 'image_mapping' that maps other fields (e.g., 'icon', 'avatar') to image
 * - Direct 'image' field
 * - Common image field names
 */
const extractImageField = (schema: string | object): string | null => {
  try {
    const schemaObj = typeof schema === 'string' ? JSON.parse(schema) : schema
    
    // Check if schema is an array with items
    const itemSchema = schemaObj.type === 'array' ? schemaObj.items : schemaObj
    
    // FIRST: Check display_mapping.image mapping (highest priority)
    // This is where users configure which field should be used as image
    if (itemSchema?.display_mapping?.image) {
      const imageFieldName = itemSchema.display_mapping.image
      // Verify that this field actually exists in properties
      if (itemSchema?.properties?.[imageFieldName]) {
        return imageFieldName
      }
    }
    
    // SECOND: Check for image_field or image_mapping in schema
    if (itemSchema?.image_field) {
      return itemSchema.image_field
    }
    if (itemSchema?.image_mapping) {
      return itemSchema.image_mapping
    }
    
    // THIRD: Check if 'image' field exists in properties (case-insensitive)
    const properties = itemSchema?.properties || {}
    const imageFieldLower = Object.keys(properties).find(
      key => key.toLowerCase() === 'image'
    )
    if (imageFieldLower) {
      return imageFieldLower
    }
    
    // FOURTH: Check for common image field names (case-insensitive)
    const commonImageFields = ['image', 'icon', 'avatar', 'img', 'picture', 'photo']
    for (const commonField of commonImageFields) {
      const foundField = Object.keys(properties).find(
        key => key.toLowerCase() === commonField.toLowerCase()
      )
      if (foundField) {
        return foundField
      }
    }
    
    return null
  } catch {
    return null
  }
}

const CustomAPIView: React.FC<CustomAPIViewProps> = ({
  item,
  schema,
  itemId,
  onEdit,
  onDelete,
  excludeFields = ['id', 'parent_id', 'relationships'],
  showActions = true,
}) => {
  // Extract image field name from schema
  const imageField = useMemo(() => extractImageField(schema), [schema])
  
  // Get image URL from item
  const imageUrl = useMemo(() => {
    if (!imageField || !item) return null
    const value = item[imageField]
    return value && typeof value === 'string' && value.trim() ? value.trim() : null
  }, [imageField, item])

  // Build actions array
  const actions = useMemo(() => {
    const actionItems: ActionButtonItem[] = []
    if (onEdit) {
      actionItems.push({
        label: 'Edit API',
        icon: <TbEdit className="h-5 w-5" />,
        onClick: onEdit,
      })
    }
    if (onDelete) {
      actionItems.push({
        label: 'Delete API',
        icon: <TbTrash className="h-5 w-5" />,
        onClick: onDelete,
      })
    }
    return actionItems
  }, [onEdit, onDelete])

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Image Display - Topmost */}
      {imageUrl && (
        <div className="shrink-0 border-b border-border">
          <DaImage
            src={imageUrl}
            alt={itemId}
            className="object-contain max-h-[340px] min-h-[200px] w-full"
          />
        </div>
      )}

      {/* Header with ID and Actions - Title Row */}
      <div className="flex h-fit w-full flex-row items-center justify-between space-x-2 bg-primary/10 py-2 pr-2 shrink-0">
        <div className="pl-4">
          <DaCopy textToCopy={itemId}>
            <div className="text-sm font-medium truncate text-primary">
              {itemId}
            </div>
          </DaCopy>
        </div>
        {showActions && actions.length > 0 && (
          <DaActionButtons actions={actions} variant="default" size="sm" />
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 min-h-0 overflow-y-auto py-4 pl-4 pr-4">
        <DynamicSchemaForm
          schema={schema}
          data={item}
          onChange={() => {}} // No-op in view mode
          mode="view"
          excludeFields={[...excludeFields, ...(imageField ? [imageField] : [])]}
        />
      </div>
    </div>
  )
}

export default CustomAPIView

