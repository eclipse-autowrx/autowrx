// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useMemo } from 'react'

/**
 * Checks whether `name` clashes with any entry in `existingNames` (case-insensitive).
 * When `skipName` is provided the check is skipped for that exact value — use this for
 * rename scenarios where the current name should not count as a conflict.
 */
const useDuplicateNameCheck = (
  name: string,
  existingNames: string[],
  skipName?: string,
): { isDuplicate: boolean; suggestedName: string | null } => {
  const isDuplicate = useMemo(() => {
    const trimmed = name.trim()
    if (!trimmed) return false
    if (skipName && trimmed.toLowerCase() === skipName.toLowerCase()) return false
    return existingNames.some((n) => n.toLowerCase() === trimmed.toLowerCase())
  }, [name, existingNames, skipName])

  const suggestedName = useMemo(() => {
    if (!isDuplicate || !name.trim()) return null
    const existing = new Set(existingNames.map((n) => n.toLowerCase()))
    // If name already ends with _N, increment N instead of appending _1
    const match = name.trim().match(/^(.*?)_(\d+)$/)
    const base = match ? match[1] : name.trim()
    let counter = match ? parseInt(match[2], 10) + 1 : 1
    let candidate = `${base}_${counter}`
    while (existing.has(candidate.toLowerCase())) {
      counter++
      candidate = `${base}_${counter}`
    }
    return candidate
  }, [isDuplicate, name, existingNames])

  return { isDuplicate, suggestedName }
}

export default useDuplicateNameCheck
