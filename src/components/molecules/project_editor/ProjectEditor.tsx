// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { FileSystemItem, File, Folder } from './types'
import FileTree from './FileTree'
import EditorComponent from './Editor'
import JSZip from 'jszip'
import {
  isBinaryFile,
  arrayBufferToBase64,
  base64ToArrayBuffer,
} from '../../../lib/utils'

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

interface ProjectEditorProps {
  data: string
  onChange: (data: string) => void
}

const ProjectEditor: React.FC<ProjectEditorProps> = ({ data, onChange }) => {
  const [fsData, setFsData] = useState<FileSystemItem[]>(() => JSON.parse(data))
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
  const resizeRef = useRef<HTMLDivElement>(null)
  const collapsedWidth = 48 // Width when collapsed

  // Handle file content changes
  const handleContentChange = useCallback(
    (file: File, content: string) => {
      // Mark file as unsaved
      setUnsavedFiles((prev) => new Set(prev).add(file.name))

      // Store the pending change
      setPendingChanges((prev) => new Map(prev).set(file.name, content))

      // Update the open files to show the new content
      setOpenFiles((prev) =>
        prev.map((f) => (f.name === file.name ? { ...f, content } : f)),
      )

      // Update active file if it's the one being edited
      if (activeFile?.name === file.name) {
        setActiveFile({ ...activeFile, content })
      }
    },
    [activeFile],
  )

  // Save a specific file
  const saveFile = useCallback(
    (file?: File) => {
      const fileToSave = file || activeFile
      if (!fileToSave || !pendingChanges.has(fileToSave.name)) return

      const newContent = pendingChanges.get(fileToSave.name)!

      // Update the file system data
      const updateFileInData = (items: FileSystemItem[]): FileSystemItem[] => {
        return items.map((item) => {
          if (item.type === 'file' && item.name === fileToSave.name) {
            return { ...item, content: newContent }
          } else if (item.type === 'folder') {
            return { ...item, items: updateFileInData(item.items) }
          }
          return item
        })
      }

      setFsData((prev) => updateFileInData(prev))

      // Remove from unsaved files and pending changes
      setUnsavedFiles((prev) => {
        const next = new Set(prev)
        next.delete(fileToSave.name)
        return next
      })

      setPendingChanges((prev) => {
        const next = new Map(prev)
        next.delete(fileToSave.name)
        return next
      })
    },
    [activeFile, pendingChanges],
  )

  // Save all files
  const saveAllFiles = useCallback(() => {
    unsavedFiles.forEach((fileName) => {
      const file = openFiles.find((f) => f.name === fileName)
      if (file) {
        saveFile(file)
      }
    })
  }, [unsavedFiles, openFiles, saveFile])

  // Add keyboard shortcuts for save operations
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (e.shiftKey) {
          // Ctrl/Cmd + Shift + S: Save All
          saveAllFiles()
        } else {
          // Ctrl/Cmd + S: Save current file
          if (activeFile && unsavedFiles.has(activeFile.name)) {
            saveFile(activeFile)
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [activeFile, unsavedFiles, saveFile, saveAllFiles])

  useEffect(() => {
    onChange(JSON.stringify(fsData))
  }, [fsData, onChange])

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev)
  }, [])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isCollapsed) return // Don't allow resizing when collapsed
      e.preventDefault()
      setIsResizing(true)
    },
    [isCollapsed],
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || isCollapsed) return

      const minWidth = 200
      const maxWidth = 600
      const newWidth = Math.min(Math.max(e.clientX, minWidth), maxWidth)
      setLeftPanelWidth(newWidth)
    },
    [isResizing, isCollapsed],
  )

  const handleMouseUp = useCallback(() => {
    setIsResizing(false)
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
    if (!openFiles.find((f) => f.name === file.name)) {
      setOpenFiles([...openFiles, file])
    }
    setActiveFile(file)
  }

  const handleCloseFile = (file: File) => {
    const newOpenFiles = openFiles.filter((f) => f.name !== file.name)
    setOpenFiles(newOpenFiles)
    if (activeFile?.name === file.name) {
      setActiveFile(newOpenFiles[0] || null)
    }
  }

  const handleDeleteItem = (item: FileSystemItem) => {
    // Safety check: ensure item exists and has required properties
    if (!item || !item.type || !item.name) {
      console.warn('handleDeleteItem: Invalid item provided', item)
      return
    }

    // Helper function to collect all file names in a folder (recursive)
    const collectFileNames = (items: FileSystemItem[]): string[] => {
      const fileNames: string[] = []
      items.forEach((item) => {
        if (item.type === 'file') {
          fileNames.push(item.name)
        } else if (item.type === 'folder') {
          fileNames.push(...collectFileNames(item.items))
        }
      })
      return fileNames
    }

    // Get all file names that will be deleted
    const filesToDelete: string[] = []
    if (item.type === 'file') {
      filesToDelete.push(item.name)
    } else if (item.type === 'folder') {
      filesToDelete.push(...collectFileNames(item.items))
    }

    // Remove deleted files from open files list
    const newOpenFiles = openFiles.filter(
      (openFile) => !filesToDelete.includes(openFile.name),
    )
    setOpenFiles(newOpenFiles)

    // If active file is being deleted, switch to another open file or null
    if (activeFile && filesToDelete.includes(activeFile.name)) {
      setActiveFile(newOpenFiles[0] || null)
    }

    // Delete from file system
    const deleteItem = (items: FileSystemItem[]): FileSystemItem[] => {
      return items
        .filter((i) => i.name !== item.name)
        .map((i) => {
          if (i.type === 'folder') {
            return { ...i, items: deleteItem(i.items) }
          }
          return i
        })
    }
    const newFileSystem = deleteItem(fsData)
    setFsData(newFileSystem)
  }

  const handleRenameItem = (item: FileSystemItem, newName: string) => {
    const renameItem = (items: FileSystemItem[]): FileSystemItem[] => {
      return items.map((i) => {
        if (i.name === item.name) {
          return { ...i, name: newName }
        }
        if (i.type === 'folder') {
          return { ...i, items: renameItem(i.items) }
        }
        return i
      })
    }
    const newFileSystem = renameItem(fsData)
    setFsData(newFileSystem)
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
    setFsData(JSON.parse(data))
  }

  const [allCollapsed, setAllCollapsed] = useState(false)

  const handleCollapseAll = () => {
    setAllCollapsed(true)
    // Let FileTree know it needs to collapse all
    setTimeout(() => setAllCollapsed(false), 0)
  }

  const handleAddItem = (parent: Folder, item: FileSystemItem) => {
    const addItem = (items: FileSystemItem[]): FileSystemItem[] => {
      return items.map((i) => {
        if (i.name === parent.name && i.type === 'folder') {
          return { ...i, items: [...i.items, item] }
        }
        if (i.type === 'folder') {
          return { ...i, items: addItem(i.items) }
        }
        return i
      })
    }
    const newFileSystem = addItem(fsData)
    setFsData(newFileSystem)
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
              <span className="grow pl-1 font-semibold text-sm tracking-wide text-gray-700">
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
            <div className="overflow-y-auto overflow-x-visible">
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
                onUploadFile={handleUploadFile}
                onDropFiles={handleDropFiles}
                allCollapsed={allCollapsed}
                activeFile={activeFile}
              />
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
        />
      </div>
    </div>
  )
}

export default ProjectEditor
