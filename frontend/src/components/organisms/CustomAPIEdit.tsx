// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useMemo, useState } from 'react'
import { Button } from '@/components/atoms/button'
import DynamicSchemaForm from '@/components/molecules/DynamicSchemaForm'
import { DaImage } from '@/components/atoms/DaImage'
import DaImportFile from '@/components/atoms/DaImportFile'
import { uploadFileService } from '@/services/upload.service'
import { useToast } from '@/components/molecules/toaster/use-toast'
import { TbPhotoEdit } from 'react-icons/tb'

interface CustomAPIEditProps {
  item: any
  schema: string | object
  itemId: string
  onChange: (data: any) => void
  onSave?: () => void
  onCancel?: () => void
  excludeFields?: string[]
  isSaving?: boolean
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

const CustomAPIEdit: React.FC<CustomAPIEditProps> = ({
  item,
  schema,
  itemId,
  onChange,
  onSave,
  onCancel,
  excludeFields = ['id', 'parent_id', 'relationships'],
  isSaving = false,
}) => {
  const { toast } = useToast()
  const [uploadingImage, setUploadingImage] = useState(false)

  // Extract image field name from schema
  const imageField = useMemo(() => extractImageField(schema), [schema])
  
  // Get image URL from item
  const imageUrl = useMemo(() => {
    if (!imageField || !item) return null
    const value = item[imageField]
    return value && typeof value === 'string' && value.trim() ? value.trim() : null
  }, [imageField, item])

  const handleImageUpload = async (file: File) => {
    if (!imageField) return
    
    try {
      setUploadingImage(true)
      const { url } = await uploadFileService(file)
      const updatedData = { ...item, [imageField]: url }
      onChange(updatedData)
      toast({
        title: 'Image uploaded',
        description: 'Image uploaded successfully',
      })
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error?.message || 'Failed to upload image',
        variant: 'destructive',
      })
    } finally {
      setUploadingImage(false)
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Fixed Title */}
      <div className="flex items-center justify-between shrink-0 pb-4 border-b border-border px-4 pt-4">
        <h3 className="text-lg font-semibold">{itemId || 'New API'}</h3>
      </div>

      {/* Image Upload Section */}
      {imageField && (
        <div className="shrink-0 border-b border-border">
          {imageUrl ? (
            <div className="relative w-full">
              <DaImage
                src={imageUrl}
                alt={itemId || 'API Image'}
                className="object-contain max-h-[340px] min-h-[200px] w-full"
              />
              <DaImportFile
                onFileChange={handleImageUpload}
                accept="image/*"
                className="absolute top-2 right-2"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm shadow-sm hover:bg-background"
                  disabled={uploadingImage}
                >
                  {uploadingImage ? (
                    <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <TbPhotoEdit className="h-4 w-4" />
                  )}
                </Button>
              </DaImportFile>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] bg-muted">
              <DaImportFile
                onFileChange={handleImageUpload}
                accept="image/*"
              >
                <Button
                  variant="outline"
                  size="sm"
                  disabled={uploadingImage}
                >
                  {uploadingImage ? 'Uploading...' : 'Upload Image'}
                </Button>
              </DaImportFile>
            </div>
          )}
        </div>
      )}

      {/* Scrollable Content */}
      <div className="flex-1 min-h-0 overflow-y-auto py-4 pl-4 pr-4">
        <DynamicSchemaForm
          schema={schema}
          data={item}
          onChange={onChange}
          mode="edit"
          excludeFields={[...excludeFields, ...(imageField ? [imageField] : [])]}
        />
      </div>

      {/* Fixed Footer */}
      {(onSave || onCancel) && (
        <div className="flex items-center justify-end gap-2 shrink-0 pt-4 px-4 border-t border-border">
          {onCancel && (
            <Button variant="outline" onClick={onCancel} disabled={isSaving}>
              Cancel
            </Button>
          )}
          {onSave && (
            <Button onClick={onSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export default CustomAPIEdit

