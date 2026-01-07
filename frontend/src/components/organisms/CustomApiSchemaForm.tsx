// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/atoms/dialog'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { Label } from '@/components/atoms/label'
import { Textarea } from '@/components/atoms/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/atoms/select'
import CodeEditor from '@/components/molecules/CodeEditor'
import { cn } from '@/lib/utils'
import { getTypeColor } from '@/utils/typeColors'
import { TbPhoto } from 'react-icons/tb'
import type { CustomApiSchema } from '@/services/customApiSchema.service'

// Skeleton data for preview
const SKELETON_ITEMS = [
  { id: 'GET:/api/users', method: 'GET', path: '/api/users', summary: 'Get list of users' },
  { id: 'POST:/api/users', method: 'POST', path: '/api/users', summary: 'Create a new user' },
  { id: 'PUT:/api/users/1', method: 'PUT', path: '/api/users/1', summary: 'Update user details' },
]

interface ListViewStyleConfiguratorProps {
  schema: any
  onStyleChange: (style: 'compact' | 'badge' | 'badge-image') => void
}

const ListViewStyleConfigurator: React.FC<ListViewStyleConfiguratorProps> = ({
  schema,
  onStyleChange,
}) => {
  // Extract current style from schema
  const currentStyle: 'compact' | 'badge' | 'badge-image' = 
    (schema?.type === 'array' && schema?.items?.display_mapping?.style) ||
    schema?.display_mapping?.style ||
    'compact'

  // Extract display mapping for display values
  const displayMapping = 
    (schema?.type === 'array' && schema?.items?.display_mapping) ||
    schema?.display_mapping ||
    { title: '{method}:{path}', description: 'summary', type: 'method' }

  const getDisplayValues = (item: any) => {
    const renderField = (template: string | null | undefined): string => {
      if (!template || !template.trim()) return ''
      const templateStr = template.trim()
      if (templateStr.includes('{') && templateStr.includes('}')) {
        return templateStr.replace(/\{(\w+)\}/g, (match, fieldName) => {
          return String(item[fieldName] || '')
        })
      }
      return String(item[templateStr] || '')
    }
    return {
      title: renderField(displayMapping.title) || item.id || '',
      description: renderField(displayMapping.description) || '',
      type: renderField(displayMapping.type) || item.method || '',
    }
  }

  const renderPreviewItem = (
    item: any,
    style: 'compact' | 'badge' | 'badge-image',
    isSelected: boolean
  ) => {
    const displayValues = getDisplayValues(item)
    const typeColor = getTypeColor(displayValues.type, schema)

    if (style === 'badge-image') {
      return (
        <div
          className={cn(
            'flex w-full py-1.5 text-muted-foreground items-center px-2 rounded gap-2 border',
            isSelected ? 'border-primary bg-primary/5' : 'border-border bg-background',
          )}
        >
          {displayValues.type && (
            <div
              className="px-2 py-0.5 rounded text-xs font-medium text-white shrink-0"
              style={{ backgroundColor: typeColor || '#6b7280' }}
            >
              {displayValues.type.toUpperCase()}
            </div>
          )}
          <div className="flex flex-1 flex-col min-w-0">
            <div className="text-sm font-normal truncate">{displayValues.title}</div>
            {displayValues.description && (
              <div className="text-xs text-muted-foreground truncate">
                {displayValues.description}
              </div>
            )}
          </div>
          <div className="h-8 w-16 shrink-0 flex items-center justify-center overflow-hidden rounded bg-muted/30" style={{ aspectRatio: '2/1' }}>
            <TbPhoto className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      )
    } else if (style === 'badge') {
      return (
        <div
          className={cn(
            'flex w-full py-1.5 text-muted-foreground items-center px-2 rounded gap-2 border',
            isSelected ? 'border-primary bg-primary/5' : 'border-border bg-background',
          )}
        >
          {displayValues.type && (
            <div
              className="px-2 py-0.5 rounded text-xs font-medium text-white shrink-0"
              style={{ backgroundColor: typeColor || '#6b7280' }}
            >
              {displayValues.type.toUpperCase()}
            </div>
          )}
          <div className="flex flex-1 flex-col min-w-0">
            <div className="text-sm font-normal truncate">{displayValues.title}</div>
            {displayValues.description && (
              <div className="text-xs text-muted-foreground truncate">
                {displayValues.description}
              </div>
            )}
          </div>
        </div>
      )
    } else {
      // compact
      return (
        <div
          className={cn(
            'flex w-full justify-between py-1.5 text-muted-foreground items-center px-2 rounded border',
            isSelected ? 'border-primary bg-primary/5' : 'border-border bg-background',
          )}
        >
          <div className="flex flex-1 truncate">
            <div className="text-sm font-normal truncate">{displayValues.title}</div>
          </div>
          {displayValues.type && (
            <div
              className="uppercase text-sm font-medium ml-4"
              style={{ color: typeColor }}
            >
              {displayValues.type}
            </div>
          )}
        </div>
      )
    }
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Select a list view style to preview how your API items will be displayed:
        </p>

        {/* Grid layout for all styles */}
        <div className="grid grid-cols-3 gap-4">
          {/* Compact Style */}
          <div className="space-y-2">
            <div 
              className="flex items-center space-x-2 cursor-pointer"
              onClick={() => onStyleChange('compact')}
            >
              <input
                type="radio"
                name="list-view-style"
                value="compact"
                checked={currentStyle === 'compact'}
                onChange={() => onStyleChange('compact')}
                className="h-4 w-4 text-primary focus:ring-primary"
              />
              <Label className="text-sm font-semibold cursor-pointer">
                Compact
              </Label>
            </div>
            <div className="space-y-1 p-3 border border-border rounded-md bg-muted/30">
              {SKELETON_ITEMS.map((item) => renderPreviewItem(item, 'compact', currentStyle === 'compact'))}
            </div>
          </div>

          {/* Badge Style */}
          <div className="space-y-2">
            <div 
              className="flex items-center space-x-2 cursor-pointer"
              onClick={() => onStyleChange('badge')}
            >
              <input
                type="radio"
                name="list-view-style"
                value="badge"
                checked={currentStyle === 'badge'}
                onChange={() => onStyleChange('badge')}
                className="h-4 w-4 text-primary focus:ring-primary"
              />
              <Label className="text-sm font-semibold cursor-pointer">
                Badge
              </Label>
            </div>
            <div className="space-y-1 p-3 border border-border rounded-md bg-muted/30">
              {SKELETON_ITEMS.map((item) => renderPreviewItem(item, 'badge', currentStyle === 'badge'))}
            </div>
          </div>

          {/* Badge Image Style */}
          <div className="space-y-2">
            <div 
              className="flex items-center space-x-2 cursor-pointer"
              onClick={() => onStyleChange('badge-image')}
            >
              <input
                type="radio"
                name="list-view-style"
                value="badge-image"
                checked={currentStyle === 'badge-image'}
                onChange={() => onStyleChange('badge-image')}
                className="h-4 w-4 text-primary focus:ring-primary"
              />
              <Label className="text-sm font-semibold cursor-pointer">
                Badge with Image
              </Label>
            </div>
            <div className="space-y-1 p-3 border border-border rounded-md bg-muted/30">
              {SKELETON_ITEMS.map((item) => renderPreviewItem(item, 'badge-image', currentStyle === 'badge-image'))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface CustomApiSchemaFormProps {
  open: boolean
  onClose: () => void
  onSave: (data: Partial<CustomApiSchema>) => Promise<void>
  initialData?: CustomApiSchema
}

const CustomApiSchemaForm: React.FC<CustomApiSchemaFormProps> = ({
  open,
  onClose,
  onSave,
  initialData,
}) => {
  const [formData, setFormData] = useState<Partial<CustomApiSchema>>({
    name: '',
    description: '',
    type: 'list',
    schema: '',
    code: '',
    version: '1.0.0',
    is_active: true,
  })
  const [schemaError, setSchemaError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState<'json' | 'style'>('json')

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        type: initialData.type || 'list',
        schema: initialData.schema || '',
        id_format: initialData.id_format || null,
        display_mapping: initialData.display_mapping || null,
        code: initialData.code || '',
        is_active: initialData.is_active ?? true,
      })
    } else {
      // Pre-populate with sample REST API JSON schema for create mode
      const sampleSchema = JSON.stringify({
        $schema: 'http://json-schema.org/draft-07/schema#',
        $id: 'https://example.com/sample-apis.schema.json',
        title: 'Sample APIs Schema',
        description: 'Schema for validating API endpoint definitions',
        type: 'array',
        items: {
          type: 'object',
          id_format: '{method}:{path}',
          display_mapping: {
            title: 'path',
            description: 'summary',
            type: 'method',
          },
          properties: {
            path: {
              type: 'string',
              description: 'API endpoint path (e.g., /api/v1/users)',
            },
            method: {
              type: 'string',
              enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
              description: 'HTTP method',
            },
            summary: {
              type: 'string',
              description: 'Brief summary of the API endpoint',
            },
            description: {
              type: 'string',
              description: 'Detailed description of the API endpoint',
            },
          },
          required: ['path', 'method'],
        },
      }, null, 2)
      
      setFormData({
        name: '',
        description: '',
        type: 'list',
        schema: sampleSchema,
        id_format: '{method}:{path}',
        display_mapping: {
          title: 'path',
          description: 'summary',
          type: 'method',
        },
        code: '',
        is_active: true,
      })
    }
    setErrors({})
    setSchemaError(null)
  }, [initialData, open])

  const generateCodeFromName = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s_-]/g, '') // Remove special chars except space, underscore, hyphen
      .replace(/\s+/g, '_') // Replace spaces with underscore
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
  }

  const handleChange = (field: keyof CustomApiSchema, value: any) => {
    const updates: Partial<CustomApiSchema> = { [field]: value }
    
    // Auto-generate code from name
    if (field === 'name' && !initialData) {
      updates.code = generateCodeFromName(value)
    }
    
    setFormData((prev) => ({ ...prev, ...updates }))
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const [schemaObject, setSchemaObject] = useState<any>({})

  useEffect(() => {
    if (formData.schema) {
      try {
        const parsed = JSON.parse(formData.schema)
        setSchemaObject(parsed)
        setSchemaError(null)
      } catch (error) {
        setSchemaError('Invalid JSON format')
        setSchemaObject({})
      }
    } else {
      setSchemaObject({})
    }
  }, [formData.schema])

  const handleSchemaChange = (schema: any) => {
    try {
      const schemaString = typeof schema === 'string' ? schema : JSON.stringify(schema, null, 2)
      // Validate it's valid JSON
      JSON.parse(schemaString)
      handleChange('schema', schemaString)
      setSchemaError(null)
    } catch (error) {
      setSchemaError('Invalid JSON format')
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required'
    }

    // Code is auto-generated, but validate if it exists
    if (formData.code) {
      // Validate code format (lowercase, alphanumeric, underscore, hyphen)
      const codeRegex = /^[a-z0-9_-]+$/
      if (!codeRegex.test(formData.code)) {
        newErrors.code = 'Generated code is invalid. Please check the name.'
      }
    }

    if (!formData.type) {
      newErrors.type = 'Type is required'
    }

    if (!formData.schema?.trim()) {
      newErrors.schema = 'JSON Schema is required'
    } else {
      // Validate schema is valid JSON
      try {
        JSON.parse(formData.schema)
      } catch (error) {
        newErrors.schema = 'Schema must be valid JSON'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validate()) {
      return
    }

    try {
      setIsSaving(true)
      await onSave({
        ...formData,
        code: formData.code?.toLowerCase().trim(),
      })
      onClose()
    } catch (error) {
      console.error('Save failed:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] h-[90vh] max-w-none max-h-none flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>
            {initialData ? 'Edit API Definition' : 'Create API Definition'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2 flex flex-col flex-1 min-h-0 overflow-y-auto">
          {/* Two-column layout: Name+Type in first column, Description in second column */}
          <div className="grid grid-cols-2 gap-4">
            {/* First column: Name and Type side by side */}
            <div className="space-y-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="name">
                    Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name || ''}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="e.g., REST API"
                    className={errors.name ? 'border-destructive' : ''}
                  />
                  {formData.code && (
                    <p className="text-xs text-muted-foreground font-mono mt-1">
                      Code: {formData.code}
                    </p>
                  )}
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name}</p>
                  )}
                  {errors.code && (
                    <p className="text-sm text-destructive">{errors.code}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="type">
                    Type <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: CustomApiSchema['type']) =>
                      handleChange('type', value)
                    }
                  >
                    <SelectTrigger id="type" className={`w-full ${errors.type ? 'border-destructive' : ''}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tree">Tree</SelectItem>
                      <SelectItem value="list">List</SelectItem>
                      <SelectItem value="graph">Graph</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.type && (
                    <p className="text-sm text-destructive">{errors.type}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Second column: Description */}
            <div className="space-y-1">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Optional description"
                rows={3}
              />
            </div>
          </div>

          <div className="space-y-1 flex flex-col flex-1 min-h-0">
            <Label htmlFor="schema">
              JSON Schema <span className="text-destructive">*</span>
            </Label>
            
            {/* Tabs */}
            <div className="flex items-center border-b border-border shrink-0 mb-2">
              <button
                type="button"
                onClick={() => setActiveTab('json')}
                className={cn(
                  'flex h-full text-sm font-semibold items-center justify-center min-w-20 cursor-pointer hover:opacity-80 border-b-2 border-transparent py-2 px-4',
                  activeTab === 'json'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground',
                )}
              >
                Raw JSON
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('style')}
                className={cn(
                  'flex h-full text-sm font-semibold items-center justify-center min-w-20 cursor-pointer hover:opacity-80 border-b-2 border-transparent py-2 px-4',
                  activeTab === 'style'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground',
                )}
              >
                List View Style
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'json' ? (
              <div className="flex-1 min-h-0 flex flex-col">
                <div className="flex-1 min-h-0 border border-border rounded-md overflow-hidden">
                  <CodeEditor
                    code={formData.schema || '{}'}
                    setCode={(code) => {
                      // Update schema string immediately for real-time editing
                      handleChange('schema', code)
                      // Try to parse and update schemaObject if valid
                      try {
                        const parsed = JSON.parse(code)
                        setSchemaObject(parsed)
                        setSchemaError(null)
                      } catch (error) {
                        // Allow invalid JSON during editing, but mark error
                        setSchemaError('Invalid JSON format')
                      }
                    }}
                    editable={true}
                    language="json"
                    onBlur={() => {
                      // Validate on blur
                      try {
                        const parsed = JSON.parse(formData.schema || '{}')
                        setSchemaObject(parsed)
                        setSchemaError(null)
                      } catch (error) {
                        setSchemaError('Invalid JSON format')
                      }
                    }}
                  />
                </div>
                {schemaError && (
                  <p className="text-sm text-destructive mt-2 shrink-0">{schemaError}</p>
                )}
              </div>
            ) : (
              <ListViewStyleConfigurator
                schema={schemaObject}
                onStyleChange={(style) => {
                  // Update schema with display_mapping.style
                  try {
                    const updatedSchema = JSON.parse(JSON.stringify(schemaObject)) // Deep clone
                    
                    // Handle array schema (items.display_mapping)
                    if (updatedSchema.type === 'array' && updatedSchema.items) {
                      if (!updatedSchema.items.display_mapping) {
                        updatedSchema.items.display_mapping = {}
                      }
                      updatedSchema.items.display_mapping.style = style
                    } else {
                      // Handle object schema (root display_mapping)
                      if (!updatedSchema.display_mapping) {
                        updatedSchema.display_mapping = {}
                      }
                      updatedSchema.display_mapping.style = style
                    }
                    
                    handleSchemaChange(updatedSchema)
                  } catch (error) {
                    console.error('Failed to update style:', error)
                  }
                }}
              />
            )}
            
            {errors.schema && (
              <p className="text-sm text-destructive shrink-0">{errors.schema}</p>
            )}
            {schemaError && (
              <p className="text-sm text-destructive shrink-0">{schemaError}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : initialData ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CustomApiSchemaForm

