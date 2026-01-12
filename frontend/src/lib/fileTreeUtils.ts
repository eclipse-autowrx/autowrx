// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

/**
 * Represents a file to be committed
 */
export interface FileToCommit {
  path: string
  content: string
  isBase64?: boolean
}

/**
 * Interface for file system items (from FileTree)
 */
interface FileSystemItem {
  type: 'file' | 'folder'
  name: string
  content?: string
  isBase64?: boolean
  items?: FileSystemItem[]
}

/**
 * Extracts all files from a file tree structure
 * @param items - The file system items array
 * @param parentPath - The parent path for nested items (used recursively)
 * @returns Array of files to be committed with their full paths
 */
export const extractFilesFromTree = (
  items: FileSystemItem[] | undefined,
  parentPath: string = ''
): FileToCommit[] => {
  if (!items || !Array.isArray(items)) {
    return []
  }

  const files: FileToCommit[] = []

  for (const item of items) {
    const currentPath = parentPath ? `${parentPath}/${item.name}` : item.name

    if (item.type === 'file' && item.content !== undefined) {
      files.push({
        path: currentPath,
        content: item.content,
        isBase64: item.isBase64,
      })
    } else if (item.type === 'folder' && item.items) {
      // Recursively extract files from subfolders
      const nestedFiles = extractFilesFromTree(item.items, currentPath)
      files.push(...nestedFiles)
    }
  }

  return files
}

/**
 * Parses project data JSON string and extracts all files
 * @param projectDataStr - The project data as a JSON string
 * @returns Array of files to be committed or null if parsing fails
 */
export const parseAndExtractFiles = (
  projectDataStr: string
): FileToCommit[] | null => {
  try {
    if (!projectDataStr || projectDataStr.trim() === '') {
      return []
    }

    const parsed = JSON.parse(projectDataStr)
    const items = Array.isArray(parsed) ? parsed : [parsed]

    return extractFilesFromTree(items)
  } catch (error) {
    console.error('Failed to parse project data:', error)
    return null
  }
}
