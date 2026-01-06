// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/atoms/dialog'
import { Button } from '@/components/atoms/button'
import JsonEditor from '@/components/atoms/JsonEditor'
import { TbDownload, TbUpload } from 'react-icons/tb'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/molecules/toaster/use-toast'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getCustomApiSetById,
  addSetItem,
  updateSetItem,
  removeSetItem,
  updateCustomApiSet,
  type CustomApiSet,
  type CustomApiSetItem,
} from '@/services/customApiSet.service'
import { getCustomApiSchemaById, type CustomApiSchema } from '@/services/customApiSchema.service'
import { Spinner } from '@/components/atoms/spinner'
import DaImportFile from '@/components/atoms/DaImportFile'
import DynamicSchemaForm from '@/components/molecules/DynamicSchemaForm'
import { generateItemId, extractIdFormat, generateIdFromTemplate } from '@/utils/idTemplate'
import CustomAPIList from '@/components/organisms/CustomAPIList'
import CustomAPIView from '@/components/organisms/CustomAPIView'
import CustomAPIEdit from '@/components/organisms/CustomAPIEdit'

interface CustomApiSetItemEditorProps {
  open: boolean
  onClose: () => void
  instanceId: string
}

const CustomApiSetItemEditor: React.FC<CustomApiSetItemEditorProps> = ({
  open,
  onClose,
  instanceId,
}) => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'list' | 'json'>('list')
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [isNewItem, setIsNewItem] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [formData, setFormData] = useState<Partial<CustomApiSetItem>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const { data: set, isLoading: isLoadingSet } = useQuery({
    queryKey: ['custom-api-set', instanceId],
    queryFn: () => getCustomApiSetById(instanceId),
    enabled: open && !!instanceId,
  })

  // Extract custom_api_schema ID - handle both populated object and string ID
  const customApiSchemaId = set?.custom_api_schema 
    ? (typeof set.custom_api_schema === 'string' 
        ? set.custom_api_schema 
        : (set.custom_api_schema as any).id || (set.custom_api_schema as any)._id || set.custom_api_schema)
    : null

  const { data: customApiSchema, isLoading: isLoadingSchema } = useQuery({
    queryKey: ['custom-api-schema', customApiSchemaId],
    queryFn: () => getCustomApiSchemaById(customApiSchemaId!),
    enabled: !!customApiSchemaId && open,
  })

  const items = set?.data?.items || []
  const selectedItem = selectedItemId ? items.find((item) => item.id === selectedItemId) : null

  // Initialize form when selecting an item
  useEffect(() => {
    if (selectedItem && !isNewItem) {
      setFormData({ ...selectedItem })
      setIsEditMode(false) // Start in view mode when selecting existing item
    } else if (isNewItem) {
      // Initialize new item with basic required fields
      const newItem: Partial<CustomApiSetItem> = {
        id: '',
        relationships: [],
      }
      setFormData(newItem)
      setIsEditMode(true) // Start in edit mode for new items
    }
  }, [selectedItem, isNewItem, customApiSchema])

  // Reset edit mode when item changes
  useEffect(() => {
    if (!selectedItemId && !isNewItem) {
      setIsEditMode(false)
    }
  }, [selectedItemId, isNewItem])

  const handleSelectItem = (itemId: string | null) => {
    setSelectedItemId(itemId)
    setIsNewItem(false)
    setIsEditMode(false) // Start in view mode
  }

  const handleNewItem = () => {
    setSelectedItemId(null)
    setIsNewItem(true)
    setIsEditMode(true) // Start in edit mode for new items
    
    // Initialize with empty data
    const newItem: Partial<CustomApiSetItem> = {
      id: '',
      relationships: [],
    }
    
    // Try to generate ID from schema format if available
    if (customApiSchema?.schema) {
      const idFormat = extractIdFormat(customApiSchema.schema)
      if (idFormat) {
        // Generate ID from template (will be empty initially but will update as fields are filled)
        const generatedId = generateIdFromTemplate(idFormat, newItem)
        if (generatedId) {
          newItem.id = generatedId
        }
      }
    }
    
    setFormData(newItem)
  }

  const handleEditClick = () => {
    setIsEditMode(true)
  }

  const handleCancelEdit = () => {
    // Reset form data to original item data
    if (selectedItem) {
      setFormData({ ...selectedItem })
    }
    setIsEditMode(false)
  }

  const handleFormChange = (field: string, value: any) => {
    const newFormData = { ...formData, [field]: value }
    
    // Auto-generate ID if id_format is defined in schema and ID is empty or being edited
    if (customApiSchema?.schema && (!formData.id || field !== 'id' || isNewItem)) {
      const idFormat = extractIdFormat(customApiSchema.schema)
      if (idFormat) {
        const generatedId = generateIdFromTemplate(idFormat, newFormData)
        if (generatedId) {
          // Only auto-update ID if it's a new item or ID is currently empty
          if (isNewItem || !formData.id) {
            newFormData.id = generatedId
          }
        }
      }
    }
    
    setFormData(newFormData)
  }


  const validateItem = (): boolean => {
    if (!formData.id?.trim()) {
      toast({
        title: 'Validation failed',
        description: 'ID is required',
        variant: 'destructive',
      })
      return false
    }

    // TODO: Validate against JSON schema if schema validation library is added
    // For now, basic validation: ensure id is present

    // Check if ID already exists (only for new items)
    if (isNewItem && items.some((item) => item.id === formData.id)) {
      toast({
        title: 'Validation failed',
        description: `Item with ID '${formData.id}' already exists`,
        variant: 'destructive',
      })
      return false
    }

    return true
  }

  const handleSaveItem = async () => {
    if (!validateItem()) {
      return
    }

    try {
      setIsSaving(true)
      if (isNewItem) {
        await addSetItem(instanceId, formData as CustomApiSetItem)
        toast({
          title: 'Added',
          description: 'Item added successfully',
        })
      } else if (selectedItemId) {
        await updateSetItem(instanceId, selectedItemId, formData)
        toast({
          title: 'Updated',
          description: 'Item updated successfully',
        })
      }
      queryClient.invalidateQueries({ queryKey: ['custom-api-set', instanceId] })
      queryClient.invalidateQueries({ queryKey: ['custom-api-sets'] })
      setIsNewItem(false)
      setSelectedItemId(formData.id as string)
    } catch (error: any) {
      toast({
        title: isNewItem ? 'Add failed' : 'Update failed',
        description: error?.response?.data?.message || error?.message || 'Failed to save item',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm(`Delete item "${itemId}"?`)) return

    try {
      setIsDeleting(itemId)
      await removeSetItem(instanceId, itemId)
      toast({
        title: 'Deleted',
        description: 'Item deleted successfully',
      })
      queryClient.invalidateQueries({ queryKey: ['custom-api-set', instanceId] })
      queryClient.invalidateQueries({ queryKey: ['custom-api-sets'] })
      if (selectedItemId === itemId) {
        setSelectedItemId(null)
        setIsNewItem(false)
      }
    } catch (error: any) {
      toast({
        title: 'Delete failed',
        description: error?.response?.data?.message || error?.message || 'Failed to delete item',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(null)
    }
  }

  const handleExportItems = () => {
    if (items.length === 0) {
      toast({
        title: 'No items to export',
        description: 'Please add items before exporting',
        variant: 'destructive',
      })
      return
    }

    const jsonString = JSON.stringify(items, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `api-set-items-${instanceId}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: 'Exported',
      description: `Exported ${items.length} item(s) to JSON file`,
    })
  }


  const handleImportItems = async (file: File) => {
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)

      if (!Array.isArray(parsed)) {
        toast({
          title: 'Import failed',
          description: 'Imported file must contain an array of items',
          variant: 'destructive',
        })
        return
      }

      // Get existing IDs from current instance to check for duplicates
      const existingIds = new Set<string>(items.map(item => item.id))
      
      // Auto-generate IDs for items that don't have them, using schema id_format
      const itemsWithIds = parsed.map((item, index) => {
        const generatedId = generateItemId(item, index, existingIds, customApiSchema?.schema)
        existingIds.add(generatedId) // Add to set to ensure uniqueness within import batch
        return { ...item, id: generatedId }
      })

      // Add each item
      for (const item of itemsWithIds) {
        await addSetItem(instanceId, item)
      }

      toast({
        title: 'Imported',
        description: `Imported ${itemsWithIds.length} item(s) successfully`,
      })
      queryClient.invalidateQueries({ queryKey: ['custom-api-set', instanceId] })
      queryClient.invalidateQueries({ queryKey: ['custom-api-sets'] })
    } catch (error: any) {
      console.error('Import error:', error)
      toast({
        title: 'Import failed',
        description: error?.message || 'Failed to import items. Please check the JSON format.',
        variant: 'destructive',
      })
    }
  }

  // Extract method enum from schema for filter options
  const getMethodOptions = (): string[] => {
    if (!customApiSchema?.schema) return []
    try {
      const schemaObj = typeof customApiSchema.schema === 'string' 
        ? JSON.parse(customApiSchema.schema) 
        : customApiSchema.schema
      
      // Handle array schema
      const itemSchema = schemaObj.type === 'array' ? schemaObj.items : schemaObj
      const methodProperty = itemSchema?.properties?.method
      
      if (methodProperty?.enum) {
        return methodProperty.enum
      }
      
      return []
    } catch {
      return []
    }
  }

  const [jsonItems, setJsonItems] = useState<CustomApiSetItem[]>([])

  useEffect(() => {
    if (items) {
      setJsonItems(items)
    }
  }, [items, activeTab])

  const handleJsonChange = (newItems: CustomApiSetItem[]) => {
    setJsonItems(newItems)
  }

  const handleSaveJson = async () => {
    // Validate items before saving
    if (!Array.isArray(jsonItems)) {
      toast({
        title: 'Invalid format',
        description: 'Items must be an array',
        variant: 'destructive',
      })
      return
    }

    // Get existing IDs to check for duplicates
    const existingIds = new Set<string>()
    
    // Auto-generate IDs for items that don't have them, using schema id_format
    const itemsWithIds = jsonItems.map((item, index) => {
      const generatedId = generateItemId(item, index, existingIds, customApiSchema?.schema)
      existingIds.add(generatedId)
      return { ...item, id: generatedId }
    })

    try {
      setIsSaving(true)
      // Update the entire items array via set update
      await updateCustomApiSet(instanceId, {
        data: {
          items: itemsWithIds,
          metadata: set?.data?.metadata || {},
        },
      })
      
      toast({
        title: 'Updated',
        description: `Updated ${itemsWithIds.length} item(s)`,
      })
      queryClient.invalidateQueries({ queryKey: ['custom-api-set', instanceId] })
      queryClient.invalidateQueries({ queryKey: ['custom-api-sets'] })
    } catch (error: any) {
      toast({
        title: 'Update failed',
        description: error?.response?.data?.message || error?.message || 'Failed to update items',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoadingSet || isLoadingSchema) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="w-[90vw] h-[90vh] max-w-none max-h-none">
          <div className="flex justify-center items-center h-full">
            <Spinner />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!set || !customApiSchema) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] h-[90vh] max-w-none max-h-none flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>
            Edit Child APIs - {set.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center justify-between border-b border-border shrink-0 pb-2 mb-2">
            <div className="flex">
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className={cn(
                  'flex h-full text-sm font-semibold items-center justify-center min-w-20 cursor-pointer hover:opacity-80 border-b-2 border-transparent py-0.5 px-2',
                  activeTab === 'list'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground',
                )}
              >
                List Mode
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('json')}
                className={cn(
                  'flex h-full text-sm font-semibold items-center justify-center min-w-20 cursor-pointer hover:opacity-80 border-b-2 border-transparent py-0.5 px-2',
                  activeTab === 'json'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground',
                )}
              >
                JSON Mode
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleExportItems}
              >
                <TbDownload className="mr-2 h-4 w-4" />
                Export
              </Button>
              <DaImportFile
                accept="application/json"
                onFileChange={handleImportItems}
              >
                <Button type="button" variant="outline" size="sm">
                  <TbUpload className="mr-2 h-4 w-4" />
                  Import
                </Button>
              </DaImportFile>
            </div>
          </div>

          {activeTab === 'list' && (
            <div className="flex flex-1 min-h-0 gap-4">
              {/* Left: Item List */}
              <div className="w-1/2 border-r border-border pr-4 flex flex-col min-h-0">
                <CustomAPIList
                  items={items}
                  selectedItemId={selectedItemId}
                  onSelectItem={handleSelectItem}
                  onDeleteItem={handleDeleteItem}
                  onCreateNew={handleNewItem}
                  schema={customApiSchema}
                  mode="edit"
                  isLoading={isLoadingSet || isLoadingSchema}
                  deletingItemId={isDeleting}
                  filterOptions={{
                    typeField: 'method',
                    typeOptions: getMethodOptions(),
                  }}
                />
              </div>

              {/* Right: Form */}
              <div className="w-1/2 pl-4 flex flex-col min-h-0">
                {(selectedItem || isNewItem) && customApiSchema?.schema ? (
                  isEditMode ? (
                    <CustomAPIEdit
                      item={formData}
                      schema={customApiSchema.schema}
                      itemId={isNewItem ? 'New API' : selectedItem?.id || 'No ID'}
                      onChange={setFormData}
                      onSave={handleSaveItem}
                      onCancel={isNewItem ? undefined : handleCancelEdit}
                      isSaving={isSaving}
                      excludeFields={['id', 'path', 'parent_id', 'relationships']}
                    />
                  ) : (
                    <CustomAPIView
                      item={formData}
                      schema={customApiSchema.schema}
                      itemId={selectedItem?.id || 'No ID'}
                      onEdit={handleEditClick}
                      excludeFields={['id', 'path', 'parent_id', 'relationships']}
                    />
                  )
                ) : (
                  <div className="text-center py-12 text-sm text-muted-foreground">
                    {!customApiSchema?.schema
                      ? 'No schema defined for this API. Fields can be added via JSON mode.'
                      : 'Select an item from the list or click "New API" to create one.'}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'json' && (
            <div className="flex flex-col flex-1 min-h-0">
              <div className="mb-2 shrink-0">
                <Button onClick={handleSaveJson} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
              <JsonEditor
                value={jsonItems}
                onChange={handleJsonChange}
                valueType="array"
                className="flex-1 min-h-0"
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CustomApiSetItemEditor

