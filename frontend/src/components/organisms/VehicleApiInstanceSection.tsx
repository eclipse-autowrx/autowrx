// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useState } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import {
  listPluginApiInstances,
  deletePluginApiInstance,
  createPluginApiInstance,
  updatePluginApiInstance,
  type PluginApiInstance,
} from '@/services/pluginApiInstance.service'
import { listPluginAPIs, createPluginAPI } from '@/services/pluginApi.service'
import { Button } from '@/components/atoms/button'
import { TbPencil, TbTrash, TbPlus, TbDotsVertical, TbDownload, TbUpload } from 'react-icons/tb'
import { Spinner } from '@/components/atoms/spinner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu'
import { useToast } from '@/components/molecules/toaster/use-toast'
import PluginApiInstanceForm from '@/components/organisms/PluginApiInstanceForm'
import PluginApiInstanceItemEditor from '@/components/organisms/PluginApiInstanceItemEditor'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/atoms/table'
import { exportPluginApiInstance, importPluginApiInstanceFromZIP } from '@/lib/pluginApiUtils'
import DaDialog from '@/components/molecules/DaDialog'
import { Input } from '@/components/atoms/input'
import { Label } from '@/components/atoms/label'
import DaImportFile from '@/components/atoms/DaImportFile'
import { uploadFileService } from '@/services/upload.service'

