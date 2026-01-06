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
  listCustomApiSets,
  deleteCustomApiSet,
  createCustomApiSet,
  updateCustomApiSet,
  type CustomApiSet,
} from '@/services/customApiSet.service'
import { listCustomApiSchemas, createCustomApiSchema } from '@/services/customApiSchema.service'
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
import CustomApiSetForm from '@/components/organisms/CustomApiSetForm'
import CustomApiSetItemEditor from '@/components/organisms/CustomApiSetItemEditor'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/atoms/table'
import { exportCustomApiSet, importCustomApiSetFromZIP } from '@/lib/customApiUtils'
import DaDialog from '@/components/molecules/DaDialog'
import { Input } from '@/components/atoms/input'
import { Label } from '@/components/atoms/label'
import DaImportFile from '@/components/atoms/DaImportFile'
import { uploadFileService } from '@/services/upload.service'

const CustomApiSetSection: React.FC = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingSet, setEditingSet] = useState<CustomApiSet | null>(null)
  const [editingItemsInstanceId, setEditingItemsInstanceId] = useState<string | null>(null)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importInstanceName, setImportInstanceName] = useState('')
  const [importSchemaName, setImportSchemaName] = useState('')
  const [importSchemaCode, setImportSchemaCode] = useState('')
  const [isImporting, setIsImporting] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['custom-api-sets'],
    queryFn: () => listCustomApiSets({ limit: 100, page: 1, scope: 'system' }),
  })

  const handleDelete = async (set: CustomApiSet) => {
    if (!window.confirm(`Delete "${set.name}"?`)) return

    try {
      setIsDeleting(set.id)
      await deleteCustomApiSet(set.id)
      toast({
        title: 'Deleted',
        description: `CustomApiSet "${set.name}" deleted successfully`,
      })
      queryClient.invalidateQueries({ queryKey: ['custom-api-sets'] })
    } catch (err) {
      toast({
        title: 'Delete failed',
        description: err instanceof Error ? err.message : 'Failed to delete CustomApiSet',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(null)
    }
  }

  const handleExport = async (set: CustomApiSet) => {
    try {
      await exportCustomApiSet(set)
      toast({
        title: 'Exported',
        description: `API Set "${set.name}" exported successfully`,
      })
    } catch (error: any) {
      toast({
        title: 'Export failed',
        description: error?.message || 'Failed to export API Set',
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
      const importedData = await importCustomApiSetFromZIP(file)
      const setName = importedData.set.name || ''
      const schemaName = importedData.schema.name || ''
      setImportInstanceName(setName)
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
        description: 'Please provide set name, schema name, and schema code',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsImporting(true)
      const importedData = await importCustomApiSetFromZIP(importFile)
      
      // Normalize schema code
      const normalizedSchemaCode = importSchemaCode.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')
      
      // Check if schema already exists by code (since we don't export IDs)
      const existingSchemas = await listCustomApiSchemas({ code: normalizedSchemaCode, limit: 1 })
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
        const newSchema = await createCustomApiSchema({
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
            description: 'The set was imported but the avatar image could not be uploaded. You can update it manually.',
            variant: 'destructive',
          })
        }
      }

      // Create set
      await createCustomApiSet({
        ...importedData.set,
        name: importInstanceName.trim(),
        custom_api_schema: schemaId,
        custom_api_schema_code: normalizedSchemaCode,
        scope: 'system',
        avatar: avatarUrl,
      })

      toast({
        title: 'Imported',
        description: `API Set "${importInstanceName}" imported successfully`,
      })
      queryClient.invalidateQueries({ queryKey: ['custom-api-sets'] })
      queryClient.invalidateQueries({ queryKey: ['custom-api-schemas'] })
      setIsImportOpen(false)
      setImportFile(null)
      setImportInstanceName('')
      setImportSchemaName('')
      setImportSchemaCode('')
    } catch (error: any) {
      toast({
        title: 'Import failed',
        description: error?.response?.data?.message || error?.message || 'Failed to import API Set',
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
              Vehicle API Sets
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
              setEditingSet(null)
              setIsFormOpen(true)
            }}>
              <TbPlus className="mr-2 h-4 w-4" />
              New API Set
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
              {data.results.map((set: CustomApiSet) => (
                <TableRow key={set.id}>
                  <TableCell>
                    <div className="w-16 aspect-[4/3] rounded-md overflow-hidden flex items-center justify-center">
                      {set.avatar ? (
                        <img
                          src={set.avatar}
                          alt={set.name}
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
                          setEditingSet(set)
                          setIsFormOpen(true)
                        }}
                      >
                        {set.name}
                      </div>
                      {set.description && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {set.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">{set.custom_api_schema_code}</span>
                  </TableCell>
                  <TableCell>
                    <span 
                      className="cursor-pointer hover:text-primary transition-colors"
                      onClick={() => setEditingItemsInstanceId(set.id)}
                    >
                      {set.data?.items?.length || 0}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={isDeleting === set.id}
                        >
                          <TbDotsVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingSet(set)
                            setIsFormOpen(true)
                          }}
                          disabled={isDeleting === set.id}
                        >
                          <TbPencil className="h-4 w-4 mr-2" />
                          Edit Metadata
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setEditingItemsInstanceId(set.id)}
                          disabled={isDeleting === set.id}
                        >
                          <TbPencil className="h-4 w-4 mr-2" />
                          Edit Child APIs
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleExport(set)}
                          disabled={isDeleting === set.id}
                        >
                          <TbDownload className="h-4 w-4 mr-2" />
                          Export
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(set)}
                          disabled={isDeleting === set.id}
                          className="text-destructive focus:text-destructive"
                        >
                          {isDeleting === set.id ? (
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
            <p className="text-sm text-muted-foreground">No API sets yet</p>
            <Button className="mt-4" variant="outline" onClick={() => {
              setEditingSet(null)
              setIsFormOpen(true)
            }}>
              <TbPlus className="mr-2 h-4 w-4" />
              Create First API Set
            </Button>
          </div>
        )}
      </div>

      <CustomApiSetForm
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setEditingSet(null)
        }}
        initialData={editingSet || undefined}
        onSave={async (formData) => {
          try {
            if (editingSet) {
              // Filter out fields that shouldn't be updated
              const { custom_api_schema, custom_api_schema_code, scope, ...updateData } = formData
              await updateCustomApiSet(editingSet.id, updateData)
              toast({
                title: 'Updated',
                description: 'API Set updated successfully',
              })
            } else {
              // Ensure scope is set to 'system' for admin-created sets
              await createCustomApiSet({
                ...formData,
                scope: 'system',
              })
              toast({
                title: 'Created',
                description: 'API Set created successfully',
              })
            }
            queryClient.invalidateQueries({ queryKey: ['custom-api-sets'] })
            setIsFormOpen(false)
            setEditingSet(null)
          } catch (error: any) {
            toast({
              title: editingSet ? 'Update failed' : 'Create failed',
              description: error?.response?.data?.message || error?.message || `Failed to ${editingSet ? 'update' : 'create'} API Set`,
              variant: 'destructive',
            })
            throw error
          }
        }}
      />

      {editingItemsInstanceId && (
        <CustomApiSetItemEditor
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
        dialogTitle="Import API Set"
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
                <Label htmlFor="import-instance-name">Set Name *</Label>
                <Input
                  id="import-instance-name"
                  value={importInstanceName}
                  onChange={(e) => setImportInstanceName(e.target.value)}
                  placeholder="Enter API Set name"
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

export default CustomApiSetSection

