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
  listCustomApiSchemas,
  deleteCustomApiSchema,
  createCustomApiSchema,
  updateCustomApiSchema,
  type CustomApiSchema,
} from '@/services/customApiSchema.service'
import { Button } from '@/components/atoms/button'
import { TbPencil, TbTrash, TbPlus, TbDownload, TbUpload, TbDotsVertical } from 'react-icons/tb'
import { Spinner } from '@/components/atoms/spinner'
import { useToast } from '@/components/molecules/toaster/use-toast'
import CustomApiSchemaForm from '@/components/organisms/CustomApiSchemaForm'
import { exportCustomApiSchema, importCustomApiSchemaFromJSON } from '@/lib/customApiUtils'
import DaDialog from '@/components/molecules/DaDialog'
import { Input } from '@/components/atoms/input'
import { Label } from '@/components/atoms/label'
import DaImportFile from '@/components/atoms/DaImportFile'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu'

const CustomApiSchemaSection: React.FC = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingApi, setEditingApi] = useState<CustomApiSchema | undefined>()
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importName, setImportName] = useState('')
  const [importCode, setImportCode] = useState('')
  const [isImporting, setIsImporting] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['custom-api-schemas'],
    queryFn: () => listCustomApiSchemas({ limit: 100, page: 1 }),
  })

  const handleCreate = () => {
    setEditingApi(undefined)
    setIsFormOpen(true)
  }

  const handleEdit = (api: CustomApiSchema) => {
    setEditingApi(api)
    setIsFormOpen(true)
  }

  const handleDelete = async (api: CustomApiSchema) => {
    if (!window.confirm(`Delete "${api.name}"?`)) return

    try {
      setIsDeleting(api.id)
      await deleteCustomApiSchema(api.id)
      toast({
        title: 'Deleted',
        description: `CustomApiSchema "${api.name}" deleted successfully`,
      })
      queryClient.invalidateQueries({ queryKey: ['custom-api-schemas'] })
    } catch (err) {
      toast({
        title: 'Delete failed',
        description: err instanceof Error ? err.message : 'Failed to delete CustomApiSchema',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(null)
    }
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingApi(undefined)
  }

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<CustomApiSchema>) => {
      if (editingApi) {
        return await updateCustomApiSchema(editingApi.id, data)
      } else {
        return await createCustomApiSchema(data)
      }
    },
    onSuccess: () => {
      toast({
        title: editingApi ? 'Updated' : 'Created',
        description: `API Definition ${editingApi ? 'updated' : 'created'} successfully`,
      })
      queryClient.invalidateQueries({ queryKey: ['custom-api-schemas'] })
      handleFormClose()
    },
    onError: (error: any) => {
      toast({
        title: 'Save failed',
        description: error?.response?.data?.message || error?.message || 'Failed to save API Definition',
        variant: 'destructive',
      })
    },
  })

  const handleFormSave = async (data: Partial<CustomApiSchema>) => {
    await saveMutation.mutateAsync(data)
  }

  const handleExport = async (api: CustomApiSchema) => {
    try {
      await exportCustomApiSchema(api)
      toast({
        title: 'Exported',
        description: `API Schema "${api.name}" exported successfully`,
      })
    } catch (error: any) {
      toast({
        title: 'Export failed',
        description: error?.message || 'Failed to export API Schema',
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
      const importedData = await importCustomApiSchemaFromJSON(file)
      const name = importedData.name || ''
      setImportName(name)
      // Auto-generate code from name
      setImportCode(generateCodeFromName(name))
    } catch (error: any) {
      toast({
        title: 'Import failed',
        description: error?.message || 'Failed to parse JSON file',
        variant: 'destructive',
      })
      setImportFile(null)
      setImportName('')
      setImportCode('')
    }
  }

  const handleImportNameChange = (name: string) => {
    setImportName(name)
    // Auto-generate code when name changes
    if (name.trim()) {
      setImportCode(generateCodeFromName(name))
    }
  }

  const handleImport = async () => {
    if (!importFile || !importName.trim() || !importCode.trim()) {
      toast({
        title: 'Import failed',
        description: 'Please provide a name and code',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsImporting(true)
      const importedData = await importCustomApiSchemaFromJSON(importFile)
      
      // Check if code already exists
      const existing = await listCustomApiSchemas({ code: importCode, limit: 1 })
      if (existing.results.length > 0) {
        toast({
          title: 'Import failed',
          description: `Code "${importCode}" already exists. Please use a different code.`,
          variant: 'destructive',
        })
        setIsImporting(false)
        return
      }

      // Create with new name and code
      await createCustomApiSchema({
        ...importedData,
        name: importName.trim(),
        code: importCode.trim().toLowerCase(),
      })

      toast({
        title: 'Imported',
        description: `API Schema "${importName}" imported successfully`,
      })
      queryClient.invalidateQueries({ queryKey: ['custom-api-schemas'] })
      setIsImportOpen(false)
      setImportFile(null)
      setImportName('')
      setImportCode('')
    } catch (error: any) {
      toast({
        title: 'Import failed',
        description: error?.response?.data?.message || error?.message || 'Failed to import API Schema',
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
              Vehicle API Schemas
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage API set schemas (Tree, List, Graph types)
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsImportOpen(true)} size="sm" variant="outline">
              <TbUpload className="mr-2 h-4 w-4" />
              Import
            </Button>
            <Button onClick={handleCreate} size="sm">
              <TbPlus className="mr-2 h-4 w-4" />
              New API Definition
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Spinner />
          </div>
        ) : (
          <div className="space-y-2">
            {data?.results?.map((api: CustomApiSchema) => (
              <div
                key={api.id}
                className="rounded-lg border border-border bg-background p-3 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-foreground truncate">
                        {api.name}
                      </h3>
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                          api.type === 'tree'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : api.type === 'list'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                        }`}
                      >
                        {api.type.toUpperCase()}
                      </span>
                      {api.is_active ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 shrink-0">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 shrink-0">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="font-mono">{api.code}</span>
                      {api.description && (
                        <span className="truncate">• {api.description}</span>
                      )}
                      {api.relationships && api.relationships.length > 0 && (
                        <span>• Relationships: {api.relationships.length}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex ml-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={isDeleting === api.id}
                        >
                          <TbDotsVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleEdit(api)}
                          disabled={isDeleting === api.id}
                        >
                          <TbPencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleExport(api)}
                          disabled={isDeleting === api.id}
                        >
                          <TbDownload className="h-4 w-4 mr-2" />
                          Export
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(api)}
                          disabled={isDeleting === api.id}
                          className="text-destructive focus:text-destructive"
                        >
                          {isDeleting === api.id ? (
                            <Spinner className="h-4 w-4 mr-2" />
                          ) : (
                            <TbTrash className="h-4 w-4 mr-2" />
                          )}
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))}
            {!data?.results?.length && (
              <div className="col-span-full text-center py-12">
                <p className="text-sm text-muted-foreground">No API schemas yet</p>
                <Button onClick={handleCreate} className="mt-4" variant="outline">
                  <TbPlus className="mr-2 h-4 w-4" />
                  Create First API Definition
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <CustomApiSchemaForm
        open={isFormOpen}
        onClose={handleFormClose}
        onSave={handleFormSave}
        initialData={editingApi}
      />

      {/* Import Dialog */}
      <DaDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        trigger={<span></span>}
        dialogTitle="Import API Schema"
        className="w-[500px] max-w-[90vw]"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="import-file">Select JSON File</Label>
            <DaImportFile
              accept=".json"
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
                <Label htmlFor="import-name">Name *</Label>
                <Input
                  id="import-name"
                  value={importName}
                  onChange={(e) => handleImportNameChange(e.target.value)}
                  placeholder="Enter API Schema name"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="import-code">Code *</Label>
                <Input
                  id="import-code"
                  value={importCode}
                  onChange={(e) => setImportCode(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                  placeholder="Auto-generated from name (editable)"
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Code is auto-generated from name. You can edit it if needed.
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
                setImportName('')
                setImportCode('')
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!importFile || !importName.trim() || !importCode.trim() || isImporting}
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

export default CustomApiSchemaSection

