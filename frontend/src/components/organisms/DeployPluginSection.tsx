// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { configManagementService, Config } from '@/services/configManagement.service'
import { useToast } from '@/components/molecules/toaster/use-toast'
import { Spinner } from '@/components/atoms/spinner'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { Label } from '@/components/atoms/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/atoms/dialog'
import { DaImage } from '@/components/atoms/DaImage'
import DaImportFile from '@/components/atoms/DaImportFile'
import { uploadFileService } from '@/services/upload.service'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { TbGripVertical, TbPencil, TbTrash, TbPlus, TbCheck, TbX, TbPhotoEdit, TbDotsVertical } from 'react-icons/tb'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { listPlugins, type Plugin } from '@/services/plugin.service'
import PluginForm from '@/components/organisms/PluginForm'

const STAGING_FRAME_KEY = 'STAGING_FRAME'

interface Stage {
  name: string
  version: string
  image: string
  plugins?: Plugin[]
}

const DeployPluginSection: React.FC = () => {
  const { data: self, isLoading: selfLoading } = useSelfProfileQuery()
  const [stagingFrameConfig, setStagingFrameConfig] = useState<Config | null>(null)
  const [stages, setStages] = useState<Stage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editFormData, setEditFormData] = useState<Stage>({ name: '', version: '', image: '', plugins: [] })
  const [pluginFormOpen, setPluginFormOpen] = useState(false)
  const [pluginFormStageIndex, setPluginFormStageIndex] = useState<number | null>(null)
  const [editingPluginId, setEditingPluginId] = useState<string | undefined>(undefined)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch deploy plugins
  const { data: pluginsData, isLoading: pluginsLoading } = useQuery({
    queryKey: ['plugins', 'deploy'],
    queryFn: () => listPlugins({ limit: 100, page: 1, type: 'deploy' }),
  })

  useEffect(() => {
    if (selfLoading || !self) return
    loadStagingFrameConfig()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selfLoading, !!self])

  useEffect(() => {
    if (stagingFrameConfig?.value && Array.isArray(stagingFrameConfig.value.stages)) {
      // Ensure each stage has a plugins array
      const stagesWithPlugins = stagingFrameConfig.value.stages.map((stage: Stage) => ({
        ...stage,
        plugins: stage.plugins || [],
      }))
      setStages(stagesWithPlugins)
    }
  }, [stagingFrameConfig])

  const loadStagingFrameConfig = async () => {
    try {
      setIsLoading(true)
      // Get the config by key - backend will return default if not found or null
      const config = await configManagementService.getConfigByKey(STAGING_FRAME_KEY)
      setStagingFrameConfig(config)
    } catch (err: any) {
      // If config doesn't exist (404), backend should have returned default
      // But if we still get an error, try querying by key
      if (err?.response?.status === 404 || err?.response?.status === 400) {
        try {
          const res = await configManagementService.getConfigs({
            key: STAGING_FRAME_KEY,
            scope: 'site',
            limit: 1,
          })
          if (res.results && res.results.length > 0) {
            setStagingFrameConfig(res.results[0])
          } else {
            // Backend should return default, but if not, show error
            throw new Error('Config not found and no default available')
          }
        } catch (queryErr) {
          toast({
            title: 'Load failed',
            description: queryErr instanceof Error ? queryErr.message : 'Failed to load staging frame config',
            variant: 'destructive',
          })
        }
      } else {
        toast({
          title: 'Load failed',
          description: err instanceof Error ? err.message : 'Failed to load staging frame config',
          variant: 'destructive',
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const saveStages = async (updatedStages: Stage[]) => {
    try {
      setIsSaving(true)
      const newValue = { stages: updatedStages }
      
      if (stagingFrameConfig?.id) {
        // Update existing config
        await configManagementService.updateConfigById(stagingFrameConfig.id, {
          value: newValue,
        })
      } else {
        // Create new config
        const newConfig = await configManagementService.createConfig({
          key: STAGING_FRAME_KEY,
          scope: 'site',
          value: newValue,
          valueType: 'object',
          secret: false,
          category: 'deploy',
        })
        setStagingFrameConfig(newConfig)
      }
      
      setStages(updatedStages)
      toast({
        title: 'Saved',
        description: 'Staging frames updated successfully',
      })
    } catch (err) {
      toast({
        title: 'Save failed',
        description: err instanceof Error ? err.message : 'Failed to save staging frames',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const items = Array.from(stages)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setStages(items)
    saveStages(items)
  }

  const handleEdit = (index: number) => {
    setEditingIndex(index)
    setEditFormData({ 
      ...stages[index],
      plugins: stages[index].plugins || []
    })
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = () => {
    if (editingIndex !== null && editFormData.name.trim() && editFormData.image.trim()) {
      const updatedStages = [...stages]
      updatedStages[editingIndex] = {
        name: editFormData.name.trim(),
        version: editFormData.version.trim() || 'v1.0',
        image: editFormData.image.trim(),
        plugins: editFormData.plugins || updatedStages[editingIndex].plugins || [],
      }
      setStages(updatedStages)
      saveStages(updatedStages)
      setIsEditDialogOpen(false)
      setEditingIndex(null)
      setEditFormData({ name: '', version: '', image: '', plugins: [] })
    }
  }

  const handleCancelEdit = () => {
    setIsEditDialogOpen(false)
    setEditingIndex(null)
    setEditFormData({ name: '', version: '', image: '' })
  }

  const handleDelete = (index: number) => {
    if (window.confirm(`Delete stage "${stages[index].name}"?`)) {
      const updatedStages = stages.filter((_, i) => i !== index)
      setStages(updatedStages)
      saveStages(updatedStages)
    }
  }

  const handleAddNew = () => {
    setEditingIndex(-1) // -1 means new item
    setEditFormData({ name: '', version: 'v1.0', image: '', plugins: [] })
    setIsEditDialogOpen(true)
  }

  const handleOpenPluginForm = (stageIndex: number, pluginId?: string) => {
    setPluginFormStageIndex(stageIndex)
    setEditingPluginId(pluginId)
    setPluginFormOpen(true)
  }

  const handlePluginSaved = (plugin: Plugin) => {
    if (pluginFormStageIndex !== null) {
      const updatedStages = [...stages]
      const stagePlugins = updatedStages[pluginFormStageIndex].plugins || []
      
      if (editingPluginId) {
        // Update existing plugin in the stage
        const pluginIndex = stagePlugins.findIndex((p) => p.id === editingPluginId)
        if (pluginIndex !== -1) {
          updatedStages[pluginFormStageIndex].plugins = [
            ...stagePlugins.slice(0, pluginIndex),
            plugin,
            ...stagePlugins.slice(pluginIndex + 1),
          ]
        }
        toast({
          title: 'Plugin updated',
          description: `${plugin.name} updated`,
        })
      } else {
        // Check if plugin already exists
        if (stagePlugins.some((p) => p.id === plugin.id)) {
          toast({
            title: 'Plugin already added',
            description: 'This plugin is already in the stage',
            variant: 'destructive',
          })
          return
        }

        updatedStages[pluginFormStageIndex].plugins = [...stagePlugins, plugin]
        toast({
          title: 'Plugin added',
          description: `${plugin.name} added to ${updatedStages[pluginFormStageIndex].name}`,
        })
      }

      setStages(updatedStages)
      saveStages(updatedStages)
      setPluginFormOpen(false)
      setPluginFormStageIndex(null)
      setEditingPluginId(undefined)
      queryClient.invalidateQueries({ queryKey: ['plugins', 'deploy'] })
    }
  }

  const handleRemovePlugin = (stageIndex: number, pluginId: string) => {
    const updatedStages = [...stages]
    const stagePlugins = updatedStages[stageIndex].plugins || []
    updatedStages[stageIndex].plugins = stagePlugins.filter((p) => p.id !== pluginId)
    setStages(updatedStages)
    saveStages(updatedStages)
    toast({
      title: 'Plugin removed',
      description: 'Plugin removed from stage',
    })
  }

  const handleSaveNew = () => {
    if (editFormData.name.trim() && editFormData.image.trim()) {
      const newStage: Stage = {
        name: editFormData.name.trim(),
        version: editFormData.version.trim() || 'v1.0',
        image: editFormData.image.trim(),
        plugins: [],
      }
      const updatedStages = [...stages, newStage]
      setStages(updatedStages)
      saveStages(updatedStages)
      setIsEditDialogOpen(false)
      setEditingIndex(null)
      setEditFormData({ name: '', version: '', image: '', plugins: [] })
    }
  }

  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImage(true)
      const { url } = await uploadFileService(file)
      setEditFormData({ ...editFormData, image: url })
      toast({
        title: 'Image uploaded',
        description: 'Image uploaded successfully',
      })
    } catch (err) {
      toast({
        title: 'Upload failed',
        description: err instanceof Error ? err.message : 'Failed to upload image',
        variant: 'destructive',
      })
    } finally {
      setUploadingImage(false)
    }
  }

  return (
    <>
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold text-foreground">
              Staging
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage stages for maturity level test setup. Each stage represents an increasing level of test environment maturity.
            </p>
          </div>
          <Button onClick={handleAddNew} size="sm">
            <TbPlus className="w-4 h-4 mr-2" />
            Add Stage
          </Button>
        </div>
      </div>
      <div className="p-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Spinner />
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="stages" direction="horizontal">
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="flex gap-4 overflow-x-auto pb-4"
                >
                  {stages.map((stage, index) => (
                    <Draggable key={`stage-${index}`} draggableId={`stage-${index}`} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex-shrink-0 w-[220px] ${
                            snapshot.isDragging ? 'opacity-50' : ''
                          }`}
                        >
                          <div className="border border-border rounded-lg bg-background shadow-sm hover:shadow-md transition-shadow">
                            {/* Drag Handle */}
                            <div
                              {...provided.dragHandleProps}
                              className="flex items-center justify-center p-2 border-b border-border cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                            >
                              <TbGripVertical className="w-5 h-5" />
                            </div>

                            {/* Image */}
                            <div className="aspect-square w-full bg-muted rounded-t-lg overflow-hidden p-4">
                              <img
                                src={stage.image}
                                alt={stage.name}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.src = '/imgs/plugin.png'
                                }}
                              />
                            </div>

                            {/* Content */}
                            <div className="px-2 py-4">
                              <div className="w-full px-2">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className="font-semibold text-foreground truncate flex-1">
                                  {stage.name}
                                </h3>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 flex-shrink-0"
                                    >
                                      <TbDotsVertical className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEdit(index)}>
                                      <TbPencil className="w-4 h-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleDelete(index)}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <TbTrash className="w-4 h-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                              <p className="text-sm text-muted-foreground mb-3">
                                {stage.version}
                              </p>
                              </div>

                              {/* Plugins Section */}
                              <div className="border-t border-border w-full pt-2 mt-2">
                                <div className="flex items-center justify-between mb-2 px-1">
                                  <Label className="text-xs text-muted-foreground">Plugins {stage.plugins && stage.plugins.filter((p) => p.type === 'deploy' || !p.type).length > 0 ? `(${stage.plugins.filter((p) => p.type === 'deploy').length})` : ''}</Label>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleOpenPluginForm(index)
                                    }}
                                  >
                                    <TbPlus className="w-3 h-3 mr-0.5" />
                                    Add
                                  </Button>
                                </div>
                                <div className="space-y-1.5 max-h-[200px] min-h-[200px] overflow-y-auto px-0">
                                  {stage.plugins && stage.plugins.filter((p) => p.type === 'deploy' || !p.type).length > 0 ? (
                                    stage.plugins
                                      .filter((p) => p.type === 'deploy')
                                      .map((plugin) => (
                                        <div
                                          key={plugin.id}
                                          className="flex items-start gap-1 p-1 border border-border rounded  hover:bg-muted transition w-full"
                                        >
                                          <div className="w-12 h-12 rounded overflow-hidden bg-white flex-shrink-0">
                                            <img
                                              src={plugin.image || '/imgs/plugin.png'}
                                              alt={plugin.name}
                                              className="w-full h-full object-contain p-1"
                                              onError={(e) => {
                                                const target = e.target as HTMLImageElement
                                                target.src = '/imgs/plugin.png'
                                              }}
                                            />
                                          </div>
                                          <div className="flex-1 min-w-0 flex flex-col p-0.5 gap-0.5">
                                            <p className="text-[12px] font-medium text-foreground leading-tight">
                                              {plugin.name}
                                            </p>
                                            {plugin.description && (
                                              <p className="text-[10px] text-muted-foreground line-clamp-2 leading-tight">
                                                {plugin.description}
                                              </p>
                                            )}
                                          </div>
                                          <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-4 w-4 flex-shrink-0"
                                                onClick={(e) => e.stopPropagation()}
                                              >
                                                <TbDotsVertical className="w-2.5 h-2.5" />
                                              </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                              <DropdownMenuItem
                                                onClick={(e) => {
                                                  e.stopPropagation()
                                                  handleOpenPluginForm(index, plugin.id)
                                                }}
                                              >
                                                <TbPencil className="w-3 h-3 mr-2" />
                                                Edit
                                              </DropdownMenuItem>
                                              <DropdownMenuItem
                                                onClick={(e) => {
                                                  e.stopPropagation()
                                                  handleRemovePlugin(index, plugin.id)
                                                }}
                                                className="text-destructive focus:text-destructive"
                                              >
                                                <TbTrash className="w-3 h-3 mr-2" />
                                                Delete
                                              </DropdownMenuItem>
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                        </div>
                                      ))
                                  ) : (
                                    <p className="text-xs text-muted-foreground text-center py-2">
                                      No plugins
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingIndex === -1 ? 'Add New Stage' : 'Edit Stage'}
            </DialogTitle>
            <DialogDescription>
              {editingIndex === -1
                ? 'Create a new staging frame'
                : 'Update the staging frame details'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="stage-name">Name</Label>
              <Input
                id="stage-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                placeholder="e.g., SDV Mock"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stage-version">Version</Label>
              <Input
                id="stage-version"
                value={editFormData.version}
                onChange={(e) => setEditFormData({ ...editFormData, version: e.target.value })}
                placeholder="e.g., v1.0"
              />
            </div>

            {/* Image Upload Section */}
            <div className="space-y-2">
              <Label>Image *</Label>
              {editFormData.image ? (
                <div className="relative w-full border border-border rounded-md overflow-hidden bg-muted">
                  <div className="p-4">
                    <DaImage
                      src={editFormData.image}
                      alt="Stage preview"
                      className="object-contain max-h-[200px] min-h-[150px] w-full"
                    />
                  </div>
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
                <div className="flex items-center justify-center h-[150px] border border-border rounded-md bg-muted">
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
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCancelEdit}>
              <TbX className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={editingIndex === -1 ? handleSaveNew : handleSaveEdit}
              disabled={!editFormData.name.trim() || !editFormData.image.trim() || isSaving || uploadingImage}
            >
              <TbCheck className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Plugin Form Dialog */}
      <PluginForm
        open={pluginFormOpen}
        onClose={() => {
          setPluginFormOpen(false)
          setPluginFormStageIndex(null)
          setEditingPluginId(undefined)
        }}
        mode={editingPluginId ? 'edit' : 'create'}
        pluginId={editingPluginId}
        defaultType="deploy"
        onSaved={handlePluginSaved}
      />
    </>
  )
}

export default DeployPluginSection
