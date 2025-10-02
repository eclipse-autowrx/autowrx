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
}

export interface Folder {
  type: 'folder'
  name: string
  items: FileSystemItem[]
}

export type FileSystemItem = File | Folder
