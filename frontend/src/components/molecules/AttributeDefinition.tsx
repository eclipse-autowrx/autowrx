// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { Label } from '@/components/atoms/label'
import { Textarea } from '@/components/atoms/textarea'
import { cn } from '@/lib/utils'
import JsonEditor from '@/components/atoms/JsonEditor'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/atoms/select'
import { TbPlus, TbTrash, TbPencil, TbDownload, TbUpload } from 'react-icons/tb'
import { useToast } from '@/components/molecules/toaster/use-toast'
import type { PluginApiAttribute } from '@/services/pluginApi.service'

interface AttributeDefinitionProps {
  value: PluginApiAttribute[]
  onChange: (attributes: PluginApiAttribute[]) => void
}

const AttributeDefinition: React.FC<AttributeDefinitionProps> = ({
  value,
  onChange,
}) => {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<'list' | 'json'>('list')
  const [attributes, setAttributes] = useState<PluginApiAttribute[]>(value || [])
  const [jsonError, setJsonError] = useState<string | null>(null)

  useEffect(() => {
    setAttributes(value || [])
  }, [value])

  const handleListChange = (newAttributes: PluginApiAttribute[]) => {
    setAttributes(newAttributes)
    onChange(newAttributes)
  }

  const handleAddAttribute = () => {
    const newAttribute: PluginApiAttribute = {
      name: '',
      data_type: 'string',
      required: false,
      description: '',
    }
    handleListChange([...attributes, newAttribute])
  }

  const handleUpdateAttribute = (index: number, updates: Partial<PluginApiAttribute>) => {
    const updated = [...attributes]
    updated[index] = { ...updated[index], ...updates }
    handleListChange(updated)
  }

  const handleDeleteAttribute = (index: number) => {
    const updated = attributes.filter((_, i) => i !== index)
    handleListChange(updated)
  }

  const handleJsonChange = (parsedValue: any) => {
    setJsonError(null)

    if (!Array.isArray(parsedValue)) {
      setJsonError('Value must be an array')
      return
    }

    // Validate each attribute has required fields
    for (const attr of parsedValue) {
      if (!attr.name || !attr.data_type) {
        setJsonError('Each attribute must have name and data_type')
        return
      }
    }

    // Update attributes immediately when JSON is valid
    const updatedAttributes = parsedValue as PluginApiAttribute[]
    setAttributes(updatedAttributes)
    onChange(updatedAttributes)
  }

  const handleExport = () => {
    if (attributes.length === 0) {
      toast({
        title: 'No attributes to export',
        description: 'Please add attributes before exporting',
        variant: 'destructive',
      })
      return
    }

    const jsonString = JSON.stringify(attributes, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'attributes.json'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast({
      title: 'Exported',
      description: `Exported ${attributes.length} attribute(s) to attributes.json`,
    })
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const jsonString = event.target?.result as string
          const parsed = JSON.parse(jsonString)
          
          if (!Array.isArray(parsed)) {
            setJsonError('Imported file must contain an array of attributes')
            return
          }

          // Validate each attribute has required fields
          for (const attr of parsed) {
            if (!attr.name || !attr.data_type) {
              setJsonError('Each attribute must have name and data_type')
              return
            }
          }

          const importedAttributes = parsed as PluginApiAttribute[]
          setAttributes(importedAttributes)
          onChange(importedAttributes)
          setJsonError(null)
          
          // Switch to list mode to show imported attributes
          setActiveTab('list')
          
          toast({
            title: 'Imported',
            description: `Successfully imported ${importedAttributes.length} attribute(s)`,
          })
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Invalid JSON file'
          setJsonError(errorMessage)
          toast({
            title: 'Import failed',
            description: errorMessage,
            variant: 'destructive',
          })
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const dataTypes: PluginApiAttribute['data_type'][] = [
    'string',
    'number',
    'boolean',
    'object',
    'array',
    'mixed',
  ]

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between border-b border-border shrink-0 pb-2 mb-2">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-semibold mb-0">
            Attributes <span className="text-destructive">*</span>
          </Label>
          {activeTab === 'list' && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddAttribute}
              >
                <TbPlus className="mr-2 h-4 w-4" />
                Add Attribute
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleExport}
              >
                <TbDownload className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleImport}
              >
                <TbUpload className="mr-2 h-4 w-4" />
                Import
              </Button>
            </>
          )}
        </div>
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
      </div>

      {activeTab === 'list' && (
        <div className="space-y-2 overflow-y-auto flex-1 min-h-0 mt-2">

          {attributes.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">
              No attributes defined. Click "Add Attribute" to create one.
            </div>
          ) : (
            <div className="space-y-2">
              {/* Header row */}
              <div className="grid grid-cols-[1fr_120px_1fr_40px_40px] gap-2 items-center px-2 pb-1 border-b border-border mt-2">
                <div className="text-xs font-semibold text-muted-foreground">
                  Name *
                </div>
                <div className="text-xs font-semibold text-muted-foreground">
                  Data Type *
                </div>
                <div className="text-xs font-semibold text-muted-foreground">
                  Description
                </div>
                <div className="text-xs font-semibold text-muted-foreground text-center">
                  Required
                </div>
                <div></div>
              </div>

              {/* Attribute rows */}
              {attributes.map((attr, index) => (
                <div
                  key={index}
                  className="bg-primary/5 rounded-md p-2"
                >
                  <div className="grid grid-cols-[1fr_120px_1fr_40px_40px] gap-2 items-center">
                    <div>
                      <Input
                        value={attr.name || ''}
                        onChange={(e) =>
                          handleUpdateAttribute(index, { name: e.target.value })
                        }
                        placeholder="name"
                        required
                        className="h-8 text-sm border-white bg-white"
                      />
                    </div>

                    <div>
                      <Select
                        value={attr.data_type}
                        onValueChange={(value: PluginApiAttribute['data_type']) =>
                          handleUpdateAttribute(index, { data_type: value })
                        }
                      >
                        <SelectTrigger className="w-full h-8 text-sm border-white bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {dataTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Input
                        value={attr.description || ''}
                        onChange={(e) =>
                          handleUpdateAttribute(index, {
                            description: e.target.value,
                          })
                        }
                        placeholder="Description (optional)"
                        className="h-8 text-sm border-white bg-white"
                      />
                    </div>

                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        id={`required-${index}`}
                        checked={attr.required || false}
                        onChange={(e) =>
                          handleUpdateAttribute(index, {
                            required: e.target.checked,
                          })
                        }
                        className="h-4 w-4 rounded border-border"
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteAttribute(index)}
                        className="h-8 w-8"
                      >
                        <TbTrash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'json' && (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 min-h-0">
            <JsonEditor
              value={attributes}
              onChange={handleJsonChange}
              valueType="array"
              className="h-full"
            />
          </div>
          {jsonError && (
            <p className="text-sm text-destructive shrink-0 mt-2">{jsonError}</p>
          )}
        </div>
      )}
    </div>
  )
}

export default AttributeDefinition

