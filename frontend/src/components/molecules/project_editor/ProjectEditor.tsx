// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { FileSystemItem, File, Folder, getItemPath } from './types'
import FileTree from './FileTree'
import EditorComponent from './Editor'
import JSZip from 'jszip'
import {
  isBinaryFile,
  arrayBufferToBase64,
  base64ToArrayBuffer,
} from '@/lib/utils'

import {
  VscNewFile,
  VscNewFolder,
  VscRefresh,
  VscCollapseAll,
  VscChevronLeft,
  VscChevronRight,
  VscCloudDownload,
  VscCloudUpload,
} from 'react-icons/vsc'
import { ArrowRightFromLine, CopyMinus } from 'lucide-react'

interface ProjectEditorProps {
  data: string
  onChange: (data: string) => void
  onSave?: (data: string) => Promise<void>
  prototypeName?: string
}

const ProjectEditor: React.FC<ProjectEditorProps> = ({
  data,
  onChange,
  onSave,
  prototypeName,
}) => {
  const [fsData, setFsData] = useState<FileSystemItem[]>(() => {
    try {
      if (!data || data.trim() === '') {
        return [{ type: 'folder', name: 'root', items: [] }]
      }
      const parsed = JSON.parse(data)
      return Array.isArray(parsed)
        ? parsed
        : [{ type: 'folder', name: 'root', items: [] }]
    } catch {
      return [{ type: 'folder', name: 'root', items: [] }]
    }
  })
  const [openFiles, setOpenFiles] = useState<File[]>([])
  const [activeFile, setActiveFile] = useState<File | null>(null)
  const [unsavedFiles, setUnsavedFiles] = useState<Set<string>>(new Set())
  const [pendingChanges, setPendingChanges] = useState<Map<string, string>>(
    new Map(),
  )
  const [leftPanelWidth, setLeftPanelWidth] = useState(256) // 16rem = 256px
  const [isResizing, setIsResizing] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [creatingAtRoot, setCreatingAtRoot] = useState<{
    type: 'file' | 'folder'
  } | null>(null)
  const [newRootItemName, setNewRootItemName] = useState('')
  const [closeConfirmDialog, setCloseConfirmDialog] = useState<{
    file: File
    filePath: string
  } | null>(null)
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{
    item: FileSystemItem
    itemPath: string
    itemName: string
  } | null>(null)
  const [importConfirmDialog, setImportConfirmDialog] = useState<boolean>(false)
  const [errorDialog, setErrorDialog] = useState<{
    message: string
  } | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const resizeRef = useRef<HTMLDivElement>(null)
  const startXRef = useRef(0)
  const startWidthRef = useRef(0)
  const collapsedWidth = 48 // Width when collapsed

  // Refs to track current state values for use in callbacks without stale closure
  const fsDataRef = useRef<FileSystemItem[]>(fsData)
  const pendingChangesRef = useRef<Map<string, string>>(pendingChanges)
  const unsavedFilesRef = useRef<Set<string>>(unsavedFiles)

  // Update refs whenever state changes
  useEffect(() => {
    fsDataRef.current = fsData
  }, [fsData])

  useEffect(() => {
    pendingChangesRef.current = pendingChanges
  }, [pendingChanges])

  useEffect(() => {
    unsavedFilesRef.current = unsavedFiles
  }, [unsavedFiles])

  const validateFileName = (name: string): { valid: boolean; error?: string } => {
    if (!name || name.trim() === '') {
      return { valid: false, error: 'Name cannot be empty' }
    }

    const invalidChars = /[:*?"<>|]/
    if (invalidChars.test(name)) {
      return {
        valid: false,
        error: 'Name cannot contain: : * ? " < > |'
      }
    }

    if (name.trim() !== name) {
      return { valid: false, error: 'Name cannot start or end with spaces' }
    }

    const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9']
    if (reservedNames.includes(name.toUpperCase())) {
      return { valid: false, error: 'This is a reserved name and cannot be used' }
    }

    return { valid: true }
  }


  // Handle file content changes
  const handleContentChange = useCallback(
    (file: File, content: string) => {
      const filePath = file.path || file.name

      // Mark file as unsaved using path
      setUnsavedFiles((prev) => new Set(prev).add(filePath))

      // Store the pending change using path
      setPendingChanges((prev) => new Map(prev).set(filePath, content))

      // Update the open files to show the new content (match by path)
      setOpenFiles((prev) =>
        prev.map((f) => {
          const fPath = f.path || f.name
          return fPath === filePath ? { ...f, content } : f
        }),
      )

      // Update active file if it's the one being edited
      if (activeFile) {
        const activePath = activeFile.path || activeFile.name
        if (activePath === filePath) {
          setActiveFile({ ...activeFile, content })
        }
      }

      // Update fsData so onChange effect detects the change and triggers onChange callback
      setFsData((prevFsData) => {
        const updateFileInData = (
          items: FileSystemItem[],
          currentPath: string = '',
        ): FileSystemItem[] => {
          return items.map((item) => {
            if (item.type === 'file') {
              const itemPath = currentPath
                ? `${currentPath}/${item.name}`
                : item.name
              if (itemPath === filePath) {
                return { ...item, content }
              }
            } else if (item.type === 'folder') {
              const folderPath = currentPath
                ? `${currentPath}/${item.name}`
                : item.name
              return {
                ...item,
                items: updateFileInData(item.items, folderPath),
              }
            }
            return item
          })
        }
        return updateFileInData(prevFsData)
      })
    },
    [activeFile],
  )

  // Save a specific file and return the updated fsData
  const saveFile = useCallback(
    async (
      file?: File,
      currentFsData?: FileSystemItem[],
    ): Promise<FileSystemItem[]> => {
      const fileToSave = file || activeFile
      if (!fileToSave) return currentFsData || fsDataRef.current

      const filePath = fileToSave.path || fileToSave.name

      // Use refs to get latest values
      const latestPendingChanges = pendingChangesRef.current
      if (!latestPendingChanges.has(filePath)) return currentFsData || fsDataRef.current

      const newContent = latestPendingChanges.get(filePath)!

      // Use provided fsData or get latest from ref
      const baseFsData = currentFsData || fsDataRef.current

      // Update the file system data using path-based matching
      const updateFileInData = (
        items: FileSystemItem[],
        currentPath: string = '',
      ): FileSystemItem[] => {
        return items.map((item) => {
          if (item.type === 'file') {
            const itemPath = currentPath
              ? `${currentPath}/${item.name}`
              : item.name
            if (itemPath === filePath) {
              return { ...item, content: newContent }
            }
          } else if (item.type === 'folder') {
            const folderPath = currentPath
              ? `${currentPath}/${item.name}`
              : item.name
            return { ...item, items: updateFileInData(item.items, folderPath) }
          }
          return item
        })
      }

      // Process the root folder correctly
      const updatedData = baseFsData.map((rootItem) => {
        if (rootItem.type === 'folder') {
          return { ...rootItem, items: updateFileInData(rootItem.items, '') }
        }
        return rootItem
      })

      setFsData(updatedData)

      // Remove from unsaved files and pending changes using path
      setUnsavedFiles((prev) => {
        const next = new Set(prev)
        next.delete(filePath)
        return next
      })

      setPendingChanges((prev) => {
        const next = new Map(prev)
        next.delete(filePath)
        return next
      })

      // Persist to database
      if (onSave) {
        await onSave(JSON.stringify(updatedData))
      }

      return updatedData
    },
    [activeFile, onSave],
  )

  // Save all files
  const saveAllFiles = useCallback(async () => {
    setIsSaving(true)
    setSaveError(null)
    try {
      // Get the latest fsData from ref (most current available)
      let baseFsData = fsDataRef.current
      const latestPendingChanges = pendingChangesRef.current

      // Helper function to apply pending changes to file system data
      const applyPendingChanges = (
        items: FileSystemItem[],
        basePath: string = '',
      ): FileSystemItem[] => {
        return items.map((item) => {
          if (item.type === 'file') {
            const itemPath = basePath ? `${basePath}/${item.name}` : item.name
            // If this file has pending changes, apply them
            if (latestPendingChanges.has(itemPath)) {
              return {
                ...item,
                content: latestPendingChanges.get(itemPath)!,
              }
            }
          } else if (item.type === 'folder') {
            const folderPath = basePath ? `${basePath}/${item.name}` : item.name
            return {
              ...item,
              items: applyPendingChanges(item.items, folderPath),
            }
          }
          return item
        })
      }

      // Create a complete copy of fsData with all pending changes applied
      const updatedFsData = applyPendingChanges(baseFsData)

      // Build the data to save (with all pending changes applied)
      const dataToSave = JSON.stringify(updatedFsData)

      // Clear pending changes and unsaved files AFTER building the data
      setPendingChanges(new Map())
      setUnsavedFiles(new Set())

      // Update the state with the fully updated data
      setFsData(updatedFsData)

      // Then call the parent's async onSave callback with the complete updated data
      // This data includes all pending changes that were in the editor
      if (onSave) {
        console.log('saveAllFiles: Calling onSave with data:', dataToSave)
        await onSave(dataToSave)
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to save files'
      setSaveError(errorMessage)
      console.error('Error saving files:', error)
    } finally {
      setIsSaving(false)
    }
  }, [onSave])

  // Add keyboard shortcuts for save operations
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (e.shiftKey) {
          // Ctrl/Cmd + Shift + S: Save All
          await saveAllFiles()
        } else {
          // Ctrl/Cmd + S: Save current file
          if (
            activeFile &&
            unsavedFilesRef.current.has(activeFile.path || activeFile.name)
          ) {
            setIsSaving(true)
            setSaveError(null)
            try {
              // Get latest values from refs
              const filePath = activeFile.path || activeFile.name
              let latestFsData = fsDataRef.current
              const latestPendingChanges = pendingChangesRef.current

              // Check if this file has pending changes
              if (latestPendingChanges.has(filePath)) {
                const newContent = latestPendingChanges.get(filePath)!

                // Update file system data with the pending change
                const updateFileInData = (
                  items: FileSystemItem[],
                  currentPath: string = '',
                ): FileSystemItem[] => {
                  return items.map((item) => {
                    if (item.type === 'file') {
                      const itemPath = currentPath
                        ? `${currentPath}/${item.name}`
                        : item.name
                      if (itemPath === filePath) {
                        return { ...item, content: newContent }
                      }
                    } else if (item.type === 'folder') {
                      const folderPath = currentPath
                        ? `${currentPath}/${item.name}`
                        : item.name
                      return {
                        ...item,
                        items: updateFileInData(item.items, folderPath),
                      }
                    }
                    return item
                  })
                }

                // Process the root folder correctly - latestFsData is an array with root as first element
                latestFsData = latestFsData.map((rootItem) => {
                  if (rootItem.type === 'folder') {
                    return {
                      ...rootItem,
                      items: updateFileInData(rootItem.items, ''),
                    }
                  }
                  return rootItem
                })

                // Clear pending changes for this file
                setPendingChanges((prev) => {
                  const next = new Map(prev)
                  next.delete(filePath)
                  return next
                })

                setUnsavedFiles((prev) => {
                  const next = new Set(prev)
                  next.delete(filePath)
                  return next
                })

                // Update state with the latest data
                setFsData(latestFsData)
              }

              // Build the data to save with all updates applied
              const dataToSave = JSON.stringify(latestFsData)
              console.log('Ctrl+S: Saving current file with data:', dataToSave)

              if (onSave) {
                await onSave(dataToSave)
              }
            } catch (error) {
              const errorMessage =
                error instanceof Error ? error.message : 'Failed to save file'
              setSaveError(errorMessage)
              console.error('Error saving file:', error)
            } finally {
              setIsSaving(false)
            }
          }
        }
      }
    }

    document.addEventListener(
      'keydown',
      handleKeyDown as unknown as EventListener,
    )
    return () =>
      document.removeEventListener(
        'keydown',
        handleKeyDown as unknown as EventListener,
      )
  }, [activeFile, saveAllFiles, onSave])

  // Store previous fsData to detect structural changes
  const prevFsDataRef = useRef<string>('')

  // Notify parent of data changes and handle structural changes
  useEffect(() => {
    const currentData = JSON.stringify(fsData)
    const prevData = prevFsDataRef.current

    // Only call onChange if data actually changed
    if (currentData !== prevData) {
      onChange(currentData)

      // Any change to fsData structure (including moves, adds, deletes) should trigger save
      // We simply check if the JSON content has changed, which covers all structural changes
      let shouldTriggerSave = false

      if (prevData) {
        // If there's previous data and current data is different, it's a change
        // This includes: file moves, renames, adds, deletes, content changes
        shouldTriggerSave = true
      } else {
        // First time, check if there are items
        shouldTriggerSave = ((fsData[0] as Folder)?.items?.length || 0) > 0
      }

      // Trigger immediate save for any structural/content changes
      if (shouldTriggerSave && onSave && !isSaving) {
        onSave(currentData).catch((error) => {
          setSaveError(
            error instanceof Error ? error.message : 'Failed to save',
          )
        })
      }
    }

    prevFsDataRef.current = currentData
  }, [fsData, onChange, onSave, isSaving])

  // Sync data prop changes
  useEffect(() => {
    try {
      if (!data || data.trim() === '') {
        setFsData([{ type: 'folder', name: 'root', items: [] }])
        return
      }
      const parsed = JSON.parse(data)
      if (Array.isArray(parsed)) {
        setFsData(parsed)
      }
    } catch {
      // Invalid JSON, keep current state
    }
  }, [data])

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev)
  }, [])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isCollapsed) return // Don't allow resizing when collapsed
      e.preventDefault()
      startXRef.current = e.clientX
      startWidthRef.current = leftPanelWidth
      // Disable transitions during resize for instant feedback
      if (resizeRef.current?.parentElement) {
        resizeRef.current.parentElement.style.transition = 'none'
      }
      setIsResizing(true)
    },
    [isCollapsed, leftPanelWidth],
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || isCollapsed) return

      const minWidth = 200
      const maxWidth = 600
      const deltaX = e.clientX - startXRef.current
      const newWidth = Math.min(
        Math.max(startWidthRef.current + deltaX, minWidth),
        maxWidth,
      )
      setLeftPanelWidth(newWidth)
    },
    [isResizing, isCollapsed],
  )

  const handleMouseUp = useCallback(() => {
    setIsResizing(false)
    // Re-enable transitions after resize
    if (resizeRef.current?.parentElement) {
      resizeRef.current.parentElement.style.transition = ''
    }
  }, [])

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    } else {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  const handleFileSelect = (file: File) => {
    // Ensure the file has a proper path
    const filePath = getItemPath(file) || file.path || file.name
    const fileWithPath = { ...file, path: filePath }

    // Check if file with this path is already open (not just by name)
    if (!openFiles.find((f) => getItemPath(f, f.path) === filePath)) {
      setOpenFiles([...openFiles, fileWithPath])
    }
    setActiveFile(fileWithPath)
  }

  const handleCloseFile = (file: File) => {
    const filePath = file.path || file.name

    // Check if file has unsaved changes
    if (unsavedFiles.has(filePath)) {
      setCloseConfirmDialog({ file, filePath })
      return
    }

    // No unsaved changes, close directly
    closeFileDirectly(file, filePath)
  }

  const closeFileDirectly = (file: File, filePath: string) => {
    const newOpenFiles = openFiles.filter(
      (f) => (f.path || f.name) !== filePath,
    )
    setOpenFiles(newOpenFiles)

    setUnsavedFiles((prev) => {
      const next = new Set(prev)
      next.delete(filePath)
      return next
    })
    setPendingChanges((prev) => {
      const next = new Map(prev)
      next.delete(filePath)
      return next
    })

    if (activeFile) {
      const activePath = activeFile.path || activeFile.name
      if (activePath === filePath) {
        setActiveFile(newOpenFiles[0] || null)
      }
    }
  }

  const handleCloseConfirmSave = async () => {
    if (!closeConfirmDialog) return
    const { file, filePath } = closeConfirmDialog

    // Get latest data from refs
    const latestFsData = fsDataRef.current
    const latestPendingChanges = pendingChangesRef.current

    if (latestPendingChanges.has(filePath)) {
      const newContent = latestPendingChanges.get(filePath)!

      // Update file content in fsData
      const updateFileInData = (
        items: FileSystemItem[],
        currentPath: string = '',
      ): FileSystemItem[] => {
        return items.map((item) => {
          if (item.type === 'file') {
            const itemPath = currentPath ? `${currentPath}/${item.name}` : item.name
            if (itemPath === filePath) {
              return { ...item, content: newContent }
            }
          } else if (item.type === 'folder') {
            const folderPath = currentPath ? `${currentPath}/${item.name}` : item.name
            return { ...item, items: updateFileInData(item.items, folderPath) }
          }
          return item
        })
      }

      const updatedFsData = latestFsData.map((rootItem) => {
        if (rootItem.type === 'folder') {
          return { ...rootItem, items: updateFileInData(rootItem.items, '') }
        }
        return rootItem
      })

      // Update state
      setFsData(updatedFsData)

      // Clear pending changes for this file
      setPendingChanges((prev) => {
        const next = new Map(prev)
        next.delete(filePath)
        return next
      })
      setUnsavedFiles((prev) => {
        const next = new Set(prev)
        next.delete(filePath)
        return next
      })

      // Persist to database
      if (onSave) {
        await onSave(JSON.stringify(updatedFsData))
      }
    }

    closeFileDirectly(file, filePath)
    setCloseConfirmDialog(null)
  }

  const handleCloseConfirmDontSave = () => {
    if (!closeConfirmDialog) return
    const { file, filePath } = closeConfirmDialog

    closeFileDirectly(file, filePath)
    setCloseConfirmDialog(null)
  }

  const handleCloseConfirmCancel = () => {
    setCloseConfirmDialog(null)
  }
  const handleDeleteItem = (item: FileSystemItem) => {
    // Safety check: ensure item exists and has required properties
    if (!item || !item.type || !item.name) {
      console.warn('handleDeleteItem: Invalid item provided', item)
      return
    }

    const deletePath = (item as any).__originalPath || item.path || item.name

    // Show confirmation dialog
    setDeleteConfirmDialog({
      item,
      itemPath: deletePath,
      itemName: item.name,
    })
  }


  const handleDeleteConfirm = () => {
    if (!deleteConfirmDialog) return

    const { item, itemPath } = deleteConfirmDialog

    setFsData((prevFsData) => {
      // Helper function to collect all file paths in a folder (recursive)
      const collectFilePaths = (
        items: FileSystemItem[],
        basePath: string = '',
      ): string[] => {
        const filePaths: string[] = []
        items.forEach((item) => {
          const currentPath = basePath ? `${basePath}/${item.name}` : item.name
          if (item.type === 'file') {
            filePaths.push(currentPath)
          } else if (item.type === 'folder') {
            filePaths.push(...collectFilePaths(item.items, currentPath))
          }
        })
        return filePaths
      }

      // Get all file paths that will be deleted
      const filePathsToDelete: string[] = []
      if (itemPath) {
        // If we have the exact path, use it directly
        filePathsToDelete.push(itemPath)
        // Also collect files inside if it's a folder
        if (item.type === 'folder') {
          filePathsToDelete.push(...collectFilePaths(item.items, itemPath))
        }
      } else {
        // Fallback: no path provided (shouldn't happen with proper integration)
        if (item.type === 'file') {
          filePathsToDelete.push(item.name)
        } else if (item.type === 'folder') {
          filePathsToDelete.push(...collectFilePaths(item.items))
        }
      }

      // Remove deleted files from open files list (match by path)
      const newOpenFiles = openFiles.filter((openFile) => {
        const openFilePath = openFile.path || openFile.name
        return !filePathsToDelete.includes(openFilePath)
      })
      setOpenFiles(newOpenFiles)

      // If active file is being deleted, switch to another open file or null
      if (activeFile) {
        const activeFilePath = activeFile.path || activeFile.name
        if (filePathsToDelete.includes(activeFilePath)) {
          setActiveFile(newOpenFiles[0] || null)
        }
      }

      // Delete from file system - use path-based matching for exact deletion
      const deleteItem = (
        items: FileSystemItem[],
        basePath: string = '',
      ): FileSystemItem[] => {
        return items
          .filter((i) => {
            const currentPath = basePath ? `${basePath}/${i.name}` : i.name
            // Only delete if the path matches exactly
            return !filePathsToDelete.includes(currentPath)
          })
          .map((i) => {
            const currentPath = basePath ? `${basePath}/${i.name}` : i.name
            if (i.type === 'folder') {
              return { ...i, items: deleteItem(i.items, currentPath) }
            }
            return i
          })
      }

      // Process the root folder correctly - fsData is an array with root as first element
      const newFileSystem = prevFsData.map((rootItem) => {
        if (rootItem.type === 'folder') {
          return {
            ...rootItem,
            items: deleteItem(rootItem.items, ''),
          }
        }
        return rootItem
      })

      // Clean up pending changes for deleted files
      setPendingChanges((prev) => {
        const next = new Map(prev)
        filePathsToDelete.forEach((path) => {
          next.delete(path)
        })
        return next
      })

      // Clean up unsaved files for deleted files
      setUnsavedFiles((prev) => {
        const next = new Set(prev)
        filePathsToDelete.forEach((path) => {
          next.delete(path)
        })
        return next
      })

      console.log(
        'handleDeleteItem: Deletion complete. New fsData items:',
        newFileSystem.length,
      )

      return newFileSystem
    })

    setDeleteConfirmDialog(null)
  }

  const deleteItemDirectly = useCallback((item: FileSystemItem, itemPath: string) => {
    setFsData((prevFsData) => {
      // Helper function to collect all file paths in a folder (recursive)
      const collectFilePaths = (
        items: FileSystemItem[],
        basePath: string = '',
      ): string[] => {
        const filePaths: string[] = []
        items.forEach((item) => {
          const currentPath = basePath ? `${basePath}/${item.name}` : item.name
          if (item.type === 'file') {
            filePaths.push(currentPath)
          } else if (item.type === 'folder') {
            filePaths.push(...collectFilePaths(item.items, currentPath))
          }
        })
        return filePaths
      }

      // Get all file paths that will be deleted
      const filePathsToDelete: string[] = []
      if (itemPath) {
        filePathsToDelete.push(itemPath)
        if (item.type === 'folder') {
          filePathsToDelete.push(...collectFilePaths(item.items, itemPath))
        }
      } else {
        if (item.type === 'file') {
          filePathsToDelete.push(item.name)
        } else if (item.type === 'folder') {
          filePathsToDelete.push(...collectFilePaths(item.items))
        }
      }

      // Remove deleted files from open files list
      setOpenFiles((prev) =>
        prev.filter((openFile) => {
          const openFilePath = openFile.path || openFile.name
          return !filePathsToDelete.includes(openFilePath)
        })
      )

      // If active file is being deleted, switch to another open file or null
      setActiveFile((prev) => {
        if (!prev) return null
        const activeFilePath = prev.path || prev.name
        if (filePathsToDelete.includes(activeFilePath)) {
          const remainingFiles = openFiles.filter((openFile) => {
            const openFilePath = openFile.path || openFile.name
            return !filePathsToDelete.includes(openFilePath)
          })
          return remainingFiles[0] || null
        }
        return prev
      })

      // Delete from file system
      const deleteItem = (
        items: FileSystemItem[],
        basePath: string = '',
      ): FileSystemItem[] => {
        return items
          .filter((i) => {
            const currentPath = basePath ? `${basePath}/${i.name}` : i.name
            return !filePathsToDelete.includes(currentPath)
          })
          .map((i) => {
            const currentPath = basePath ? `${basePath}/${i.name}` : i.name
            if (i.type === 'folder') {
              return { ...i, items: deleteItem(i.items, currentPath) }
            }
            return i
          })
      }

      // Process the root folder correctly
      const newFileSystem = prevFsData.map((rootItem) => {
        if (rootItem.type === 'folder') {
          return {
            ...rootItem,
            items: deleteItem(rootItem.items, ''),
          }
        }
        return rootItem
      })

      // Clean up pending changes for deleted files
      setPendingChanges((prev) => {
        const next = new Map(prev)
        filePathsToDelete.forEach((path) => {
          next.delete(path)
        })
        return next
      })

      // Clean up unsaved files for deleted files
      setUnsavedFiles((prev) => {
        const next = new Set(prev)
        filePathsToDelete.forEach((path) => {
          next.delete(path)
        })
        return next
      })

      return newFileSystem
    })
  }, [openFiles])

  const handleRenameItem = (
    item: FileSystemItem,
    itemPath: string,
    newName: string,
  ) => {
    // Calculate new path
    const pathParts = itemPath.split('/')
    pathParts[pathParts.length - 1] = newName
    const newPath = pathParts.join('/')

    const renameItem = (
      items: FileSystemItem[],
      currentPath: string = '',
    ): FileSystemItem[] => {
      return items.map((i) => {
        const fullPath = currentPath ? `${currentPath}/${i.name}` : i.name

        // Only rename if this is the exact item at the specified path
        if (fullPath === itemPath) {
          return { ...i, name: newName, path: newPath }
        }

        // Recursively search in folders
        if (i.type === 'folder') {
          return { ...i, items: renameItem(i.items, fullPath) }
        }
        return i
      })
    }

    // Process root folder - fsData is array where index 0 is root
    const newFileSystem = fsData.map((rootItem) => {
      if (rootItem.type === 'folder') {
        return {
          ...rootItem,
          items: renameItem(rootItem.items, ''),
        }
      }
      return rootItem
    })
    setFsData(newFileSystem)

    // Update open files if the renamed file is open
    setOpenFiles((prev) =>
      prev.map((f) => {
        const filePath = f.path || f.name
        if (filePath === itemPath) {
          return { ...f, name: newName, path: newPath }
        }
        return f
      })
    )

    // Update active file if it's the renamed file
    if (activeFile) {
      const activePath = activeFile.path || activeFile.name
      if (activePath === itemPath) {
        setActiveFile({ ...activeFile, name: newName, path: newPath })
      }
    }

    // Update pending changes and unsaved files with new path
    if (pendingChanges.has(itemPath)) {
      const content = pendingChanges.get(itemPath)!
      setPendingChanges((prev) => {
        const next = new Map(prev)
        next.delete(itemPath)
        next.set(newPath, content)
        return next
      })
    }

    if (unsavedFiles.has(itemPath)) {
      setUnsavedFiles((prev) => {
        const next = new Set(prev)
        next.delete(itemPath)
        next.add(newPath)
        return next
      })
    }
  }

  const handleMoveItem = (
    item: FileSystemItem,
    sourcePath: string,
    targetFolder: Folder,
  ) => {
    const targetPath = targetFolder.path || targetFolder.name

    // Prevent moving item into itself or its children
    if (sourcePath === targetPath || targetPath.startsWith(sourcePath + '/')) {
      console.log('Cannot move item into itself or its children')
      return
    }

    // Atomic move: delete from source and add to target in a single operation
    setFsData((prevFsData) => {
      // Step 1: Delete from source path
      const deleteFromSource = (
        items: FileSystemItem[],
        basePath: string = '',
      ): FileSystemItem[] => {
        return items
          .filter((i) => {
            const currentPath = basePath ? `${basePath}/${i.name}` : i.name
            return currentPath !== sourcePath
          })
          .map((i) => {
            const currentPath = basePath ? `${basePath}/${i.name}` : i.name
            if (i.type === 'folder') {
              return { ...i, items: deleteFromSource(i.items, currentPath) }
            }
            return i
          })
      }

      // Step 2: Add to target location with proper path-based matching
      const addToTarget = (
        items: FileSystemItem[],
        basePath: string = '',
      ): FileSystemItem[] => {
        return items.map((i) => {
          const currentPath = basePath ? `${basePath}/${i.name}` : i.name
          // Found the target folder using path-based matching
          if (currentPath === targetPath) {
            if (i.type === 'folder') {
              // Set the proper path for the moved item
              const movedItem = {
                ...item,
                path: `${currentPath}/${item.name}`,
              }
              return {
                ...i,
                items: [...i.items, movedItem],
              }
            }
          }
          // Recursively search in subfolders
          if (i.type === 'folder') {
            return { ...i, items: addToTarget(i.items, currentPath) }
          }
          return i
        })
      }

      // For root folder target
      if (targetPath === 'root' || targetPath === '') {
        // The root folder is always the first item in prevFsData (regardless of its name)
        const afterDelete = prevFsData.map((rootItem, index) => {
          if (index === 0 && rootItem.type === 'folder') {
            return {
              ...rootItem,
              items: deleteFromSource(rootItem.items, ''),
            }
          }
          return rootItem
        })

        const result = afterDelete.map((rootItem, index) => {
          if (index === 0 && rootItem.type === 'folder') {
            // Set proper path for root level items
            const movedItem = {
              ...item,
              path: item.name,
            }
            return {
              ...rootItem,
              items: [...rootItem.items, movedItem],
            }
          }
          return rootItem
        })

        return result
      }

      // For non-root target folder
      const afterDelete = prevFsData.map((rootItem) => {
        if (rootItem.type === 'folder') {
          return {
            ...rootItem,
            items: deleteFromSource(rootItem.items, ''),
          }
        }
        return rootItem
      })

      // Now add the item to the target folder
      const result = afterDelete.map((rootItem) => {
        if (rootItem.type === 'folder' && rootItem.items) {
          return {
            ...rootItem,
            items: addToTarget(rootItem.items, ''),
          }
        }
        return rootItem
      })

      return result
    })

    // Clean up any pending changes for the moved file
    setPendingChanges((prev) => {
      const next = new Map(prev)
      // Only keep pending changes for files that still exist
      next.delete(sourcePath)
      return next
    })

    setUnsavedFiles((prev) => {
      const next = new Set(prev)
      next.delete(sourcePath)
      return next
    })
  }

  // Helper function to merge nested item into existing folder structure
  const mergeItemIntoFolder = (
    targetFolder: Folder,
    item: FileSystemItem,
  ): Folder => {
    // If item is a file, check for duplicates before adding
    if (item.type === 'file') {
      const existingFile = targetFolder.items.find(
        (i) => i.type === 'file' && i.name.toLowerCase() === item.name.toLowerCase()
      )
      if (existingFile) {
        // File already exists, show error
        setErrorDialog({ message: `A file named "${item.name}" already exists in this location.` })
        return targetFolder
      }
      return {
        ...targetFolder,
        items: [...targetFolder.items, item],
      }
    }

    // If item is a folder, check if folder with same name exists
    const existingFolder = targetFolder.items.find(
      (i) => i.type === 'folder' && i.name.toLowerCase() === item.name.toLowerCase()
    ) as Folder | undefined

    if (existingFolder) {
      // Folder exists, merge each child item recursively
      let mergedFolder = { ...existingFolder }

      for (const childItem of item.items) {
        // Check if child item already exists
        if (childItem.type === 'file') {
          const existingChildFile = mergedFolder.items.find(
            (i) => i.type === 'file' && i.name.toLowerCase() === childItem.name.toLowerCase()
          )
          if (existingChildFile) {
            setErrorDialog({ message: `A file named "${childItem.name}" already exists in "${existingFolder.name}".` })
            continue // Skip this file
          }
        }

        mergedFolder = mergeItemIntoFolder(mergedFolder, childItem)
      }

      return {
        ...targetFolder,
        items: targetFolder.items.map((i) => {
          if (i.type === 'folder' && i.name.toLowerCase() === item.name.toLowerCase()) {
            return mergedFolder
          }
          return i
        }),
      }
    } else {
      // Folder doesn't exist, add it
      return {
        ...targetFolder,
        items: [...targetFolder.items, item],
      }
    }
  }

  const handleAddItemToRoot = (type: 'file' | 'folder') => {
    setCreatingAtRoot({ type })
    setNewRootItemName('')
  }

  const handleRootCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (creatingAtRoot && newRootItemName.trim()) {
      const root = fsData[0]
      if (root && root.type === 'folder') {
        let name = newRootItemName.trim()

        // Normalize path: remove leading/trailing slashes and double slashes
        name = name.replace(/^\/+|\/+$/g, '') // Remove leading/trailing slashes
        name = name.replace(/\/+/g, '/') // Replace multiple slashes with single

        if (!name) {
          setCreatingAtRoot(null)
          setNewRootItemName('')
          return
        }

        // Check if name contains path separator
        if (name.includes('/')) {
          // Split into parts and create nested structure
          const parts = name.split('/').filter(p => p.trim())

          if (parts.length === 0) {
            setCreatingAtRoot(null)
            setNewRootItemName('')
            return
          }

          // Validate each part
          for (const part of parts) {
            const partValidation = validateFileName(part)
            if (!partValidation.valid) {
              setErrorDialog({ message: `Invalid name in path: ${partValidation.error}` })
              return
            }
          }

          // Build nested folder structure
          let currentItem: FileSystemItem
          let actualFile: File | null = null // Keep reference to the actual file


          if (creatingAtRoot.type === 'file') {
            const fileName = parts.pop()!
            actualFile = { type: 'file', name: fileName, content: '' }
            currentItem = actualFile

            for (let i = parts.length - 1; i >= 0; i--) {
              currentItem = { type: 'folder', name: parts[i], items: [currentItem] }
            }
          } else {
            currentItem = { type: 'folder', name: parts[parts.length - 1], items: [] }

            for (let i = parts.length - 2; i >= 0; i--) {
              currentItem = { type: 'folder', name: parts[i], items: [currentItem] }
            }
          }

          setFsData((prevFsData) => {
            const newFsData = [...prevFsData]
            const rootItem = newFsData[0]
            if (rootItem && rootItem.type === 'folder') {
              // Use merge function to handle existing folders
              const mergedRoot = mergeItemIntoFolder(rootItem, currentItem)
              newFsData[0] = mergedRoot

              // If creating a file, find it in the merged structure and select it
              if (creatingAtRoot.type === 'file' && actualFile) {
                // Helper function to find file by full path
                const findFileByPath = (
                  folder: Folder,
                  targetPath: string,
                  currentPath: string = ''
                ): File | null => {
                  for (const item of folder.items) {
                    const itemPath = currentPath ? `${currentPath}/${item.name}` : item.name

                    if (item.type === 'file' && itemPath === targetPath) {
                      return { ...item, path: itemPath } as File
                    }

                    if (item.type === 'folder') {
                      const found = findFileByPath(item, targetPath, itemPath)
                      if (found) return found
                    }
                  }
                  return null
                }

                // Calculate the full path of the file
                const filePath = parts.length > 0
                  ? `${parts.join('/')}/${actualFile.name}`
                  : actualFile.name

                // Find the file in merged structure
                const foundFile = findFileByPath(mergedRoot, filePath)

                if (foundFile) {
                  // Use setTimeout to ensure state is set first
                  setTimeout(() => {
                    setActiveFile(foundFile)
                    // Check if file is already in openFiles by path
                    setOpenFiles((prev) => {
                      const filePath = foundFile.path || foundFile.name
                      const exists = prev.some((f) => (f.path || f.name) === filePath)
                      if (!exists) {
                        return [...prev, foundFile]
                      }
                      return prev
                    })
                  }, 50)
                }
              }

              return newFsData
            }
            return prevFsData
          })

          // Auto-select new file - find it in the merged structure
          if (creatingAtRoot.type === 'file' && actualFile) {
            setTimeout(() => {
              // Helper function to find file in nested structure
              const findFileInFolder = (
                folder: Folder,
                fileName: string,
                currentPath: string = ''
              ): File | null => {
                for (const item of folder.items) {
                  const itemPath = currentPath ? `${currentPath}/${item.name}` : item.name
                  if (item.type === 'file' && item.name === fileName) {
                    return { ...item, path: itemPath } as File
                  }
                  if (item.type === 'folder') {
                    const found = findFileInFolder(item, fileName, itemPath)
                    if (found) return found
                  }
                }
                return null
              }

              const root = fsData[0]
              if (root && root.type === 'folder') {
                const foundFile = findFileInFolder(root, actualFile.name)
                if (foundFile) {
                  setActiveFile(foundFile)
                  if (!openFiles.find((f) => (f.path || f.name) === (foundFile.path || foundFile.name))) {
                    setOpenFiles((prev) => [...prev, foundFile])
                  }
                }
              }
            }, 100) // Increase delay to ensure state is updated
          }
        } else {
          // Simple name - validate normally
          const validation = validateFileName(name)
          if (!validation.valid) {
            setErrorDialog({ message: validation.error || 'Invalid name' })
            return
          }

          // Check for duplicates
          if (root.items.some((item) => item.name === name)) {
            setErrorDialog({
              message: `${creatingAtRoot.type} with name "${name}" already exists at the root.`,
            })
            return
          }

          const newItem: FileSystemItem =
            creatingAtRoot.type === 'file'
              ? { type: 'file', name, content: '' }
              : { type: 'folder', name, items: [] }

          setFsData((prevFsData) => {
            const newFsData = [...prevFsData]
            const rootItem = newFsData[0]
            if (rootItem && rootItem.type === 'folder') {
              const newRoot: Folder = {
                ...rootItem,
                items: [...rootItem.items, newItem],
              }
              newFsData[0] = newRoot
              return newFsData
            }
            return prevFsData
          })

          // Auto-select new file
          if (creatingAtRoot.type === 'file') {
            setTimeout(() => {
              setActiveFile(newItem as File)
              if (!openFiles.find((f) => f.name === newItem.name)) {
                setOpenFiles((prev) => [...prev, newItem as File])
              }
            }, 50)
          }
        }

        setCreatingAtRoot(null)
        setNewRootItemName('')
      }
    }
  }

  const handleRefresh = () => {
    try {
      if (!data || data.trim() === '') {
        setFsData([{ type: 'folder', name: 'root', items: [] }])
        return
      }
      const parsed = JSON.parse(data)
      setFsData(
        Array.isArray(parsed)
          ? parsed
          : [{ type: 'folder', name: 'root', items: [] }],
      )
    } catch {
      setFsData([{ type: 'folder', name: 'root', items: [] }])
    }
  }

  const [allCollapsed, setAllCollapsed] = useState(false)

  const handleCollapseAll = () => {
    setAllCollapsed(true)
    // Let FileTree know it needs to collapse all
    setTimeout(() => setAllCollapsed(false), 0)
  }

  const handleAddItem = (parent: Folder, item: FileSystemItem) => {
    console.log('handleAddItem: Adding item to parent', { parent, item })
    setFsData((prevFsData) => {
      // Case add to root
      if (parent.name === 'root' || parent.path === 'root' || !parent.path) {
        const rootItem = prevFsData[0]
        if (rootItem && rootItem.type === 'folder') {
          // Use merge function to handle existing folders
          const mergedRoot = mergeItemIntoFolder(rootItem, item)
          return [mergedRoot]
        }
        return prevFsData
      }
      const addItem = (
        items: FileSystemItem[],
        currentPath: string = '',
      ): FileSystemItem[] => {
        return items.map((i) => {
          const itemPath = currentPath ? `${currentPath}/${i.name}` : i.name

          const normalizedItemPath = itemPath.startsWith('root/')
            ? itemPath.substring(5)
            : itemPath

          const isTargetFolder = i.type === 'folder' && (
            normalizedItemPath === parent.path ||
            (parent.path === 'root' && currentPath === '') ||
            (!parent.path && normalizedItemPath === parent.name && currentPath === '')
          )

          if (isTargetFolder) {
            // Check for duplicates to prevent race condition re-additions
            const existingItem = i.items.find((existing) => {
              const existingPath = itemPath
                ? `${itemPath}/${existing.name}`
                : existing.name
              const newItemPath = itemPath
                ? `${itemPath}/${item.name}`
                : item.name
              return existingPath === newItemPath
            })

            if (existingItem) {
              console.log(
                'handleAddItem: Item already exists, skipping addition',
                {
                  itemName: item.name,
                  targetPath: itemPath,
                },
              )
              return i // Don't add duplicate
            }

            // Add path to the new item
            const itemWithPath = {
              ...item,
              path: itemPath ? `${itemPath}/${item.name}` : item.name,
            }
            return { ...i, items: [...i.items, itemWithPath] }
          }
          if (i.type === 'folder') {
            return { ...i, items: addItem(i.items, itemPath) }
          }
          return i
        })
      }
      return addItem(prevFsData)
    })
  }

  const handleExport = () => {
    const zip = new JSZip()

    // Get the latest fsData with pending changes applied
    let dataToExport = fsDataRef.current
    const latestPendingChanges = pendingChangesRef.current

    // Apply pending changes to the data before exporting
    const applyPendingChanges = (
      items: FileSystemItem[],
      basePath: string = '',
    ): FileSystemItem[] => {
      return items.map((item) => {
        if (item.type === 'file') {
          const itemPath = basePath ? `${basePath}/${item.name}` : item.name
          // If this file has pending changes, use the pending content
          if (latestPendingChanges.has(itemPath)) {
            return {
              ...item,
              content: latestPendingChanges.get(itemPath)!,
            }
          }
          return item
        } else if (item.type === 'folder') {
          const folderPath = basePath ? `${basePath}/${item.name}` : item.name
          return {
            ...item,
            items: applyPendingChanges(item.items, folderPath),
          }
        }
        return item
      })
    }

    // Apply all pending changes to get the most up-to-date content
    const exportData = applyPendingChanges(dataToExport)

    const addFilesToZip = (items: FileSystemItem[], path: string) => {
      items.forEach((item) => {
        if (item.type === 'file') {
          // Handle binary files (base64 encoded)
          if (item.isBase64 && item.content) {
            try {
              const arrayBuffer = base64ToArrayBuffer(item.content)
              zip.file(path + item.name, arrayBuffer, { binary: true })
            } catch (error) {
              console.error(`Error converting base64 for ${item.name}:`, error)
              // Fallback to string content if conversion fails
              zip.file(path + item.name, item.content)
            }
          } else {
            // Regular text file
            zip.file(path + item.name, item.content || '')
          }
        } else if (item.type === 'folder') {
          addFilesToZip(item.items, path + item.name + '/')
        }
      })
    }

    // Get root folder items - fsData is an array where first element is root folder
    const rootFolder = exportData[0]
    if (rootFolder && rootFolder.type === 'folder' && rootFolder.items) {
      addFilesToZip(rootFolder.items, '')
    }

    const safeBase =
      (prototypeName || 'project')
        .trim()
        .replace(/[\\/:*?"<>|]/g, '')
        .replace(/\s+/g, '_')
        .slice(0, 80) || 'project'

    zip.generateAsync({ type: 'blob' }).then((content) => {
      const link = document.createElement('a')
      link.href = URL.createObjectURL(content)
      link.download = `${safeBase}.zip`
      link.click()
    })
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const zip = new JSZip()
      zip.loadAsync(event.target?.result as ArrayBuffer)
        .then((zip) => {
          const folders: { [key: string]: Folder } = {}

          const getOrCreateFolder = (path: string): Folder => {
            if (folders[path]) {
              return folders[path]
            }

            const parts = path.split('/')
            const folderName = parts.pop() || ''
            const parentPath = parts.join('/')
            const parentFolder = getOrCreateFolder(parentPath)

            const newFolder: Folder = {
              type: 'folder',
              name: folderName,
              items: [],
            }

            parentFolder.items.push(newFolder)
            folders[path] = newFolder
            return newFolder
          }

          const root: Folder = { type: 'folder', name: 'root', items: [] }
          folders[''] = root

          const promises = Object.values(zip.files).map(async (zipEntry) => {
            const path = zipEntry.name
            const parts = path.split('/').filter((p) => p)
            if (zipEntry.dir) {
              getOrCreateFolder(path.slice(0, -1))
            } else {
              const fileName = parts.pop() || ''
              const folderPath = parts.join('/')
              const folder = getOrCreateFolder(folderPath)

              // Handle binary files
              const isBin = isBinaryFile(fileName)
              if (isBin) {
                try {
                  const arrayBuffer = await zipEntry.async('arraybuffer')
                  if (arrayBuffer.byteLength > 500 * 1024) {
                    console.warn(
                      `File ${fileName} is larger than 500kb and will be ignored.`,
                    )
                    return
                  }
                  const base64Content = arrayBufferToBase64(arrayBuffer)
                  folder.items.push({
                    type: 'file',
                    name: fileName,
                    content: base64Content,
                    isBase64: true,
                  })
                } catch (error) {
                  console.error(`Error reading binary file ${fileName}:`, error)
                }
              } else {
                try {
                  const content = await zipEntry.async('string')
                  folder.items.push({ type: 'file', name: fileName, content })
                } catch (error) {
                  console.error(`Error reading file ${fileName}:`, error)
                }
              }
            }
          })

          Promise.all(promises)
            .then(() => {
              // Fix: Set fsData to [root] instead of root.items
              setFsData([root])
              // Clear open files and active file when importing
              setOpenFiles([])
              setActiveFile(null)
              setUnsavedFiles(new Set())
              setPendingChanges(new Map())
            })
            .catch((error) => {
              console.error('Error processing zip file:', error)
              setErrorDialog({
                message: 'Failed to import project. Please check if the file is a valid ZIP archive.',
              })
            })
        })
        .catch((error) => {
          console.error('Error loading zip file:', error)
          setErrorDialog({
            message: 'Failed to load ZIP file. Please check if the file is a valid ZIP archive.',
          })
        })
    }
    reader.onerror = () => {
      setErrorDialog({
        message: 'Failed to read file. Please try again.',
      })
    }
    reader.readAsArrayBuffer(file)
  }

  const handleUploadFile = (target: Folder) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files
      if (files) {
        handleDropFiles(files, target)
      }
    }
    input.click()
  }

  const handleDropFiles = (files: FileList, target: Folder) => {
    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const isBin = isBinaryFile(file.name)

        if (isBin) {
          const content = event.target?.result as ArrayBuffer
          if (content.byteLength > 500 * 1024) {
            console.warn(
              `File ${file.name} is larger than 500kb and will be ignored.`,
            )
            return
          }
          const base64Content = arrayBufferToBase64(content)
          const currentTarget = getCurrentTargetFolder(target)
          const uniqueFileName = findUniqueFileName(file.name, currentTarget)
          const newItem: File = {
            type: 'file',
            name: uniqueFileName,
            content: base64Content,
            isBase64: true,
          }

          // Handle root folder case
          if (target.name === 'root') {
            // Add to the root folder's items (fsData[0] should be the root folder)
            setFsData((prevFsData) => {
              const newFsData = [...prevFsData]
              const rootFolder = newFsData[0]
              if (rootFolder && rootFolder.type === 'folder') {
                rootFolder.items = [...rootFolder.items, newItem]
              } else {
                // If no root folder exists, create one
                newFsData.unshift({
                  type: 'folder',
                  name: 'root',
                  items: [newItem],
                })
              }
              return newFsData
            })
          } else {
            handleAddItem(target, newItem)
          }
        } else {
          const content = event.target?.result as string
          const currentTarget = getCurrentTargetFolder(target)
          const uniqueFileName = findUniqueFileName(file.name, currentTarget)
          const newItem: File = { type: 'file', name: uniqueFileName, content }

          // Handle root folder case
          if (target.name === 'root') {
            // Add to the root folder's items (fsData[0] should be the root folder)
            setFsData((prevFsData) => {
              const newFsData = [...prevFsData]
              const rootFolder = newFsData[0]
              if (rootFolder && rootFolder.type === 'folder') {
                rootFolder.items = [...rootFolder.items, newItem]
              } else {
                // If no root folder exists, create one
                newFsData.unshift({
                  type: 'folder',
                  name: 'root',
                  items: [newItem],
                })
              }
              return newFsData
            })
          } else {
            handleAddItem(target, newItem)
          }
        }
      }
      reader.onerror = (error) => {
        console.error('File reader error:', error)
      }
      if (isBinaryFile(file.name)) {
        reader.readAsArrayBuffer(file)
      } else {
        reader.readAsText(file)
      }
    })
  }

  const triggerImport = () => {
    setImportConfirmDialog(true)
  }

  const findUniqueFileName = (baseName: string, targetFolder: Folder): string => {
    const existingNames = new Set(
      targetFolder.items.map((item) => item.name.toLowerCase())
    )

    if (!existingNames.has(baseName.toLowerCase())) {
      return baseName
    }

    // Parse the base name and extension
    const lastDotIndex = baseName.lastIndexOf('.')
    let nameWithoutExt = baseName
    let ext = ''

    if (lastDotIndex > 0) {
      nameWithoutExt = baseName.substring(0, lastDotIndex)
      ext = baseName.substring(lastDotIndex)
    }

    // Find the next available number
    let counter = 1
    let newName = `${nameWithoutExt}-${counter}${ext}`

    while (existingNames.has(newName.toLowerCase())) {
      counter++
      newName = `${nameWithoutExt}-${counter}${ext}`
    }

    return newName
  }

  // Helper function to get current target folder state
  const getCurrentTargetFolder = (target: Folder): Folder => {
    if (target.name === 'root') {
      const rootFolder = fsDataRef.current[0]
      if (rootFolder && rootFolder.type === 'folder') {
        return rootFolder
      }
      return { type: 'folder', name: 'root', items: [] }
    }

    // Find folder by path
    const findFolderByPath = (
      targetPath: string,
      items: FileSystemItem[],
    ): Folder | null => {
      for (const item of items) {
        if (item.type === 'folder') {
          const itemPath = item.path || item.name
          if (itemPath === targetPath) {
            return item
          }
          const found = findFolderByPath(targetPath, item.items)
          if (found) return found
        }
      }
      return null
    }

    const targetPath = target.path || target.name
    const found = findFolderByPath(targetPath, fsDataRef.current)
    return found || target
  }

  const handleImportConfirm = () => {
    setImportConfirmDialog(false)
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.zip'
    input.onchange = (e) => handleImport(e as any)
    input.click()
  }

  const handleImportCancel = () => {
    setImportConfirmDialog(false)
  }

  const root = fsData[0]
  const projectName = 'Editor'
  const projectItems = root?.type === 'folder' ? root.items : []

  return (
    <div className="flex h-screen bg-white text-gray-800 font-sans overflow-hidden">
      <div
        className="bg-gray-50 border-r border-gray-200 relative transition-all duration-200 ease-in-out"
        style={{ width: isCollapsed ? collapsedWidth : leftPanelWidth }}
      >
        {isCollapsed ? (
          // Collapsed view - thin column with just expand button
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-center py-2 border-b border-gray-200 bg-gray-100">
              <button
                onClick={toggleCollapse}
                title="Expand Panel"
                className="p-1.5 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowRightFromLine size={16} />
              </button>
            </div>
            <div className="flex-1 flex items-start justify-center pt-32">
              <div
                className="text-2xl font-bold text-gray-700 tracking-wider"
                style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
              >
                File Tree
              </div>
            </div>
          </div>
        ) : (
          // Expanded view - normal layout
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex items-center px-1 py-2 border-b border-gray-200 bg-gray-100 flex-shrink-0">
              <button
                onClick={toggleCollapse}
                title="Collapse Panel"
                className="p-1.5 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700 transition-colors"
              >
                <CopyMinus size={16} />
              </button>
              <span className="grow pl-1 font-semibold text-sm tracking-wide text-gray-700 overflow-hidden text-ellipsis">
                {projectName.toUpperCase()}
              </span>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handleAddItemToRoot('file')}
                  title="New File"
                  className="p-1.5 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <VscNewFile size={16} />
                </button>
                <button
                  onClick={() => handleAddItemToRoot('folder')}
                  title="New Folder"
                  className="p-1.5 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <VscNewFolder size={16} />
                </button>
                <button
                  onClick={handleExport}
                  title="Download Project as ZIP"
                  className="p-1.5 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <VscCloudDownload size={16} />
                </button>
                <button
                  onClick={triggerImport}
                  title="Import Project from ZIP"
                  className="p-1.5 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <VscCloudUpload size={16} />
                </button>
                {/* <button
                  onClick={handleRefresh}
                  title="Refresh"
                  className="p-1.5 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <VscRefresh size={16} />
                </button> */}
                <button
                  onClick={handleCollapseAll}
                  title="Collapse All"
                  className="p-1.5 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <VscCollapseAll size={16} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              {/* Inline creation input at root level */}
              {creatingAtRoot && (
                <div className="flex items-center py-[1px] px-2 text-gray-700 text-[13px] border-b border-gray-100">
                  <form
                    onSubmit={handleRootCreateSubmit}
                    className="w-full flex items-center"
                  >
                    {creatingAtRoot.type === 'folder' ? (
                      <VscNewFolder
                        className="mr-2 text-gray-500 flex-shrink-0"
                        size={16}
                      />
                    ) : (
                      <VscNewFile
                        className="mr-2 text-gray-500 flex-shrink-0"
                        size={16}
                      />
                    )}
                    <input
                      type="text"
                      value={newRootItemName}
                      onChange={(e) => setNewRootItemName(e.target.value)}
                      onBlur={() => {
                        if (!newRootItemName.trim()) {
                          setCreatingAtRoot(null)
                          setNewRootItemName('')
                        }
                      }}
                      autoFocus
                      placeholder={`Enter ${creatingAtRoot.type} name...`}
                      className="bg-white border border-blue-500 rounded px-1.5 py-0.5 w-full text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </form>
                </div>
              )}
              <FileTree
                items={projectItems}
                onFileSelect={handleFileSelect}
                onDeleteItem={handleDeleteItem}
                onDeleteItemDirectly={deleteItemDirectly}
                onRenameItem={handleRenameItem}
                onAddItem={handleAddItem}
                onMoveItem={handleMoveItem}
                onUploadFile={handleUploadFile}
                onDropFiles={handleDropFiles}
                allCollapsed={allCollapsed}
                activeFile={activeFile}
              />
            </div>
          </div>
        )}
        {/* Resize Handle - only show when not collapsed */}
        {!isCollapsed && (
          <div
            ref={resizeRef}
            className={`absolute top-0 right-0 w-1 h-full cursor-col-resize bg-transparent hover:bg-blue-500 hover:bg-opacity-50 transition-colors ${isResizing ? 'bg-blue-500 bg-opacity-50' : ''
              }`}
            onMouseDown={handleMouseDown}
            title="Drag to resize"
          >
            <div className="w-full h-full flex items-center justify-center">
              <div
                className={`w-0.5 h-8 bg-gray-400 transition-opacity ${isResizing ? 'opacity-100' : 'opacity-0 hover:opacity-60'}`}
              />
            </div>
          </div>
        )}
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <EditorComponent
          file={activeFile}
          openFiles={openFiles}
          onSelectFile={setActiveFile}
          onCloseFile={handleCloseFile}
          onContentChange={handleContentChange}
          unsavedFiles={unsavedFiles}
          onSave={saveFile}
          onSaveAll={saveAllFiles}
          onCreateFile={() => handleAddItemToRoot('file')}
          onCreateFolder={() => handleAddItemToRoot('folder')}
          onSelectFirstFile={() => {
            const firstFile = fsData.flatMap((item) => {
              const getFilesRecursive = (item: FileSystemItem): File[] => {
                if (item.type === 'file') return [item as File]
                if (item.type === 'folder') {
                  return item.items.flatMap(getFilesRecursive)
                }
                return []
              }
              return getFilesRecursive(item)
            })[0]

            if (firstFile) {
              setActiveFile(firstFile)
              const firstFilePath = (firstFile as any).path || firstFile.name
              if (
                !openFiles.find((f) => (f.path || f.name) === firstFilePath)
              ) {
                setOpenFiles((prev) => [...prev, firstFile])
              }
            }
          }}
        />
      </div>

      {/* Close confirmation dialog */}
      {closeConfirmDialog && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-semibold mb-2">Unsaved Changes</h2>
            <p className="text-gray-600 mb-4">
              Do you want to save the changes you made to{' '}
              <span className="font-semibold">"{closeConfirmDialog.file.name}"</span>?
            </p>
            <p className="text-gray-500 text-sm mb-4">
              Your changes will be lost if you don't save them.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCloseConfirmSave}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-md transition-colors"
              >
                Save
              </button>
              <button
                onClick={handleCloseConfirmDontSave}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors"
              >
                Don't Save
              </button>
              <button
                onClick={handleCloseConfirmCancel}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {deleteConfirmDialog && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-semibold mb-2">Delete Item</h2>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete{' '}
              <span className="font-semibold">"{deleteConfirmDialog.itemName}"</span>?
            </p>
            {deleteConfirmDialog.item.type === 'folder' && (
              <p className="text-red-600 text-sm mb-4">
                This will delete the folder and all its contents. This action cannot be undone.
              </p>
            )}
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirmDialog(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import confirmation dialog */}
      {importConfirmDialog && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-semibold mb-2">Import Project</h2>
            <p className="text-gray-600 mb-4">
              Are you sure you want to import a new project? This will replace the current project and any unsaved changes will be lost.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleImportConfirm}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-md transition-colors"
              >
                Import
              </button>
              <button
                onClick={handleImportCancel}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error dialog */}
      {errorDialog && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-semibold mb-2 text-red-600">Error</h2>
            <p className="text-gray-600 mb-4">{errorDialog.message}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setErrorDialog(null)}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-md transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectEditor
