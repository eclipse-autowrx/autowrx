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
import { useQuery } from '@tanstack/react-query'
import { listPluginAPIs, getPluginAPIById, type PluginAPI } from '@/services/pluginApi.service'
import { Spinner } from '@/components/atoms/spinner'
import type { PluginApiInstance } from '@/services/pluginApiInstance.service'
import DaImportFile from '@/components/atoms/DaImportFile'
import { uploadFileService } from '@/services/upload.service'
import { TbPhotoEdit } from 'react-icons/tb'
import { useToast } from '@/components/molecules/toaster/use-toast'

interface PluginApiInstanceFormProps {
  open: boolean
  onClose: () => void
  onSave: (data: Partial<PluginApiInstance>) => Promise<void>
  initialData?: PluginApiInstance
}

const PluginApiInstanceForm: React.FC<PluginApiInstanceFormProps> = ({
  open,
  onClose,
  onSave,
  initialData,
}) => {
  const { toast } = useToast()
  const isEditMode = !!initialData
  const [step, setStep] = useState<1 | 2>(isEditMode ? 2 : 1)
  const [selectedPluginAPI, setSelectedPluginAPI] = useState<PluginAPI | null>(null)
  const [formData, setFormData] = useState<Partial<PluginApiInstance>>({
    name: '',
    description: '',
    scope: 'system', // Force system scope for admin-created instances
    avatar: '',
    provider_url: '',
    data: {
      items: [],
      metadata: {},
    },
  })
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: pluginAPIs, isLoading: isLoadingAPIs } = useQuery({
    queryKey: ['plugin-apis'],
    queryFn: () => listPluginAPIs({ limit: 100, page: 1, is_active: true }),
    enabled: open && step === 1,
  })

  // Extract plugin_api ID - handle both populated object and string ID
  const pluginApiId = initialData?.plugin_api 
    ? (typeof initialData.plugin_api === 'string' 
        ? initialData.plugin_api 
        : (initialData.plugin_api as any).id || (initialData.plugin_api as any)._id || initialData.plugin_api)
    : null

  // Load PluginAPI data when editing
  const { data: pluginAPIData } = useQuery({
    queryKey: ['plugin-api', pluginApiId],
    queryFn: () => getPluginAPIById(pluginApiId!),
    enabled: !!pluginApiId && open,
  })

  // Initialize form data when editing
  useEffect(() => {
    if (initialData && open) {
      setFormData({
        name: initialData.name,
        description: initialData.description || '',
        scope: 'system', // Force system scope for admin-created instances
        avatar: initialData.avatar || '',
        provider_url: initialData.provider_url || '',
        plugin_api: initialData.plugin_api,
        plugin_api_code: initialData.plugin_api_code,
        data: initialData.data || { items: [], metadata: {} },
      })
      setStep(2) // Skip step 1 when editing
    } else if (!initialData && open) {
      // Reset form when creating new
      setFormData({
        name: '',
        description: '',
        scope: 'user',
        avatar: '',
        provider_url: '',
        data: {
          items: [],
          metadata: {},
        },
      })
      setStep(1)
      setSelectedPluginAPI(null)
    }
  }, [initialData, open])

  // Set selected PluginAPI when editing
  useEffect(() => {
    if (pluginAPIData && open) {
      setSelectedPluginAPI(pluginAPIData)
    }
  }, [pluginAPIData, open])

  const handleStep1Next = () => {
    if (!selectedPluginAPI) {
      setErrors({ plugin_api: 'Please select a PluginAPI schema' })
      return
    }
    setErrors({})
    setFormData((prev) => ({
      ...prev,
      plugin_api: selectedPluginAPI.id,
      plugin_api_code: selectedPluginAPI.code,
    }))
    setStep(2)
  }

  const handleChange = (field: keyof PluginApiInstance, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.plugin_api) {
      newErrors.plugin_api = 'PluginAPI is required'
    }

    // Scope is always 'system' for admin-created instances, no validation needed

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validate()) {
      return
    }

    try {
      setIsSaving(true)
      await onSave(formData)
      handleClose()
    } catch (error) {
      console.error('Save failed:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    if (!isEditMode) {
      setStep(1)
      setSelectedPluginAPI(null)
    }
    setFormData({
      name: '',
      description: '',
      scope: 'system', // Force system scope for admin-created instances
      avatar: '',
      data: {
        items: [],
        metadata: {},
      },
    })
    setErrors({})
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[90vw] h-[90vh] max-w-none max-h-none flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>
            {isEditMode ? 'Edit API Instance' : 'Create API Instance'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto py-4">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Step 1: Select PluginAPI Schema</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose the API schema this instance will be based on
                </p>
              </div>

              {isLoadingAPIs ? (
                <div className="flex justify-center items-center py-8">
                  <Spinner />
                </div>
              ) : (
                <div className="space-y-2">
                  {pluginAPIs?.results?.map((api: PluginAPI) => (
                    <div
                      key={api.id}
                      onClick={() => {
                        setSelectedPluginAPI(api)
                        setErrors({})
                      }}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedPluginAPI?.id === api.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-foreground">{api.name}</h4>
                          <p className="text-xs text-muted-foreground font-mono mt-1">
                            {api.code}
                          </p>
                          {api.description && (
                            <p className="text-sm text-muted-foreground mt-2">
                              {api.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              api.type === 'tree'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                : api.type === 'list'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                            }`}
                          >
                            {api.type.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {!pluginAPIs?.results?.length && (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      No active PluginAPI schemas available. Please create one first.
                    </div>
                  )}
                </div>
              )}

              {errors.plugin_api && (
                <p className="text-sm text-destructive">{errors.plugin_api}</p>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">{isEditMode ? 'Instance Details' : 'Step 2: Instance Details'}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Based on: <span className="font-semibold">{selectedPluginAPI?.name || pluginAPIData?.name || initialData?.plugin_api_code}</span> ({selectedPluginAPI?.code || pluginAPIData?.code || initialData?.plugin_api_code})
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="name">
                    Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name || ''}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="e.g., My REST API Instance"
                    className={errors.name ? 'border-destructive' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name}</p>
                  )}
                </div>

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

                <div className="space-y-1">
                  <Label htmlFor="avatar">Avatar</Label>
                  <div className="flex items-center gap-4">
                    <div className="w-32 h-32 border border-border rounded-md overflow-hidden bg-muted flex items-center justify-center relative">
                      {formData.avatar ? (
                        <img
                          src={formData.avatar}
                          alt="Avatar"
                          className="w-full h-full object-contain p-2"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/imgs/plugin.png'
                          }}
                        />
                      ) : (
                        <div className="text-muted-foreground text-xs text-center p-2">
                          No image
                        </div>
                      )}
                      <DaImportFile
                        accept="image/*"
                        onFileChange={async (file) => {
                          try {
                            const { url } = await uploadFileService(file)
                            handleChange('avatar', url)
                            toast({
                              title: 'Image uploaded',
                              description: 'Avatar image uploaded successfully',
                            })
                          } catch (error: any) {
                            toast({
                              title: 'Upload failed',
                              description: error?.message || 'Failed to upload image',
                              variant: 'destructive',
                            })
                          }
                        }}
                        className="absolute top-1 right-1"
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm shadow-sm hover:bg-background"
                        >
                          <TbPhotoEdit className="h-4 w-4" />
                        </Button>
                      </DaImportFile>
                    </div>
                    <div className="flex-1">
                      <Input
                        id="avatar"
                        value={formData.avatar || ''}
                        onChange={(e) => handleChange('avatar', e.target.value)}
                        placeholder="Image URL or upload above"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Upload an image or enter an image URL
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="provider_url">Provider Website URL</Label>
                  <Input
                    id="provider_url"
                    type="url"
                    value={formData.provider_url || ''}
                    onChange={(e) => handleChange('provider_url', e.target.value)}
                    placeholder="https://example.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    Clicking on the API instance image will open this URL in a new tab
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0">
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            Cancel
          </Button>
          {step === 1 ? (
            <Button onClick={handleStep1Next} disabled={!selectedPluginAPI || isLoadingAPIs}>
              Next
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update' : 'Create')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default PluginApiInstanceForm