const VehicleApiInstanceSection: React.FC = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingInstance, setEditingInstance] = useState<PluginApiInstance | null>(null)
  const [editingItemsInstanceId, setEditingItemsInstanceId] = useState<string | null>(null)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importInstanceName, setImportInstanceName] = useState('')
  const [importSchemaName, setImportSchemaName] = useState('')
  const [importSchemaCode, setImportSchemaCode] = useState('')
  const [isImporting, setIsImporting] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['plugin-api-instances'],
    queryFn: () => listPluginApiInstances({ limit: 100, page: 1, scope: 'system' }),
  })

  const handleDelete = async (instance: PluginApiInstance) => {
    if (!window.confirm(`Delete "${instance.name}"?`)) return

    try {
      setIsDeleting(instance.id)
      await deletePluginApiInstance(instance.id)
      toast({
        title: 'Deleted',
        description: `PluginApiInstance "${instance.name}" deleted successfully`,
      })
      queryClient.invalidateQueries({ queryKey: ['plugin-api-instances'] })
    } catch (err) {
      toast({
        title: 'Delete failed',
        description: err instanceof Error ? err.message : 'Failed to delete PluginApiInstance',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(null)
    }
  }

  const handleExport = async (instance: PluginApiInstance) => {
    try {
      await exportPluginApiInstance(instance)
      toast({
        title: 'Exported',
        description: `API Instance "${instance.name}" exported successfully`,
      })
    } catch (error: any) {
      toast({
        title: 'Export failed',
        description: error?.message || 'Failed to export API Instance',
        variant: 'destructive',
      })
    }
  }

  const generateCodeFromName = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/_+/g, '_') // Replace multiple underscores with single
      .replace(/^_|_$/g, '') // Remove leading/trailing underscores
  }

  const handleImportFileChange = async (file: File) => {
    try {
      setImportFile(file)
      const importedData = await importPluginApiInstanceFromZIP(file)
      const instanceName = importedData.instance.name || ''
      const schemaName = importedData.schema.name || ''
      setImportInstanceName(instanceName)
      setImportSchemaName(schemaName)
      // Auto-generate schema code from schema name
      setImportSchemaCode(generateCodeFromName(schemaName))
    } catch (error: any) {
      toast({
        title: 'Import failed',
        description: error?.message || 'Failed to parse ZIP file',
        variant: 'destructive',
      })
      setImportFile(null)
      setImportInstanceName('')
      setImportSchemaName('')
      setImportSchemaCode('')
    }
  }

  const handleImportSchemaNameChange = (name: string) => {
    setImportSchemaName(name)
    // Auto-generate code when schema name changes
    if (name.trim()) {
      setImportSchemaCode(generateCodeFromName(name))
    }
  }

  const handleImport = async () => {
    if (!importFile || !importInstanceName.trim() || !importSchemaName.trim() || !importSchemaCode.trim()) {
      toast({
        title: 'Import failed',
        description: 'Please provide instance name, schema name, and schema code',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsImporting(true)
      const importedData = await importPluginApiInstanceFromZIP(importFile)
      
      // Normalize schema code
      const normalizedSchemaCode = importSchemaCode.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')
      
      // Check if schema already exists by code (since we don't export IDs)
      const existingSchemas = await listPluginAPIs({ code: normalizedSchemaCode, limit: 1 })
      let schemaId: string
      
      if (existingSchemas.results.length > 0) {
        // Schema exists (matched by code), compare the schema field
        const existingSchema = existingSchemas.results[0]
        const importedSchemaStr = typeof importedData.schema.schema === 'string' 
          ? importedData.schema.schema 
          : JSON.stringify(importedData.schema.schema)
        const existingSchemaStr = typeof existingSchema.schema === 'string'
          ? existingSchema.schema
          : JSON.stringify(existingSchema.schema)
        
        // Normalize JSON strings for comparison (remove whitespace differences)
        const normalizeJson = (str: string) => {
          try {
            return JSON.stringify(JSON.parse(str))
          } catch {
            return str.trim()
          }
        }
        
        const normalizedImported = normalizeJson(importedSchemaStr)
        const normalizedExisting = normalizeJson(existingSchemaStr)
        
        if (normalizedImported !== normalizedExisting) {
          // Same code but different schema - suggest using different name
          toast({
            title: 'Schema conflict',
            description: `A schema with code "${normalizedSchemaCode}" already exists but has a different schema definition. Please use a different name to create a new schema.`,
            variant: 'destructive',
          })
          setIsImporting(false)
          return
        }
        
        // Schema matches, use existing schema ID
        schemaId = existingSchema.id
        toast({
          title: 'Schema found',
          description: `Using existing schema "${normalizedSchemaCode}"`,
        })
      } else {
        // Schema doesn't exist, create new one with the provided name and code
        const newSchema = await createPluginAPI({
          ...importedData.schema,
          name: importSchemaName.trim(),
          code: normalizedSchemaCode,
        })
        schemaId = newSchema.id
        toast({
          title: 'Schema created',
          description: `Created new schema "${importSchemaName}"`,
        })
      }

      // Upload avatar if exists
      let avatarUrl: string | undefined
      if (importedData.avatarBlob) {
        try {
          // Convert Blob to File with correct extension and MIME type
          const extension = importedData.avatarExtension || 'png'
          const mimeTypes: Record<string, string> = {
            svg: 'image/svg+xml',
            png: 'image/png',
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            webp: 'image/webp',
            gif: 'image/gif',
          }
          const mimeType = mimeTypes[extension] || 'image/png'
          const avatarFile = new File([importedData.avatarBlob], `avatar.${extension}`, { type: mimeType })
          
          const uploadResult = await uploadFileService(avatarFile)
          avatarUrl = uploadResult.url
        } catch (error) {
          console.warn('Failed to upload avatar:', error)
          toast({
            title: 'Avatar upload failed',
            description: 'The instance was imported but the avatar image could not be uploaded. You can update it manually.',
            variant: 'destructive',
          })
        }
      }

      // Create instance
      await createPluginApiInstance({
        ...importedData.instance,
        name: importInstanceName.trim(),
        plugin_api: schemaId,
        plugin_api_code: normalizedSchemaCode,
        scope: 'system',
        avatar: avatarUrl,
      })

      toast({
        title: 'Imported',
        description: `API Instance "${importInstanceName}" imported successfully`,
      })
      queryClient.invalidateQueries({ queryKey: ['plugin-api-instances'] })
      queryClient.invalidateQueries({ queryKey: ['plugin-apis'] })
      setIsImportOpen(false)
      setImportFile(null)
      setImportInstanceName('')
      setImportSchemaName('')
      setImportSchemaCode('')
    } catch (error: any) {
      toast({
        title: 'Import failed',
        description: error?.response?.data?.message || error?.message || 'Failed to import API Instance',
        variant: 'destructive',
      })
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <>
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold text-foreground">
              Vehicle API Instances
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage API set instances (actual data)
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setIsImportOpen(true)}>
              <TbUpload className="mr-2 h-4 w-4" />
              Import
            </Button>
            <Button size="sm" onClick={() => {
              setEditingInstance(null)
              setIsFormOpen(true)
            }}>
              <TbPlus className="mr-2 h-4 w-4" />
              New API Instance
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Spinner />
          </div>
        ) : data?.results?.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Avatar</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>API Schema</TableHead>
                <TableHead>Number of APIs</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.results.map((instance: PluginApiInstance) => (
                <TableRow key={instance.id}>
                  <TableCell>
                    <div className="w-16 aspect-[4/3] rounded-md overflow-hidden flex items-center justify-center">
                      {instance.avatar ? (
                        <img
                          src={instance.avatar}
                          alt={instance.name}
                          className="w-full h-full object-contain p-1"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/imgs/plugin.png'
                          }}
                        />
                      ) : (
                        <div className="text-muted-foreground text-xs text-center p-1">
                          No image
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div>
                      <div 
                        className="cursor-pointer hover:text-primary transition-colors"
                        onClick={() => {
                          setEditingInstance(instance)
                          setIsFormOpen(true)
                        }}
                      >
                        {instance.name}
                      </div>
                      {instance.description && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {instance.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">{instance.plugin_api_code}</span>
                  </TableCell>
                  <TableCell>
                    <span 
                      className="cursor-pointer hover:text-primary transition-colors"
                      onClick={() => setEditingItemsInstanceId(instance.id)}
                    >
                      {instance.data?.items?.length || 0}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={isDeleting === instance.id}
                        >
                          <TbDotsVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingInstance(instance)
                            setIsFormOpen(true)
                          }}
                          disabled={isDeleting === instance.id}
                        >
                          <TbPencil className="h-4 w-4 mr-2" />
                          Edit Metadata
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setEditingItemsInstanceId(instance.id)}
                          disabled={isDeleting === instance.id}
                        >
                          <TbPencil className="h-4 w-4 mr-2" />
                          Edit Child APIs
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleExport(instance)}
                          disabled={isDeleting === instance.id}
                        >
                          <TbDownload className="h-4 w-4 mr-2" />
                          Export
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(instance)}
                          disabled={isDeleting === instance.id}
                          className="text-destructive focus:text-destructive"
                        >
                          {isDeleting === instance.id ? (
                            <Spinner className="h-4 w-4 mr-2" />
                          ) : (
                            <TbTrash className="h-4 w-4 mr-2" />
                          )}
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">No API instances yet</p>
            <Button className="mt-4" variant="outline" onClick={() => {
              setEditingInstance(null)
              setIsFormOpen(true)
            }}>
              <TbPlus className="mr-2 h-4 w-4" />
              Create First API Instance
            </Button>
          </div>
        )}
      </div>

      <PluginApiInstanceForm
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setEditingInstance(null)
        }}
        initialData={editingInstance || undefined}
        onSave={async (formData) => {
          try {
            if (editingInstance) {
              // Filter out fields that shouldn't be updated
              const { plugin_api, plugin_api_code, scope, ...updateData } = formData
              await updatePluginApiInstance(editingInstance.id, updateData)
              toast({
                title: 'Updated',
                description: 'API Instance updated successfully',
              })
            } else {
              // Ensure scope is set to 'system' for admin-created instances
              await createPluginApiInstance({
                ...formData,
                scope: 'system',
              })
              toast({
                title: 'Created',
                description: 'API Instance created successfully',
              })
            }
            queryClient.invalidateQueries({ queryKey: ['plugin-api-instances'] })
            setIsFormOpen(false)
            setEditingInstance(null)
          } catch (error: any) {
            toast({
              title: editingInstance ? 'Update failed' : 'Create failed',
              description: error?.response?.data?.message || error?.message || `Failed to ${editingInstance ? 'update' : 'create'} API Instance`,
              variant: 'destructive',
            })
            throw error
          }
        }}
      />

      {editingItemsInstanceId && (
        <PluginApiInstanceItemEditor
          open={!!editingItemsInstanceId}
          onClose={() => setEditingItemsInstanceId(null)}
          instanceId={editingItemsInstanceId}
        />
      )}

      {/* Import Dialog */}
      <DaDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        trigger={<span></span>}
        dialogTitle="Import API Instance"
        className="w-[500px] max-w-[90vw]"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="import-file">Select ZIP File</Label>
            <DaImportFile
              accept=".zip"
              onFileChange={handleImportFileChange}
              className="mt-2"
            >
              <Button variant="outline" className="w-full">
                <TbUpload className="mr-2 h-4 w-4" />
                {importFile ? importFile.name : 'Choose File'}
              </Button>
            </DaImportFile>
          </div>

          {importFile && (
            <>
              <div>
                <Label htmlFor="import-instance-name">Instance Name *</Label>
                <Input
                  id="import-instance-name"
                  value={importInstanceName}
                  onChange={(e) => setImportInstanceName(e.target.value)}
                  placeholder="Enter API Instance name"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="import-schema-name">Schema Name *</Label>
                <Input
                  id="import-schema-name"
                  value={importSchemaName}
                  onChange={(e) => handleImportSchemaNameChange(e.target.value)}
                  placeholder="Enter Schema name (will be created if doesn't exist)"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="import-schema-code">Schema Code *</Label>
                <Input
                  id="import-schema-code"
                  value={importSchemaCode}
                  onChange={(e) => setImportSchemaCode(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                  placeholder="Auto-generated from schema name (editable)"
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Schema will be created if it doesn't exist. Code is auto-generated from name.
                </p>
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsImportOpen(false)
                setImportFile(null)
                setImportInstanceName('')
                setImportSchemaName('')
                setImportSchemaCode('')
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!importFile || !importInstanceName.trim() || !importSchemaName.trim() || !importSchemaCode.trim() || isImporting}
            >
              {isImporting ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Importing...
                </>
              ) : (
                'Import'
              )}
            </Button>
          </div>
        </div>
      </DaDialog>
    </>
  )
}

export default VehicleApiInstanceSection

