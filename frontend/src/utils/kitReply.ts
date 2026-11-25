// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

export interface ReadFileReply {
  filePath: string
  content: string
  hasError: boolean
  error?: string
}

/** Normalize kit file text to LF line endings for consistent editor round-trips. */
export function normalizeKitFileContent(
  content: string,
  options: { stripTrailingNewline?: boolean } = {},
): string {
  const normalized = String(content ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')

  if (options.stripTrailingNewline) {
    return normalized.replace(/\n+$/, '')
  }

  return normalized
}

/** Prepare file body before write-file emit (LF only, no trailing newline). */
export function prepareKitFileContentForWrite(content: string): string {
  return normalizeKitFileContent(content, { stripTrailingNewline: true })
}

/** Parse read-file kit replies (supports flat and nested data shapes). */
export function parseReadFileReply(payload: any): ReadFileReply | null {
  if (!payload || payload.cmd !== 'read-file') return null

  const filePath = payload.file_path ?? payload.data?.path ?? ''
  const hasError = Boolean(payload.has_error)
  const content = hasError
    ? ''
    : normalizeKitFileContent(payload.result ?? payload.data?.content ?? '')

  return {
    filePath,
    content,
    hasError,
    error: hasError ? String(payload.result ?? 'Read file failed') : undefined,
  }
}

interface WriteFilePayload {
  cmd?: string
  result?: unknown
  has_error?: boolean
  file_path?: string
  data?: { path?: string } | null
}

export interface WriteFileReply {
  filePath: string
  hasError: boolean
  error?: string
}

/**
 * Parse write-file kit replies. Kits may leave out has_error and report a
 * failure only in the result text.
 */
export function parseWriteFileReply(
  payload: WriteFilePayload | null | undefined,
): WriteFileReply | null {
  if (payload?.cmd !== 'write-file' && payload?.cmd !== 'write_file')
    return null

  const result = String(payload.result ?? '')
  const hasError =
    Boolean(payload.has_error) || /^(error|invalid|no file path)/i.test(result)

  return {
    filePath: payload.file_path ?? payload.data?.path ?? '',
    hasError,
    error: hasError ? result || 'Write file failed' : undefined,
  }
}
