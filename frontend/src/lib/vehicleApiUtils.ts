// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import type {
  File,
  FileSystemItem,
  Folder,
} from '@/components/molecules/project_editor/types'

const parseVehicleApis = (code: string) => {
  // Filter out comments and log statements: neither describes a signal the
  // prototype actually uses, and a signal name quoted in a LOGGER call would
  // otherwise be reported as used.
  code = code
    .split('\n')
    .filter((line) => !line.trim().startsWith('#'))
    .filter((line) => !line.includes('LOGGER'))
    .join('\n')

  // Replace all sequences of whitespace with a single space
  code = code.replace(/\s+/g, ' ').trim()

  // Capture Vehicle APIs while allowing spaces and line breaks around dots.
  // Lowercase `vehicle` is accepted because app templates bind the tree to a
  // lowercase local name.
  const vehicleApiPattern = /\b[Vv]ehicle(?:\s*\.\s*[A-Za-z0-9_]+)+/g
  const vehicleApisInCode = code.match(vehicleApiPattern) || []

  const methodNames = ['get', 'set', 'subscribe', 'set_many', 'add', 'apply']

  const processedApis = vehicleApisInCode
    .map((api) => {
      let cleanApi = api.replace(/\s+/g, '')

      // Remove a function call at the end, such as .get() or .set(0)
      cleanApi = cleanApi.replace(/\.\w+\([^)]*\)$/g, '')

      const parts = cleanApi.split('.')
      const filteredParts = parts.filter((part) => !methodNames.includes(part))

      // Exclude APIs whose second part is a method name
      if (methodNames.includes(filteredParts[1])) {
        return null
      }

      const reconstructedApi = filteredParts.join('.')

      // Capitalize the first letter, in case the signal started with a
      // lowercase 'vehicle' — model API names are always capitalized.
      return reconstructedApi.charAt(0).toUpperCase() + reconstructedApi.slice(1)
    })
    .filter((api) => api !== null)

  return processedApis.filter((api) => api !== 'Vehicle')
}

const getChildren = (folder: Folder): File[] => {
  const children: File[] = []

  for (const item of folder.items) {
    if (item.type === 'file') {
      children.push(item)
    } else if (item.type === 'folder') {
      children.push(...getChildren(item))
    }
  }

  return children
}

export const filterAndCompareVehicleApis = (
  code: string,
  activeModelApis: any,
) => {
  if (!code) {
    return { apisInCodeOnly: [], apisInModel: [], apisNotInModel: [] }
  }

  // `code` is either a multi-file project (JSON array) or a single source file.
  let files: File[] = []
  try {
    const parsed: FileSystemItem[] = JSON.parse(code)
    if (!Array.isArray(parsed)) throw new Error('not a project')
    for (const item of parsed) {
      if (item.type === 'folder') {
        files.push(...getChildren(item))
      } else {
        files.push(item)
      }
    }
  } catch {
    files = [{ type: 'file', name: 'code.py', content: code }]
  }

  // Markdown holds documentation, not code — signal names mentioned in prose
  // must not count as used.
  files = files.filter((file) => !file.name.endsWith('.md'))

  const parsedApis: string[] = []
  for (const file of files) {
    parsedApis.push(...parseVehicleApis(file.content || ''))
  }

  const filteredApis = [...new Set(parsedApis)]

  const apisInModel: string[] = []
  const apisNotInModel: string[] = []
  const apisInCodeOnly: string[] = [...filteredApis]

  filteredApis.forEach((apiUsedInCode) => {
    if (!apiUsedInCode) return

    const foundInModel = activeModelApis.some(
      (api: any) => api.name === apiUsedInCode,
    )

    if (foundInModel) {
      apisInModel.push(apiUsedInCode)
    } else {
      apisNotInModel.push(apiUsedInCode)
    }
  })

  return {
    apisInCodeOnly,
    apisInModel,
    apisNotInModel,
  }
}
