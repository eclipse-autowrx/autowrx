// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const HISTORY_KEY_PREFIX = 'site-config-edit-history-'
const MAX_HISTORY_PER_SECTION = 5

export interface SiteConfigEditEntry {
  key: string
  valueBefore?: unknown
  valueAfter?: unknown
  // Legacy entries only have value → treat as valueAfter.
  value?: unknown
  valueType?: string
  timestamp: number
}

function storageKey(section: string): string {
  return HISTORY_KEY_PREFIX + section
}

// Get the 5 most recent edit entries for a given section (tab).
export function getSiteConfigEditHistory(section: string): SiteConfigEditEntry[] {
  try {
    const raw = localStorage.getItem(storageKey(section))
    if (!raw) return []
    const parsed = JSON.parse(raw) as SiteConfigEditEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// Append one edit for a section. Keeps at most MAX_HISTORY_PER_SECTION entries.
export function pushSiteConfigEdit(entry: {
  key: string
  valueBefore?: unknown
  valueAfter: unknown
  valueType?: string
  section: string
}): void {
  const { section, valueAfter, valueBefore, ...rest } = entry
  const list = getSiteConfigEditHistory(section)
  const newEntry: SiteConfigEditEntry = {
    ...rest,
    valueBefore,
    valueAfter,
    timestamp: Date.now(),
  }
  const next = [newEntry, ...list].slice(0, MAX_HISTORY_PER_SECTION)
  try {
    localStorage.setItem(storageKey(section), JSON.stringify(next))
    window.dispatchEvent(new CustomEvent('site-config-history-updated', { detail: { section } }))
  } catch {
    // ignore quota or parse errors
  }
}
