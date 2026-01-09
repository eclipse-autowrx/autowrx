// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { GithubUser } from '@/types/github.type'
import { FileSystemItem } from '@/data/sampleProjects'
import axios from 'axios'

export const getGithubCurrentUser = async (accessToken: string) => {
  return (
    await axios.get<GithubUser>('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
  ).data
}

interface ParsedGitHubUrl {
  owner: string
  repo: string
}

interface RepositoryInfo {
  language: string | null
  description: string | null
}

/**
 * Parse a GitHub URL and extract owner and repo name
 * Supports formats: https://github.com/owner/repo, github.com/owner/repo, owner/repo
 */
export const parseGitHubUrl = (url: string): ParsedGitHubUrl | null => {
  try {
    // Remove protocol if present
    let cleanUrl = url.replace(/^https?:\/\//, '')
    // Remove github.com if present
    cleanUrl = cleanUrl.replace(/^github\.com\//, '')
    // Remove trailing .git if present
    cleanUrl = cleanUrl.replace(/\.git$/, '')
    // Remove trailing slash
    cleanUrl = cleanUrl.replace(/\/$/, '')

    const parts = cleanUrl.split('/')
    if (parts.length >= 2) {
      return {
        owner: parts[0],
        repo: parts[1],
      }
    }
    return null
  } catch {
    return null
  }
}

/**
 * Fetch repository information from GitHub API
 */
export const getGitHubRepoInfo = async (
  owner: string,
  repo: string,
): Promise<RepositoryInfo> => {
  try {
    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}`,
    )
    return {
      language: response.data.language,
      description: response.data.description,
    }
  } catch (error) {
    throw new Error(
      `Failed to fetch repository info: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

/**
 * Download repository contents from GitHub via backend endpoint
 */
export const downloadGitHubRepo = async (
  repoInfo: ParsedGitHubUrl,
): Promise<FileSystemItem[]> => {
  try {
    const url = `https://github.com/${repoInfo.owner}/${repoInfo.repo}`
    const response = await axios.post(
      '/v2/system/github/download',
      {
        url,
      },
      {
        responseType: 'arraybuffer',
      },
    )

    // The backend returns a ZIP file as binary data
    // We need to extract it and convert to FileSystemItem array
    // Using dynamic import for ES modules compatibility
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()
    const unzipped = await zip.loadAsync(response.data)

    const fileSystemItems: FileSystemItem[] = []

    // Process all files in the ZIP
    for (const [path, fileEntry] of Object.entries(unzipped.files)) {
      const entry = fileEntry as {
        dir?: boolean
        async?: (type: string) => Promise<string>
      }

      if (entry.dir) {
        // It's a directory - skip
        continue
      }

      // It's a file
      const filePath = path.split('/').filter(Boolean)
      if (filePath.length > 0) {
        const fileName = filePath[filePath.length - 1]

        // Read file content
        let content = ''
        if (entry.async) {
          content = await entry.async('string').catch(() => '')
        }

        const fileItem: FileSystemItem = {
          type: 'file',
          name: fileName,
          content,
        }

        fileSystemItems.push(fileItem)
      }
    }

    // Return as a folder structure (always treat as folder)
    return [
      {
        type: 'folder',
        name: `${repoInfo.repo}-clone`,
        items: fileSystemItems,
      },
    ]
  } catch (error) {
    throw new Error(
      `Failed to download repository: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

/**
 * Extract the main file from a project based on file extensions
 * If extensions are provided, looks for files with those extensions
 * Otherwise, returns the first file's content
 */
export const extractMainFileFromProject = (
  files: FileSystemItem[],
  extensions?: string[],
): string => {
  if (!files || files.length === 0) {
    return ''
  }

  // Look for files with specified extensions
  if (extensions && extensions.length > 0) {
    for (const file of files) {
      if (file.type === 'file') {
        const hasMatchingExtension = extensions.some((ext) =>
          file.name.endsWith(ext),
        )
        if (hasMatchingExtension && file.content) {
          return file.content
        }
      }
    }
  }

  // If no extension match found, return the first file's content
  for (const file of files) {
    if (file.type === 'file' && file.content) {
      return file.content
    }
  }

  return ''
}
