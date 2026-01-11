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
import GitHubAuth from '@/components/molecules/github/GitHubAuth'
import GitOperations from '@/components/molecules/github/GitOperations'

interface ProjectEditorProps {
  data: string
  onChange: (data: string) => void
  onSave?: (data: string) => Promise<void>
  prototypeId?: string
}

const ProjectEditor: React.FC<ProjectEditorProps> = ({
  data,
  onChange,
  onSave,
  prototypeId,
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
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [githubAuthenticated, setGithubAuthenticated] = useState(false)
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
      if (!fileToSave) return currentFsData || []

      const filePath = fileToSave.path || fileToSave.name
      if (!pendingChanges.has(filePath)) return currentFsData || []

      const newContent = pendingChanges.get(filePath)!

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

      // Create updated data
      const updatedData = updateFileInData(currentFsData || [])
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

      return updatedData
    },
    [activeFile, pendingChanges],
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
    const newOpenFiles = openFiles.filter(
      (f) => (f.path || f.name) !== filePath,
    )
    setOpenFiles(newOpenFiles)
    if (activeFile) {
      const activePath = activeFile.path || activeFile.name
      if (activePath === filePath) {
        setActiveFile(newOpenFiles[0] || null)
      }
    }
  }

  const handleDeleteItem = (item: FileSystemItem) => {
    // Safety check: ensure item exists and has required properties
    if (!item || !item.type || !item.name) {
      console.warn('handleDeleteItem: Invalid item provided', item)
      return
    }

    // Check if this is a deletion with path information (set by context menu or cut operations)
    const deletePath = (item as any).__originalPath

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
      if (deletePath) {
        // If we have the exact path, use it directly
        filePathsToDelete.push(deletePath)
        // Also collect files inside if it's a folder
        if (item.type === 'folder') {
          filePathsToDelete.push(...collectFilePaths(item.items, deletePath))
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
  }

  const handleRenameItem = (
    item: FileSystemItem,
    itemPath: string,
    newName: string,
  ) => {
    const renameItem = (
      items: FileSystemItem[],
      currentPath: string = '',
    ): FileSystemItem[] => {
      return items.map((i) => {
        const fullPath = currentPath ? `${currentPath}/${i.name}` : i.name

        // Only rename if this is the exact item at the specified path
        if (fullPath === itemPath) {
          return { ...i, name: newName }
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

  const handleAddItemToRoot = (type: 'file' | 'folder') => {
    setCreatingAtRoot({ type })
    setNewRootItemName('')
  }

  const handleRootCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (creatingAtRoot && newRootItemName.trim()) {
      const root = fsData[0]
      if (root && root.type === 'folder') {
        const name = newRootItemName.trim()

        // Check for duplicates
        if (root.items.some((item) => item.name === name)) {
          alert(
            `${creatingAtRoot.type} with name "${name}" already exists at the root.`,
          )
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
    setFsData((prevFsData) => {
      const addItem = (
        items: FileSystemItem[],
        currentPath: string = '',
      ): FileSystemItem[] => {
        return items.map((i) => {
          const itemPath = currentPath ? `${currentPath}/${i.name}` : i.name
          if (
            (i.name === parent.name || (!i.path && parent.path === 'root')) &&
            i.type === 'folder'
          ) {
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

    const addFilesToZip = (items: FileSystemItem[], path: string) => {
      items.forEach((item) => {
        if (item.type === 'file') {
          zip.file(path + item.name, item.content)
        } else {
          addFilesToZip(item.items, path + item.name + '/')
        }
      })
    }

    addFilesToZip(fsData, '')

    zip.generateAsync({ type: 'blob' }).then((content) => {
      const link = document.createElement('a')
      link.href = URL.createObjectURL(content)
      link.download = 'project.zip'
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
      zip.loadAsync(event.target?.result as ArrayBuffer).then((zip) => {
        const fileSystem: FileSystemItem[] = []
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
            const content = await zipEntry.async('string')
            folder.items.push({ type: 'file', name: fileName, content })
          }
        })

        Promise.all(promises).then(() => {
          setFsData(root.items)
        })
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
          const newItem: File = {
            type: 'file',
            name: file.name,
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
          const newItem: File = { type: 'file', name: file.name, content }

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
    if (
      window.confirm(
        'Are you sure you want to import a new project? This will replace the current project and any unsaved changes will be lost.',
      )
    ) {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.zip'
      input.onchange = (e) => handleImport(e as any)
      input.click()
    }
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
                className="p-2 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700 transition-colors"
              >
                <VscChevronRight size={20} />
              </button>
            </div>
            <div className="flex-1"></div>
          </div>
        ) : (
          // Expanded view - normal layout
          <>
            <div className="flex items-center px-1 py-2 border-b border-gray-200 bg-gray-100">
              <button
                onClick={toggleCollapse}
                title="Collapse Panel"
                className="p-1.5 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700 transition-colors"
              >
                <VscChevronLeft size={16} />
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
            <div className="overflow-y-auto overflow-x-visible flex-1">
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
                onRenameItem={handleRenameItem}
                onAddItem={handleAddItem}
                onMoveItem={handleMoveItem}
                onUploadFile={handleUploadFile}
                onDropFiles={handleDropFiles}
                allCollapsed={allCollapsed}
                activeFile={activeFile}
              />
            </div>
            
            {/* GitHub Integration Section */}
            <div className="border-t border-gray-200 bg-gray-50">
              <div className="p-2">
                <GitHubAuth onAuthChange={setGithubAuthenticated} />
              </div>
              {githubAuthenticated && prototypeId && (
                <div className="px-2 pb-2 border-t border-gray-200 pt-2">
                  <GitOperations
                    prototypeId={prototypeId}
                    projectData={JSON.stringify(fsData)}
                    onPull={(pulledData) => {
                      try {
                        const parsed = JSON.parse(pulledData)
                        setFsData(Array.isArray(parsed) ? parsed : [{ type: 'folder', name: 'root', items: [] }])
                      } catch (error) {
                        console.error('Failed to parse pulled data:', error)
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </>
        )}
        {/* Resize Handle - only show when not collapsed */}
        {!isCollapsed && (
          <div
            ref={resizeRef}
            className={`absolute top-0 right-0 w-1 h-full cursor-col-resize bg-transparent hover:bg-blue-500 hover:bg-opacity-50 transition-colors ${
              isResizing ? 'bg-blue-500 bg-opacity-50' : ''
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
    </div>
  )
}

export default ProjectEditor
