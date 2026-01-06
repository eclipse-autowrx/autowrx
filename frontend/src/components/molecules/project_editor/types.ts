// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

export interface File {
  type: 'file'
  name: string
  content: string
  isBase64?: boolean
  path?: string // Full path of the file for unique identification
}

export interface Folder {
  type: 'folder'
  name: string
  items: FileSystemItem[]
  path?: string // Full path of the folder for unique identification
}

export type FileSystemItem = File | Folder

// Utility function to generate full path for any item
export const getItemPath = (
  item: FileSystemItem,
  parentPath: string = '',
): string => {
  if (item.path) return item.path
  return parentPath ? `${parentPath}/${item.name}` : item.name
}

// Utility function to find parent path from a full path
export const getParentPath = (fullPath: string): string => {
  const parts = fullPath.split('/')
  parts.pop()
  return parts.join('/')
}
