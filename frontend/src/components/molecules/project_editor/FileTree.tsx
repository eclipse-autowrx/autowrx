// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  FileSystemItem,
  File,
  Folder,
  getItemPath,
  getParentPath,
} from './types'
import {
  VscFile,
  VscFolder,
  VscEdit,
  VscTrash,
  VscChevronRight,
  VscChevronDown,
  VscKebabVertical,
  VscJson,
  VscCode,
  VscFileCode,
  VscSymbolClass,
  VscFileMedia,
  VscNewFile,
  VscNewFolder,
  VscCopy,
  VscClippy,
  VscCloudUpload,
} from 'react-icons/vsc'

interface FileTreeProps {
  items: FileSystemItem[]
  onFileSelect: (file: File) => void
  onDeleteItem: (item: FileSystemItem) => void
  onRenameItem: (
    item: FileSystemItem,
    itemPath: string,
    newName: string,
  ) => void
  onAddItem: (parent: Folder, item: FileSystemItem) => void
  onMoveItem?: (
    item: FileSystemItem,
    sourcePath: string,
    targetFolder: Folder,
  ) => void
  onUploadFile: (target: Folder) => void
  onDropFiles: (files: FileList, target: Folder) => void
  allCollapsed: boolean
  activeFile: File | null
}

const FileTree: React.FC<FileTreeProps> = ({
  items,
  onFileSelect,
  onDeleteItem,
  onRenameItem,
  onAddItem,
  onMoveItem,
  onUploadFile,
  onDropFiles,
  allCollapsed,
  activeFile,
}) => {
  const [expandedFolders, setExpandedFolders] = useState<string[]>([])
  const [openDropdown, setOpenDropdown] = useState<{
    item: FileSystemItem
    path: string
  } | null>(null)
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number
    right?: number
    left?: number
  } | null>(null)
  const [renamingItem, setRenamingItem] = useState<{
    item: FileSystemItem
    path: string
  } | null>(null)
  const [newName, setNewName] = useState('')
  const [creatingItem, setCreatingItem] = useState<{
    parentPath: string
    type: 'file' | 'folder'
  } | null>(null)
  const [newItemName, setNewItemName] = useState('')
  const [clipboard, setClipboard] = useState<{
    item: FileSystemItem
    path: string
    operation: 'copy' | 'cut'
  } | null>(null)
  const [showRootMenu, setShowRootMenu] = useState(false)
  const [rootMenuPosition, setRootMenuPosition] = useState<{
    top: number
    left: number
  } | null>(null)
  const [dragOver, setDragOver] = useState<string | null>(null)
  const [visualDragOver, setVisualDragOver] = useState<string | null>(null)
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [draggedItem, setDraggedItem] = useState<{
    item: FileSystemItem
    sourcePath: string
  } | null>(null)
  const [hoverFolderTimeout, setHoverFolderTimeout] =
    useState<NodeJS.Timeout | null>(null)
  const [dragPosition, setDragPosition] = useState<{
    x: number
    y: number
  } | null>(null)
  const [potentialDropTarget, setPotentialDropTarget] = useState<{
    folder: Folder
    path: string
  } | null>(null)
  const [conflictDialog, setConflictDialog] = useState<{
    sourceItem: FileSystemItem
    sourcePath: string
    targetFolder: Folder
    existingName: string
  } | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const rootMenuRef = useRef<HTMLDivElement>(null)

  const sortItems = (items: FileSystemItem[]): FileSystemItem[] => {
    return [...items].sort((a, b) => {
      // First, sort by type (folders first)
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1
      }
      // Then sort alphabetically by name (case-insensitive)
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    })
  }

  const findUniqueItemName = (
    baseName: string,
    targetFolder: Folder,
  ): string => {
    // Check if the base name already exists
    const existingNames = new Set(
      targetFolder.items.map((item) => item.name.toLowerCase()),
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

  // Find folder by path in the items tree
  const findFolderByPath = (targetPath: string): Folder | null => {
    if (targetPath === 'root' || targetPath === '') {
      return { type: 'folder', name: 'root', items: items }
    }

    const findInItems = (
      items: FileSystemItem[],
      currentPath: string = '',
    ): Folder | null => {
      for (const item of items) {
        const itemPath = currentPath ? `${currentPath}/${item.name}` : item.name

        if (item.type === 'folder' && itemPath === targetPath) {
          return item
        }

        if (item.type === 'folder') {
          const found = findInItems(item.items, itemPath)
          if (found) return found
        }
      }
      return null
    }

    return findInItems(items)
  }

  // Find the target folder based on mouse position and DOM hierarchy
  const findDropTargetFromPosition = (
    e: React.DragEvent,
  ): { folder: Folder; path: string; visualPath: string } | null => {
    // Find all folder elements
    const folderElements = document.querySelectorAll('[data-folder-path]')
    let closestFolder: {
      element: Element
      folderPath: string
      distance: number
    } | null = null

    for (const element of folderElements) {
      const elementRect = element.getBoundingClientRect()

      // Check if the mouse is over this folder's area (including its children)
      if (
        e.clientX >= elementRect.left &&
        e.clientX <= elementRect.right &&
        e.clientY >= elementRect.top &&
        e.clientY <= elementRect.bottom + 40 // Allow drop zone below the folder
      ) {
        const folderPath = element.getAttribute('data-folder-path')
        if (folderPath) {
          // Calculate distance from the folder's top-left corner
          const distance = Math.sqrt(
            Math.pow(e.clientX - elementRect.left, 2) +
              Math.pow(e.clientY - elementRect.top, 2),
          )

          // Keep track of the closest folder (smallest distance)
          if (!closestFolder || distance < closestFolder.distance) {
            closestFolder = { element, folderPath, distance }
          }
        }
      }
    }

    if (closestFolder) {
      // Find the folder object for the target
      const folder = findFolderByPath(closestFolder.folderPath)
      if (folder) {
        return {
          folder,
          path: closestFolder.folderPath,
          visualPath: closestFolder.folderPath, // Visual feedback on the folder being hovered
        }
      }
    }

    // Default to root if no specific folder found
    return {
      folder: { type: 'folder', name: 'root', items: items },
      path: 'root',
      visualPath: 'root',
    }
  }

  useEffect(() => {
    if (allCollapsed) {
      setExpandedFolders([])
    }
  }, [allCollapsed])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null)
      }
      if (
        rootMenuRef.current &&
        !rootMenuRef.current.contains(event.target as Node)
      ) {
        setShowRootMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    switch (extension) {
      // JavaScript/TypeScript
      case 'js':
      case 'jsx':
      case 'mjs':
        return (
          <VscCode className="mr-2 text-yellow-600 flex-shrink-0" size={16} />
        )
      case 'ts':
      case 'tsx':
        return (
          <VscCode className="mr-2 text-blue-600 flex-shrink-0" size={16} />
        )

      // Web Technologies
      case 'json':
        return (
          <VscJson className="mr-2 text-green-600 flex-shrink-0" size={16} />
        )
      case 'html':
      case 'htm':
      case 'xhtml':
        return (
          <VscFileCode
            className="mr-2 text-orange-600 flex-shrink-0"
            size={16}
          />
        )
      case 'css':
      case 'scss':
      case 'sass':
      case 'less':
        return (
          <VscSymbolClass
            className="mr-2 text-blue-600 flex-shrink-0"
            size={16}
          />
        )
      case 'xml':
      case 'svg':
        return (
          <VscFileCode
            className="mr-2 text-orange-400 flex-shrink-0"
            size={16}
          />
        )

      // Markup & Documentation
      case 'md':
      case 'markdown':
        return (
          <VscFileMedia
            className="mr-2 text-gray-700 flex-shrink-0"
            size={16}
          />
        )
      case 'rst':
        return (
          <VscFileMedia
            className="mr-2 text-blue-700 flex-shrink-0"
            size={16}
          />
        )

      // Python
      case 'py':
      case 'pyw':
      case 'pyi':
      case 'pyx':
      case 'pxd':
        return (
          <VscCode className="mr-2 text-blue-500 flex-shrink-0" size={16} />
        )

      // Java & JVM
      case 'java':
      case 'class':
        return (
          <VscCode className="mr-2 text-orange-500 flex-shrink-0" size={16} />
        )
      case 'kt':
        return (
          <VscCode className="mr-2 text-purple-500 flex-shrink-0" size={16} />
        )
      case 'scala':
        return <VscCode className="mr-2 text-red-500 flex-shrink-0" size={16} />
      case 'groovy':
        return (
          <VscCode className="mr-2 text-blue-500 flex-shrink-0" size={16} />
        )

      // C/C++ & Related
      case 'c':
        return (
          <VscCode className="mr-2 text-blue-600 flex-shrink-0" size={16} />
        )
      case 'cpp':
      case 'cc':
      case 'cxx':
      case 'c++':
      case 'h':
      case 'hpp':
      case 'hh':
      case 'hxx':
        return (
          <VscCode className="mr-2 text-blue-600 flex-shrink-0" size={16} />
        )
      case 'cs':
        return (
          <VscCode className="mr-2 text-purple-600 flex-shrink-0" size={16} />
        )
      case 'd':
        return <VscCode className="mr-2 text-red-600 flex-shrink-0" size={16} />
      case 'swift':
        return (
          <VscCode className="mr-2 text-orange-600 flex-shrink-0" size={16} />
        )
      case 'objc':
      case 'm':
        return (
          <VscCode className="mr-2 text-blue-500 flex-shrink-0" size={16} />
        )

      // Scripting Languages
      case 'php':
      case 'phtml':
        return (
          <VscCode className="mr-2 text-purple-500 flex-shrink-0" size={16} />
        )
      case 'rb':
      case 'erb':
        return <VscCode className="mr-2 text-red-500 flex-shrink-0" size={16} />
      case 'go':
      case 'mod':
        return (
          <VscCode className="mr-2 text-cyan-500 flex-shrink-0" size={16} />
        )
      case 'rs':
        return (
          <VscCode className="mr-2 text-orange-600 flex-shrink-0" size={16} />
        )
      case 'pl':
      case 'pm':
        return (
          <VscCode className="mr-2 text-blue-500 flex-shrink-0" size={16} />
        )
      case 'lua':
        return (
          <VscCode className="mr-2 text-blue-400 flex-shrink-0" size={16} />
        )
      case 'r':
        return (
          <VscCode className="mr-2 text-blue-600 flex-shrink-0" size={16} />
        )
      case 'jl':
        return (
          <VscCode className="mr-2 text-purple-600 flex-shrink-0" size={16} />
        )
      case 'clj':
      case 'cljs':
        return (
          <VscCode className="mr-2 text-green-500 flex-shrink-0" size={16} />
        )
      case 'hs':
      case 'lhs':
        return (
          <VscCode className="mr-2 text-purple-500 flex-shrink-0" size={16} />
        )
      case 'fs':
      case 'fsx':
        return (
          <VscCode className="mr-2 text-blue-500 flex-shrink-0" size={16} />
        )
      case 'ml':
      case 'mli':
        return (
          <VscCode className="mr-2 text-orange-500 flex-shrink-0" size={16} />
        )
      case 'elm':
        return (
          <VscCode className="mr-2 text-blue-600 flex-shrink-0" size={16} />
        )
      case 'ex':
      case 'exs':
        return (
          <VscCode className="mr-2 text-purple-500 flex-shrink-0" size={16} />
        )
      case 'cr':
        return <VscCode className="mr-2 text-red-500 flex-shrink-0" size={16} />
      case 'nim':
        return (
          <VscCode className="mr-2 text-yellow-500 flex-shrink-0" size={16} />
        )
      case 'zig':
        return (
          <VscCode className="mr-2 text-orange-500 flex-shrink-0" size={16} />
        )
      case 'v':
        return (
          <VscCode className="mr-2 text-blue-500 flex-shrink-0" size={16} />
        )

      // Shell & Scripts
      case 'sh':
      case 'bash':
      case 'zsh':
      case 'fish':
        return (
          <VscFileCode
            className="mr-2 text-green-500 flex-shrink-0"
            size={16}
          />
        )
      case 'bat':
      case 'cmd':
        return (
          <VscFileCode className="mr-2 text-gray-600 flex-shrink-0" size={16} />
        )
      case 'ps1':
      case 'psm1':
        return (
          <VscFileCode className="mr-2 text-blue-600 flex-shrink-0" size={16} />
        )
      case 'vbs':
        return (
          <VscFileCode className="mr-2 text-blue-500 flex-shrink-0" size={16} />
        )

      // Database & Query
      case 'sql':
      case 'ddl':
      case 'dml':
        return (
          <VscCode className="mr-2 text-blue-400 flex-shrink-0" size={16} />
        )
      case 'mongo':
        return (
          <VscCode className="mr-2 text-green-600 flex-shrink-0" size={16} />
        )
      case 'cypher':
        return (
          <VscCode className="mr-2 text-blue-500 flex-shrink-0" size={16} />
        )

      // Configuration & Data
      case 'yaml':
      case 'yml':
        return (
          <VscFileCode
            className="mr-2 text-purple-400 flex-shrink-0"
            size={16}
          />
        )
      case 'toml':
        return (
          <VscFileCode className="mr-2 text-blue-500 flex-shrink-0" size={16} />
        )
      case 'ini':
      case 'cfg':
      case 'conf':
        return (
          <VscFileCode className="mr-2 text-gray-500 flex-shrink-0" size={16} />
        )
      case 'env':
        return (
          <VscFileCode
            className="mr-2 text-green-600 flex-shrink-0"
            size={16}
          />
        )
      case 'properties':
        return (
          <VscFileCode
            className="mr-2 text-orange-500 flex-shrink-0"
            size={16}
          />
        )
      case 'csv':
      case 'tsv':
        return (
          <VscFileCode
            className="mr-2 text-green-500 flex-shrink-0"
            size={16}
          />
        )

      // Build & Package Files
      case 'cmake':
      case 'cmake.in':
        return (
          <VscFileCode className="mr-2 text-blue-500 flex-shrink-0" size={16} />
        )
      case 'makefile':
      case 'mk':
        return (
          <VscFileCode
            className="mr-2 text-orange-500 flex-shrink-0"
            size={16}
          />
        )
      case 'dockerfile':
        return (
          <VscFileCode className="mr-2 text-blue-600 flex-shrink-0" size={16} />
        )
      case 'lock':
        return (
          <VscJson className="mr-2 text-yellow-500 flex-shrink-0" size={16} />
        )

      // Assembly & Low-level
      case 'asm':
      case 's':
      case 'S':
        return (
          <VscCode className="mr-2 text-gray-600 flex-shrink-0" size={16} />
        )
      case 'll':
        return (
          <VscCode className="mr-2 text-blue-500 flex-shrink-0" size={16} />
        )

      // Documentation & Help
      case 'tex':
      case 'ltx':
        return (
          <VscFileMedia
            className="mr-2 text-blue-700 flex-shrink-0"
            size={16}
          />
        )
      case 'bib':
        return (
          <VscFileMedia
            className="mr-2 text-green-700 flex-shrink-0"
            size={16}
          />
        )
      case 'adoc':
      case 'asciidoc':
        return (
          <VscFileMedia
            className="mr-2 text-blue-600 flex-shrink-0"
            size={16}
          />
        )

      // Other Common Formats
      case 'log':
        return (
          <VscFileMedia
            className="mr-2 text-gray-600 flex-shrink-0"
            size={16}
          />
        )
      case 'diff':
      case 'patch':
        return (
          <VscFileMedia
            className="mr-2 text-orange-500 flex-shrink-0"
            size={16}
          />
        )
      case 'gitignore':
      case 'gitattributes':
      case 'gitmodules':
        return (
          <VscFileMedia className="mr-2 text-red-500 flex-shrink-0" size={16} />
        )
      case 'editorconfig':
        return (
          <VscFileCode className="mr-2 text-blue-500 flex-shrink-0" size={16} />
        )
      case 'eslintrc':
      case 'prettierrc':
      case 'babelrc':
      case 'tsconfig':
      case 'jsconfig':
        return (
          <VscJson className="mr-2 text-green-600 flex-shrink-0" size={16} />
        )
      case 'webpack.config':
      case 'rollup.config':
      case 'tailwind.config':
      case 'postcss.config':
        return (
          <VscCode className="mr-2 text-yellow-600 flex-shrink-0" size={16} />
        )
      case 'vite.config':
        return (
          <VscCode className="mr-2 text-blue-600 flex-shrink-0" size={16} />
        )
      case 'browserslist':
        return (
          <VscFileCode className="mr-2 text-blue-500 flex-shrink-0" size={16} />
        )
      case 'nvmrc':
      case 'node-version':
        return (
          <VscFile className="mr-2 text-green-500 flex-shrink-0" size={16} />
        )

      default:
        return (
          <VscFile className="mr-2 text-gray-500 flex-shrink-0" size={16} />
        )
    }
  }

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders((prev) =>
      prev.includes(folderPath)
        ? prev.filter((path) => path !== folderPath)
        : [...prev, folderPath],
    )
  }

  const handleContextMenu = (
    e: React.MouseEvent,
    item: FileSystemItem,
    itemPath: string,
  ) => {
    e.preventDefault()
    e.stopPropagation()

    const rect = e.currentTarget.getBoundingClientRect()
    setDropdownPosition({ top: rect.bottom, left: rect.left })
    setOpenDropdown({ item, path: itemPath })
  }

  const handleRootContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setRootMenuPosition({ top: e.clientY, left: e.clientX })
    setShowRootMenu(true)
  }

  const handleRootCreateItem = (type: 'file' | 'folder') => {
    setCreatingItem({ parentPath: 'root', type })
    setNewItemName('')
    setShowRootMenu(false)
  }

  const handleRootUpload = () => {
    onUploadFile({ type: 'folder', name: 'root', items: items })
    setShowRootMenu(false)
  }

  const handleRootPaste = () => {
    handlePaste({ type: 'folder', name: 'root', items: items })
    setShowRootMenu(false)
  }

  const handleRename = (item: FileSystemItem, itemPath: string) => {
    setRenamingItem({ item, path: itemPath })
    setNewName(item.name)
    setOpenDropdown(null)
  }

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (renamingItem && newName.trim() && newName !== renamingItem.item.name) {
      onRenameItem(renamingItem.item, renamingItem.path, newName.trim())
    }
    setRenamingItem(null)
    setNewName('')
  }

  const handleCreateItem = (
    parent: Folder,
    parentPath: string,
    type: 'file' | 'folder',
  ) => {
    setCreatingItem({ parentPath: parentPath, type })
    setNewItemName('')
    setOpenDropdown(null)
  }

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (creatingItem && newItemName.trim()) {
      const newItem: FileSystemItem =
        creatingItem.type === 'file'
          ? { type: 'file', name: newItemName.trim(), content: '' }
          : { type: 'folder', name: newItemName.trim(), items: [] }

      // Find the parent folder using path-based matching
      let parentFolder: Folder
      if (
        creatingItem.parentPath === 'root' ||
        creatingItem.parentPath === ''
      ) {
        parentFolder = { type: 'folder', name: 'root', items: items }
      } else {
        const found = findFolderByPath(creatingItem.parentPath)
        parentFolder = found || { type: 'folder', name: 'root', items: items }
      }

      onAddItem(parentFolder, newItem)
    }
    setCreatingItem(null)
    setNewItemName('')
  }

  const handleCopy = (item: FileSystemItem, itemPath: string) => {
    setClipboard({ item, path: itemPath, operation: 'copy' })
    setOpenDropdown(null)
  }

  const handleCut = (item: FileSystemItem, itemPath: string) => {
    setClipboard({ item, path: itemPath, operation: 'cut' })
    setOpenDropdown(null)
  }

  const handlePaste = (targetFolder: Folder) => {
    if (clipboard) {
      const newItem = { ...clipboard.item }
      if (clipboard.operation === 'cut') {
        // For cut operation, use moveItem if available to ensure atomicity
        if (onMoveItem) {
          onMoveItem(clipboard.item, clipboard.path, targetFolder)
        } else {
          // Fallback: Remove from original location by passing the path information
          // Attach the original path to help the delete function identify the exact item
          const itemWithPath = {
            ...clipboard.item,
            __originalPath: clipboard.path, // Store path for deletion
          } as any
          onDeleteItem(itemWithPath)
          // Add to target folder - delay to ensure deletion completes first
          setTimeout(() => {
            onAddItem(targetFolder, newItem)
          }, 0)
        }
      } else {
        // For copy operation, just add to target folder
        onAddItem(targetFolder, newItem)
      }
      setClipboard(null)
    }
    setOpenDropdown(null)
  }

  const canPaste = (folder: Folder) => {
    return clipboard && folder.name !== clipboard.item.name
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setIsDraggingOver(true)
    setDragPosition({ x: e.clientX, y: e.clientY })

    // Find potential drop target based on mouse position
    const target = findDropTargetFromPosition(e)
    if (target) {
      setPotentialDropTarget(target)
      setDragOver(target.path) // Actual drop target
      setVisualDragOver(target.visualPath) // Visual feedback path
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Only set dragging to false if we're leaving the container completely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDraggingOver(false)
      setDragOver(null)
      setVisualDragOver(null)
      setPotentialDropTarget(null)
      setDragPosition(null)

      // Clear timeout when leaving entirely
      if (hoverFolderTimeout) {
        clearTimeout(hoverFolderTimeout)
        setHoverFolderTimeout(null)
      }
    }
  }

  const handleFolderDragOver = (e: React.DragEvent, folderPath: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(folderPath)
    setVisualDragOver(folderPath)
    setIsDraggingOver(true)

    // Auto-expand folder after 2 seconds of hovering
    if (hoverFolderTimeout) {
      clearTimeout(hoverFolderTimeout)
    }

    const timeout = setTimeout(() => {
      // Use full path for expansion state
      setExpandedFolders((prev) =>
        prev.includes(folderPath) ? prev : [...prev, folderPath],
      )
    }, 2000)

    setHoverFolderTimeout(timeout)
  }

  const handleFolderDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Only clear if we're leaving the folder completely (not going to a child element)
    const target = e.currentTarget as HTMLElement
    if (!target.contains(e.relatedTarget as Node)) {
      setDragOver(null)
      setVisualDragOver(null)

      // Clear the timeout if leaving the folder
      if (hoverFolderTimeout) {
        clearTimeout(hoverFolderTimeout)
        setHoverFolderTimeout(null)
      }
    }
  }

  const handleDrop = (e: React.DragEvent, targetFolder?: Folder) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingOver(false)
    setDragOver(null)
    setVisualDragOver(null)
    setDragPosition(null)

    // Determine the target folder - must include actual items array
    const rootFolder: Folder = {
      type: 'folder',
      name: 'root',
      items,
      path: 'root',
    }
    const target = potentialDropTarget?.folder || targetFolder || rootFolder

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      // Process files with the same validation logic as regular upload
      processDroppedFiles(files, target)
    } else if (draggedItem) {
      // Handle item reordering within the file tree
      handleItemDrop(draggedItem, target)
    }

    setPotentialDropTarget(null)
    setDraggedItem(null)
  }

  const handleItemDragStart = (item: FileSystemItem, sourcePath: string) => {
    setDraggedItem({ item, sourcePath })
  }

  const handleItemDrop = (
    draggedData: { item: FileSystemItem; sourcePath: string },
    target: Folder,
  ) => {
    const targetPath = target.path || target.name

    // Prevent dropping onto itself
    if (draggedData.sourcePath === targetPath) {
      console.log('handleItemDrop: Cannot drop item onto itself', {
        sourcePath: draggedData.sourcePath,
        targetPath,
      })
      return
    }

    // Prevent dropping into its own children (for folders)
    if (
      draggedData.item.type === 'folder' &&
      targetPath.startsWith(draggedData.sourcePath + '/')
    ) {
      console.log('handleItemDrop: Cannot drop folder into its own children', {
        sourcePath: draggedData.sourcePath,
        targetPath,
      })
      return
    }

    // Check if an item with the same name already exists in the target folder
    const existingItem = target.items.find(
      (item) => item.name.toLowerCase() === draggedData.item.name.toLowerCase(),
    )

    if (existingItem) {
      // Show conflict dialog
      console.log('handleItemDrop: Conflict detected, showing dialog', {
        sourcePath: draggedData.sourcePath,
        targetPath,
      })
      setConflictDialog({
        sourceItem: draggedData.item,
        sourcePath: draggedData.sourcePath,
        targetFolder: { ...target, path: targetPath },
        existingName: existingItem.name,
      })
    } else {
      // No conflict, proceed with the move
      console.log(
        'handleItemDrop: Moving item from',
        draggedData.sourcePath,
        'to',
        targetPath,
      )
      performItemMove(draggedData.item, draggedData.sourcePath, {
        ...target,
        path: targetPath,
      })
    }
  }

  const performItemMove = (
    item: FileSystemItem,
    sourcePath: string,
    target: Folder,
  ) => {
    // Use the dedicated move handler if available (atomic operation)
    if (onMoveItem) {
      onMoveItem(item, sourcePath, target)
    } else {
      // Fallback: Delete from source location first, then add to target
      // Use setTimeout to ensure deletion completes before addition
      const itemWithPath = {
        ...item,
        __originalPath: sourcePath,
      } as any
      onDeleteItem(itemWithPath)

      // Then add to target folder - delay to prevent race condition
      setTimeout(() => {
        onAddItem(target, item)
      }, 0)
    }
  }

  const handleConflictReplace = () => {
    if (!conflictDialog) return

    // Delete the existing item
    const existingItem = conflictDialog.targetFolder.items.find(
      (item) => item.name === conflictDialog.existingName,
    )
    if (existingItem) {
      // Build the path for the existing item to delete
      const existingItemPath = `${conflictDialog.targetFolder.name}/${existingItem.name}`
      const itemWithPath = {
        ...existingItem,
        __originalPath: existingItemPath,
      } as any
      onDeleteItem(itemWithPath)
    }

    // Perform the move
    performItemMove(
      conflictDialog.sourceItem,
      conflictDialog.sourcePath,
      conflictDialog.targetFolder,
    )

    setConflictDialog(null)
  }

  const handleConflictKeepBoth = () => {
    if (!conflictDialog) return

    // Find a unique name for the item
    const uniqueName = findUniqueItemName(
      conflictDialog.sourceItem.name,
      conflictDialog.targetFolder,
    )

    // Create a new item with the unique name
    const renamedItem = {
      ...conflictDialog.sourceItem,
      name: uniqueName,
    }

    // Use moveItem if available for atomic operation
    if (onMoveItem) {
      onMoveItem(
        renamedItem,
        conflictDialog.sourcePath,
        conflictDialog.targetFolder,
      )
    } else {
      // Delete the ORIGINAL item from source location (with original name and path)
      const originalItemWithPath = {
        ...conflictDialog.sourceItem,
        __originalPath: conflictDialog.sourcePath,
      } as any
      onDeleteItem(originalItemWithPath)
      // Add renamed item - delay to ensure deletion completes first
      setTimeout(() => {
        onAddItem(conflictDialog.targetFolder, renamedItem)
      }, 0)
    }

    setConflictDialog(null)
  }

  const processDroppedFiles = (files: FileList, target: Folder) => {
    // Use the onDropFiles prop to handle the dropped files
    onDropFiles(files, target)
  }

  const renderItem = (
    item: FileSystemItem,
    depth: number = 0,
    parentPath: string = '',
  ) => {
    const itemPath = parentPath ? `${parentPath}/${item.name}` : item.name
    const isExpanded = expandedFolders.includes(itemPath)
    const isActive =
      activeFile &&
      (activeFile.path || (activeFile as any).__path || activeFile.name) ===
        itemPath

    if (item.type === 'file') {
      return (
        <>
          {!(renamingItem && renamingItem.path === itemPath) && (
            <div
              key={item.name}
              className={`
                flex items-center px-2 py-1 text-sm cursor-pointer hover:bg-gray-100 group
                ${isActive ? 'bg-blue-100 text-blue-900' : 'text-gray-700'}
                ${draggedItem?.sourcePath === itemPath ? 'opacity-50' : ''}
              `}
              style={{ paddingLeft: `${depth * 16 + 8}px` }}
              onClick={() => onFileSelect({ ...item, path: itemPath })}
              onContextMenu={(e) => handleContextMenu(e, item, itemPath)}
              draggable
              onDragStart={() => handleItemDragStart(item, itemPath)}
              onDragOver={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
              onDrop={(e) => handleDrop(e, undefined)}
            >
              {getFileIcon(item.name)}
              <span className="truncate">{item.name}</span>

              {/* Context menu button */}
              <button
                className="ml-auto opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-opacity"
                onClick={(e) => {
                  e.stopPropagation()
                  handleContextMenu(e, item, itemPath)
                }}
              >
                <VscKebabVertical size={14} />
              </button>
            </div>
          )}

          {/* Inline rename input for files */}
          {renamingItem && renamingItem.path === itemPath && (
            <div
              className="flex items-center py-[1px] px-2 text-gray-700 text-[13px]"
              style={{ paddingLeft: `${depth * 16 + 8}px` }}
            >
              <form
                onSubmit={handleRenameSubmit}
                className="w-full flex items-center"
              >
                {getFileIcon(renamingItem.item.name)}
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onBlur={() => {
                    if (!newName.trim() || newName === item.name) {
                      setRenamingItem(null)
                      setNewName('')
                    }
                  }}
                  autoFocus
                  placeholder="Enter new name..."
                  className="bg-white border border-blue-500 rounded px-1.5 py-0.5 w-full text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </form>
            </div>
          )}
        </>
      )
    }

    if (item.type === 'folder') {
      return (
        <div
          key={item.name}
          className={`${visualDragOver === itemPath ? 'bg-green-50 border-l-2 border-green-400' : ''}`}
        >
          {!(renamingItem && renamingItem.path === itemPath) && (
            <div
              data-folder-path={itemPath} // Add path attribute for drag detection
              className={`
                flex items-center px-2 py-1 text-sm cursor-pointer hover:bg-gray-100 group
                ${isActive ? 'bg-blue-100 text-blue-900' : 'text-gray-700'}
                ${draggedItem?.sourcePath === itemPath ? 'opacity-50' : ''}
              `}
              style={{ paddingLeft: `${depth * 16 + 8}px` }}
              onClick={() => toggleFolder(itemPath)}
              onContextMenu={(e) => handleContextMenu(e, item, itemPath)}
              onDragOver={(e) => handleFolderDragOver(e, itemPath)} // Use path instead of name
              onDragLeave={handleFolderDragLeave}
              onDrop={(e) =>
                handleDrop(e, { ...item, path: itemPath } as Folder)
              }
              draggable
              onDragStart={() => handleItemDragStart(item, itemPath)}
            >
              <button
                className="mr-1 p-0.5 hover:bg-gray-200 rounded transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleFolder(itemPath)
                }}
              >
                {isExpanded ? (
                  <VscChevronDown size={14} />
                ) : (
                  <VscChevronRight size={14} />
                )}
              </button>
              <span className="truncate">{item.name}</span>

              {/* Context menu button */}
              <button
                className="ml-auto opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-opacity"
                onClick={(e) => {
                  e.stopPropagation()
                  handleContextMenu(e, item, itemPath)
                }}
              >
                <VscKebabVertical size={14} />
              </button>
            </div>
          )}

          {/* Inline creation input */}
          {creatingItem && creatingItem.parentPath === itemPath && (
            <div
              className="flex items-center py-[1px] px-2 text-gray-700 text-[13px]"
              style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}
            >
              <form
                onSubmit={handleCreateSubmit}
                className="w-full flex items-center"
              >
                {creatingItem.type === 'folder' ? (
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
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onBlur={() => {
                    if (!newItemName.trim()) {
                      setCreatingItem(null)
                      setNewItemName('')
                    }
                  }}
                  autoFocus
                  placeholder={`Enter ${creatingItem.type} name...`}
                  className="bg-white border border-blue-500 rounded px-1.5 py-0.5 w-full text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </form>
            </div>
          )}

          {/* Inline rename input */}
          {renamingItem && renamingItem.path === itemPath && (
            <div
              className="flex items-center py-[1px] px-2 text-gray-700 text-[13px]"
              style={{ paddingLeft: `${depth * 16 + 8}px` }}
            >
              <form
                onSubmit={handleRenameSubmit}
                className="w-full flex items-center"
              >
                <VscFolder
                  className="mr-2 text-blue-600 flex-shrink-0"
                  size={16}
                />
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onBlur={() => {
                    if (!newName.trim() || newName === item.name) {
                      setRenamingItem(null)
                      setNewName('')
                    }
                  }}
                  autoFocus
                  placeholder="Enter new name..."
                  className="bg-white border border-blue-500 rounded px-1.5 py-0.5 w-full text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </form>
            </div>
          )}

          {isExpanded && (
            <div>
              {sortItems(item.items).map((childItem) =>
                renderItem(childItem, depth + 1, itemPath),
              )}
            </div>
          )}
        </div>
      )
    }

    return null
  }

  return (
    <div className="relative">
      {/* Top upload button */}
      {/* <div className="px-2 py-2 border-b border-gray-200">
        <button
          onClick={() =>
            onUploadFile({ type: 'folder', name: 'root', items: items })
          }
          className="w-full flex items-center justify-center px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-md transition-colors"
        >
          <VscCloudUpload className="mr-2" size={16} />
          Upload File
        </button>
      </div> */}

      {/* File tree items */}
      <div
        className={`py-2 min-h-[200px] ${
          isDraggingOver && (dragOver === 'root' || !dragOver)
            ? 'bg-blue-50 border-2 border-dashed border-blue-300'
            : ''
        }`}
        onContextMenu={handleRootContextMenu}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={(e) =>
          handleDrop(e, { type: 'folder', name: 'root', items: items })
        }
      >
        {sortItems(items).map((item) => renderItem(item))}

        {/* Root level creation input */}
        {creatingItem && creatingItem.parentPath === 'root' && (
          <div
            className="flex items-center py-[1px] px-2 text-gray-700 text-[13px]"
            style={{ paddingLeft: '8px' }}
          >
            <form
              onSubmit={handleCreateSubmit}
              className="w-full flex items-center"
            >
              {creatingItem.type === 'folder' ? (
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
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onBlur={() => {
                  if (!newItemName.trim()) {
                    setCreatingItem(null)
                    setNewItemName('')
                  }
                }}
                autoFocus
                placeholder={`Enter ${creatingItem.type} name...`}
                className="bg-white border border-blue-500 rounded px-1.5 py-0.5 w-full text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </form>
          </div>
        )}
      </div>

      {/* Context menu dropdown */}
      {openDropdown &&
        dropdownPosition &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-50 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-32"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
            }}
          >
            <button
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
              onClick={() => {
                if (openDropdown) {
                  handleRename(openDropdown.item, openDropdown.path)
                }
              }}
            >
              <VscEdit className="mr-2" size={14} />
              Rename
            </button>

            {openDropdown?.item.type === 'folder' && (
              <>
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
                  onClick={() => {
                    if (openDropdown && openDropdown.item.type === 'folder') {
                      handleCreateItem(
                        openDropdown.item as Folder,
                        openDropdown.path,
                        'file',
                      )
                    }
                  }}
                >
                  <VscNewFile className="mr-2" size={14} />
                  New File
                </button>
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
                  onClick={() => {
                    if (openDropdown && openDropdown.item.type === 'folder') {
                      handleCreateItem(
                        openDropdown.item as Folder,
                        openDropdown.path,
                        'folder',
                      )
                    }
                  }}
                >
                  <VscNewFolder className="mr-2" size={14} />
                  New Folder
                </button>
              </>
            )}

            <button
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
              onClick={() => {
                if (openDropdown) {
                  handleCopy(openDropdown.item, openDropdown.path)
                }
              }}
            >
              <VscCopy className="mr-2" size={14} />
              Copy
            </button>

            <button
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
              onClick={() => {
                if (openDropdown) {
                  handleCut(openDropdown.item, openDropdown.path)
                }
              }}
            >
              <VscClippy className="mr-2" size={14} />
              Cut
            </button>

            {clipboard && openDropdown?.item.type === 'folder' && (
              <button
                className={`w-full px-3 py-2 text-left text-sm flex items-center ${
                  openDropdown &&
                  openDropdown.item.type === 'folder' &&
                  canPaste(openDropdown.item as Folder)
                    ? 'hover:bg-gray-100'
                    : 'text-gray-400 cursor-not-allowed'
                }`}
                onClick={() => {
                  if (
                    openDropdown &&
                    openDropdown.item.type === 'folder' &&
                    canPaste(openDropdown.item as Folder)
                  ) {
                    handlePaste(openDropdown.item as Folder)
                  }
                }}
                disabled={
                  !(
                    openDropdown &&
                    openDropdown.item.type === 'folder' &&
                    canPaste(openDropdown.item as Folder)
                  )
                }
              >
                <VscClippy className="mr-2" size={14} />
                Paste
              </button>
            )}

            {openDropdown?.item.type === 'folder' && (
              <button
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
                onClick={() => {
                  if (openDropdown && openDropdown.item.type === 'folder') {
                    onUploadFile(openDropdown.item as Folder)
                  }
                }}
              >
                <VscCloudUpload className="mr-2" size={14} />
                Upload File
              </button>
            )}

            {openDropdown?.item.type === 'folder' && (
              <div className="border-t border-gray-200 my-1"></div>
            )}

            <button
              className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center"
              onClick={() => {
                if (openDropdown) {
                  // Pass path information to ensure exact item deletion
                  const itemWithPath = {
                    ...openDropdown.item,
                    __originalPath: openDropdown.path,
                  } as any
                  onDeleteItem(itemWithPath)
                }
                setOpenDropdown(null)
              }}
            >
              <VscTrash className="mr-2" size={14} />
              Delete
            </button>
          </div>,
          document.body,
        )}

      {/* Root context menu */}
      {showRootMenu &&
        rootMenuPosition &&
        createPortal(
          <div
            ref={rootMenuRef}
            className="fixed z-50 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-32"
            style={{
              top: rootMenuPosition.top,
              left: rootMenuPosition.left,
            }}
          >
            <button
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
              onClick={() => handleRootCreateItem('file')}
            >
              <VscNewFile className="mr-2" size={14} />
              New File
            </button>
            <button
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
              onClick={() => handleRootCreateItem('folder')}
            >
              <VscNewFolder className="mr-2" size={14} />
              New Folder
            </button>
            <button
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
              onClick={() => {
                // Upload to root folder - create a special root folder object
                const rootFolder: Folder = {
                  type: 'folder',
                  name: 'root',
                  items: [],
                }
                onUploadFile(rootFolder)
                setShowRootMenu(false)
              }}
            >
              <VscCloudUpload className="mr-2" size={14} />
              Upload File
            </button>
            {clipboard && (
              <button
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
                onClick={() => {
                  // Paste to root folder
                  const rootFolder: Folder = {
                    type: 'folder',
                    name: 'root',
                    items: [],
                  }
                  if (canPaste(rootFolder)) {
                    handlePaste(rootFolder)
                  }
                  setShowRootMenu(false)
                }}
              >
                <VscClippy className="mr-2" size={14} />
                Paste
              </button>
            )}
          </div>,
          document.body,
        )}

      {/* Conflict dialog */}
      {conflictDialog &&
        createPortal(
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-lg font-semibold mb-2">File Name Conflict</h2>
              <p className="text-gray-600 mb-4">
                An item named{' '}
                <span className="font-semibold">
                  "{conflictDialog.existingName}"
                </span>{' '}
                already exists in this location. What would you like to do?
              </p>
              <div className="space-y-3">
                <button
                  onClick={handleConflictReplace}
                  className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors"
                >
                  Replace Existing
                </button>
                <button
                  onClick={handleConflictKeepBoth}
                  className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
                >
                  Keep Both (Rename)
                </button>
                <button
                  onClick={() => setConflictDialog(null)}
                  className="w-full px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-md transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}

export default FileTree
