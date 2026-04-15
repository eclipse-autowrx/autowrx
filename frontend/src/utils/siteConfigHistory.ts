// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const HISTORY_KEY_PREFIX = 'site-config-edit-history-'
const MAX_HISTORY_PER_SECTION = 5

// One-time migration map: old section key → new section key.
// getSiteConfigEditHistory will merge and clean up old keys automatically.
const SECTION_MIGRATIONS: Record<string, string> = {
  prototype: 'model_prototype',
}

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

// Get the most recent edit entries for a given section (tab).
// Automatically migrates entries from any renamed predecessor section.
export function getSiteConfigEditHistory(section: string): SiteConfigEditEntry[] {
  try {
    const raw = localStorage.getItem(storageKey(section))
    let entries: SiteConfigEditEntry[] = []
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) entries = parsed
    }

    const oldSection = Object.entries(SECTION_MIGRATIONS).find(([, v]) => v === section)?.[0]
    if (oldSection) {
      const oldRaw = localStorage.getItem(storageKey(oldSection))
      if (oldRaw) {
        const oldParsed = JSON.parse(oldRaw)
        if (Array.isArray(oldParsed) && oldParsed.length > 0) {
          entries = [...entries, ...oldParsed]
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, MAX_HISTORY_PER_SECTION)
          localStorage.setItem(storageKey(section), JSON.stringify(entries))
          localStorage.removeItem(storageKey(oldSection))
        }
      }
    }

    return entries
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
