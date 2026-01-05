// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React from 'react'
import { Input } from '@/components/atoms/input'
import { Label } from '@/components/atoms/label'
import { Textarea } from '@/components/atoms/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/atoms/select'
import { Checkbox } from '@/components/atoms/checkbox'
import JsonEditor from '@/components/atoms/JsonEditor'
import { Button } from '@/components/atoms/button'
import { TbPlus, TbTrash, TbCopy } from 'react-icons/tb'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/molecules/toaster/use-toast'

interface DynamicSchemaFormProps {
  schema: string | object // JSON Schema as string or object
  data: any // Current item data
  onChange: (data: any) => void
  mode?: 'view' | 'edit'
  excludeFields?: string[] // Fields to exclude (like id, path, parent_id)
  fieldPrefix?: string // For nested fields (e.g., "parameters.0.schema")
  depth?: number // Track nesting depth
}

const DynamicSchemaForm: React.FC<DynamicSchemaFormProps> = ({
  schema,
  data,
  onChange,
  mode = 'edit',
  excludeFields = ['id', 'path', 'parent_id', 'relationships'],
  fieldPrefix = '',
  depth = 0,
}) => {
  const { toast } = useToast()

  // Helper function to capitalize first letter of field name
  const capitalizeLabel = (fieldName: string): string => {
    if (!fieldName) return fieldName
    return fieldName.charAt(0).toUpperCase() + fieldName.slice(1)
  }


  // Helper function to copy value to clipboard
  const copyToClipboard = (value: any, fieldName: string) => {
    let textToCopy = ''
    
    if (value === null || value === undefined) {
      return
    }
    
    if (typeof value === 'object') {
      textToCopy = JSON.stringify(value, null, 2)
    } else {
      textToCopy = String(value)
    }
    
    navigator.clipboard.writeText(textToCopy).then(() => {
      toast({
        title: 'Copied',
        description: `${capitalizeLabel(fieldName)} copied to clipboard`,
      })
    }).catch(() => {
      toast({
        title: 'Copy failed',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      })
    })
  }

  // Parse schema
  const schemaObj = React.useMemo(() => {
    try {
      const parsed = typeof schema === 'string' ? JSON.parse(schema) : schema
      
      // If schema defines an array with items, extract the items schema
      if (parsed.type === 'array' && parsed.items) {
        return parsed.items
      }
      
      // If schema is an object, use it directly
      return parsed
    } catch (error) {
      console.error('Error parsing schema:', error)
      return {}
    }
  }, [schema])

  // Extract properties from schema
  const properties = schemaObj?.properties || {}
  const required = schemaObj?.required || []
  
  // Debug logging
  React.useEffect(() => {
    if (schema) {
      console.log('DynamicSchemaForm - Schema:', schema)
      console.log('DynamicSchemaForm - Parsed schema:', schemaObj)
      console.log('DynamicSchemaForm - Properties:', properties)
      console.log('DynamicSchemaForm - Data:', data)
    }
  }, [schema, schemaObj, properties, data])

  const handleFieldChange = (fieldName: string, value: any) => {
    const newData = { ...data, [fieldName]: value }
    onChange(newData)
  }

  const handleArrayItemChange = (fieldName: string, index: number, value: any) => {
    const currentArray = data[fieldName] || []
    const newArray = [...currentArray]
    newArray[index] = value
    handleFieldChange(fieldName, newArray)
  }

  const handleArrayItemAdd = (fieldName: string, itemSchema: any) => {
    const currentArray = data[fieldName] || []
    const defaultItem = getDefaultValue(itemSchema)
    handleFieldChange(fieldName, [...currentArray, defaultItem])
  }

  const handleArrayItemRemove = (fieldName: string, index: number) => {
    const currentArray = data[fieldName] || []
    const newArray = currentArray.filter((_: any, i: number) => i !== index)
    handleFieldChange(fieldName, newArray)
  }

  const getDefaultValue = (fieldSchema: any): any => {
    if (fieldSchema.default !== undefined) return fieldSchema.default
    switch (fieldSchema.type) {
      case 'string': return ''
      case 'number':
      case 'integer': return 0
      case 'boolean': return false
      case 'array': return []
      case 'object': return {}
      default: return null
    }
  }

  const renderField = (fieldName: string, fieldSchema: any, currentDepth: number = 0): React.ReactNode => {
    if (excludeFields.includes(fieldName)) return null

    const isRequired = required.includes(fieldName)
    const fieldValue = data[fieldName]
    const fieldType = fieldSchema.type
    const description = fieldSchema.description || ''
    const fullFieldName = fieldPrefix ? `${fieldPrefix}.${fieldName}` : fieldName

    // View mode
    if (mode === 'view') {
      const hasValue = fieldValue !== null && fieldValue !== undefined
      return (
        <div key={fieldName} className={cn("space-y-1", currentDepth > 0 && "ml-4 border-l-2 border-border pl-4")}>
          <Label className="text-sm font-semibold">
            {capitalizeLabel(fieldName)} {isRequired && <span className="text-destructive">*</span>}
          </Label>
          <div className="relative group">
            <div className="text-sm text-foreground py-2 px-3 bg-muted rounded-md break-words overflow-x-auto max-h-[200px] overflow-y-auto">
              {!hasValue
                ? <span className="text-muted-foreground italic">Not set</span>
                : typeof fieldValue === 'object' 
                  ? <pre className="text-xs whitespace-pre-wrap break-words overflow-x-auto">{JSON.stringify(fieldValue, null, 2)}</pre>
                  : <div className="break-words overflow-wrap-anywhere">{String(fieldValue)}</div>
              }
            </div>
            {hasValue && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => copyToClipboard(fieldValue, fieldName)}
                title="Copy to clipboard"
              >
                <TbCopy className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      )
    }

    // Handle nested objects recursively
    if (fieldType === 'object' && fieldSchema.properties) {
      if (mode === 'view') {
        // View mode: show nested object in a styled block
        const hasValue = fieldValue && Object.keys(fieldValue).length > 0
        return (
          <div key={fieldName} className={cn("space-y-1", currentDepth > 0 && "ml-4 border-l-2 border-border pl-4")}>
            <Label className="text-sm font-semibold">
              {capitalizeLabel(fieldName)} {isRequired && <span className="text-destructive">*</span>}
            </Label>
            <div className="relative group">
              <div className="text-sm text-foreground py-2 px-3 bg-muted rounded-md break-words overflow-x-auto max-h-[200px] overflow-y-auto">
                {hasValue ? (
                  <div className="space-y-2">
                    <DynamicSchemaForm
                      schema={fieldSchema}
                      data={fieldValue || {}}
                      onChange={(newValue) => handleFieldChange(fieldName, newValue)}
                      mode={mode}
                      excludeFields={excludeFields}
                      fieldPrefix={fullFieldName}
                      depth={currentDepth + 1}
                    />
                  </div>
                ) : (
                  <span className="text-muted-foreground italic">Not set</span>
                )}
              </div>
              {hasValue && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => copyToClipboard(fieldValue, fieldName)}
                  title="Copy to clipboard"
                >
                  <TbCopy className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        )
      }
      
      // Edit mode
      return (
        <div key={fieldName} className={cn("space-y-3", currentDepth > 0 && "ml-4 border-l-2 border-border pl-4 pt-2")}>
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">
              {capitalizeLabel(fieldName)} {isRequired && <span className="text-destructive">*</span>}
            </Label>
          </div>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
          <div className="space-y-3 bg-muted/30 p-3 rounded-md">
            <DynamicSchemaForm
              schema={fieldSchema}
              data={fieldValue || {}}
              onChange={(newValue) => handleFieldChange(fieldName, newValue)}
              mode={mode}
              excludeFields={excludeFields}
              fieldPrefix={fullFieldName}
              depth={currentDepth + 1}
            />
          </div>
        </div>
      )
    }

    // Handle arrays of objects
    if (fieldType === 'array' && fieldSchema.items?.type === 'object' && fieldSchema.items?.properties) {
      const arrayValue = fieldValue || []
      
      if (mode === 'view') {
        // View mode: show array in a styled block
        const hasValue = arrayValue.length > 0
        return (
          <div key={fieldName} className={cn("space-y-1", currentDepth > 0 && "ml-4 border-l-2 border-border pl-4")}>
            <Label className="text-sm font-semibold">
              {capitalizeLabel(fieldName)} {isRequired && <span className="text-destructive">*</span>}
            </Label>
            <div className="relative group">
              <div className="text-sm text-foreground py-2 px-3 bg-muted rounded-md break-words overflow-x-auto max-h-[200px] overflow-y-auto">
                {hasValue ? (
                  <div className="space-y-3">
                    {arrayValue.map((item: any, index: number) => (
                      <div key={index} className="bg-background/50 p-2 rounded border border-border/50">
                        <div className="text-xs font-medium text-muted-foreground mb-2">Item {index + 1}</div>
                    <DynamicSchemaForm
                      schema={fieldSchema.items}
                      data={item || {}}
                      onChange={(newValue) => handleArrayItemChange(fieldName, index, newValue)}
                      mode={mode}
                      excludeFields={excludeFields}
                      fieldPrefix={`${fullFieldName}.${index}`}
                      depth={currentDepth + 1}
                    />
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-muted-foreground italic">No items</span>
                )}
              </div>
              {hasValue && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => copyToClipboard(arrayValue, fieldName)}
                  title="Copy to clipboard"
                >
                  <TbCopy className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        )
      }
      
      // Edit mode - use JSON editor for array items (simpler approach)
      return (
        <div key={fieldName} className={cn("space-y-2", currentDepth > 0 && "ml-4 border-l-2 border-border pl-4 pt-2")}>
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">
              {capitalizeLabel(fieldName)} {isRequired && <span className="text-destructive">*</span>}
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleArrayItemAdd(fieldName, fieldSchema.items)}
            >
              <TbPlus className="h-4 w-4 mr-1" />
              Add Item
            </Button>
          </div>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
          <div className="space-y-3">
            {arrayValue.map((item: any, index: number) => (
              <div key={index} className="bg-muted/30 p-3 rounded-md border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Item {index + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleArrayItemRemove(fieldName, index)}
                  >
                    <TbTrash className="h-4 w-4" />
                  </Button>
                </div>
                <JsonEditor
                  value={item || {}}
                  onChange={(value) => handleArrayItemChange(fieldName, index, value)}
                  valueType="object"
                />
              </div>
            ))}
            {arrayValue.length === 0 && (
              <div className="text-sm text-muted-foreground italic text-center py-2">
                No items. Click "Add Item" to add one.
              </div>
            )}
          </div>
        </div>
      )
    }

    // Handle arrays of primitives
    if (fieldType === 'array' && fieldSchema.items?.type !== 'object') {
      return (
        <div key={fieldName} className="space-y-1">
          <Label htmlFor={fullFieldName}>
            {capitalizeLabel(fieldName)} {isRequired && <span className="text-destructive">*</span>}
          </Label>
          <JsonEditor
            value={fieldValue || []}
            onChange={(value) => handleFieldChange(fieldName, value)}
            valueType="array"
          />
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      )
    }

    // Handle primitive types
    switch (fieldType) {
      case 'string':
        if (fieldSchema.enum) {
          return (
            <div key={fieldName} className="space-y-1">
              <Label htmlFor={fullFieldName}>
                {capitalizeLabel(fieldName)} {isRequired && <span className="text-destructive">*</span>}
              </Label>
              <Select
                value={fieldValue || ''}
                onValueChange={(value) => handleFieldChange(fieldName, value)}
              >
                <SelectTrigger id={fullFieldName} className="min-w-[160px]">
                  <SelectValue placeholder={`Select ${capitalizeLabel(fieldName)}`} />
                </SelectTrigger>
                <SelectContent>
                  {fieldSchema.enum.map((option: any) => (
                    <SelectItem key={option} value={String(option)}>
                      {String(option)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
              )}
            </div>
          )
        }
        return (
          <div key={fieldName} className="space-y-1">
            <Label htmlFor={fullFieldName}>
              {capitalizeLabel(fieldName)} {isRequired && <span className="text-destructive">*</span>}
            </Label>
            {fieldSchema.format === 'uri' || description.length > 100 ? (
              <Textarea
                id={fullFieldName}
                value={fieldValue || ''}
                onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                placeholder={description}
                rows={3}
                className="bg-white min-h-[3rem]"
              />
            ) : (
              <Input
                id={fullFieldName}
                value={fieldValue || ''}
                onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                placeholder={description}
                required={isRequired}
                className="bg-white"
              />
            )}
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        )

      case 'number':
      case 'integer':
        return (
          <div key={fieldName} className="space-y-1">
            <Label htmlFor={fullFieldName}>
              {capitalizeLabel(fieldName)} {isRequired && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id={fullFieldName}
              type="number"
              value={fieldValue || ''}
              onChange={(e) => handleFieldChange(fieldName, parseFloat(e.target.value) || 0)}
              placeholder={description}
              min={fieldSchema.minimum}
              max={fieldSchema.maximum}
              required={isRequired}
              className="!bg-white"
            />
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        )

      case 'boolean':
        return (
          <div key={fieldName} className="space-y-1">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={fullFieldName}
                checked={fieldValue || false}
                onCheckedChange={(checked) => handleFieldChange(fieldName, checked)}
              />
              <Label htmlFor={fullFieldName}>
                {capitalizeLabel(fieldName)} {isRequired && <span className="text-destructive">*</span>}
              </Label>
            </div>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        )

      default:
        // Fallback for complex objects without properties definition
        return (
          <div key={fieldName} className="space-y-1">
            <Label htmlFor={fullFieldName}>
              {capitalizeLabel(fieldName)} {isRequired && <span className="text-destructive">*</span>}
            </Label>
            <JsonEditor
              value={fieldValue || {}}
              onChange={(value) => handleFieldChange(fieldName, value)}
              valueType="object"
            />
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        )
    }
  }

  // If no properties found, show a message
  if (Object.keys(properties).length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-2">
        <p>No properties defined in schema.</p>
        <p className="text-xs mt-1">Schema type: {schemaObj?.type || 'unknown'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {Object.entries(properties).map(([fieldName, fieldSchema]: [string, any]) =>
        renderField(fieldName, fieldSchema, depth)
      )}
    </div>
  )
}

export default DynamicSchemaForm

