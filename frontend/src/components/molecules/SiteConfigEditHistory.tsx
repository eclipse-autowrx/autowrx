// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  getSiteConfigEditHistory,
  type SiteConfigEditEntry,
} from '@/utils/siteConfigHistory'
import type { SiteConfigHistorySection } from '@/components/molecules/ConfigList'
import Diff from 'diff-match-patch'

interface SiteConfigEditHistoryProps {
  section: SiteConfigHistorySection
  onRestoreEntry?: (entry: SiteConfigEditEntry) => void
}

const dmp = new Diff()

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'boolean') return v ? 'true' : 'false'
  if (typeof v === 'object') return JSON.stringify(v, null, 2)
  return String(v)
}

// Render unified diff (git style): removed = red, added = green
function DiffView({ before, after }: { before: string; after: string }) {
  const chunks = useMemo(() => {
    const diff = dmp.diff_main(before, after)
    dmp.diff_cleanupSemantic(diff)
    return diff
  }, [before, after])

  if (before === '' && after === '') return <span className="text-muted-foreground">—</span>

  return (
    <span className="whitespace-pre-wrap break-words font-mono text-xs">
      {chunks.map(([op, text], i) => {
        if (text === '') return null
        if (op === -1) {
          return (
            <span key={i} className="bg-red-200/80 text-red-900 dark:bg-red-900/40 dark:text-red-200">
              {text}
            </span>
          )
        }
        if (op === 1) {
          return (
            <span key={i} className="bg-green-200/80 text-green-900 dark:bg-green-900/40 dark:text-green-200">
              {text}
            </span>
          )
        }
        return <span key={i}>{text}</span>
      })}
    </span>
  )
}

function formatRelativeTime(ts: number): string {
  const sec = Math.floor((Date.now() - ts) / 1000)
  if (sec < 60) return 'just now'
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`
  if (sec < 86400) return `${Math.floor(sec / 3600)} hours ago`
  return `${Math.floor(sec / 86400)} days ago`
}

const SiteConfigEditHistory: React.FC<SiteConfigEditHistoryProps> = ({
  section,
  onRestoreEntry,
}) => {
  const [editHistory, setEditHistory] = useState<SiteConfigEditEntry[]>(() =>
    getSiteConfigEditHistory(section),
  )

  const refresh = useCallback(() => {
    setEditHistory(getSiteConfigEditHistory(section))
  }, [section])

  useEffect(() => {
    setEditHistory(getSiteConfigEditHistory(section))
  }, [section])

  useEffect(() => {
    const onUpdate = (e: Event) => {
      const detail = (e as CustomEvent<{ section: string }>).detail
      if (detail?.section === section) refresh()
    }
    window.addEventListener('site-config-history-updated', onUpdate)
    return () => window.removeEventListener('site-config-history-updated', onUpdate)
  }, [section, refresh])

  if (editHistory.length === 0) return null

  return (
    <div className="rounded-lg border border-border overflow-hidden bg-muted/20">
      <ul className="p-3 max-h-[70vh] min-h-[280px] overflow-y-auto space-y-3">
        {editHistory.map((entry, i) => {
          const valueBefore = entry.valueBefore
          const valueAfter = entry.valueAfter ?? entry.value
          return (
            <li
              key={`${entry.key}-${entry.timestamp}-${i}`}
              className="rounded-md border border-border overflow-hidden bg-background"
            >
              <div className="px-3 py-1.5 flex items-center justify-between gap-2 border-b border-border bg-muted/50">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-xs font-medium text-primary truncate">
                    {entry.key}
                  </span>
                  <span className="text-[11px] text-muted-foreground shrink-0">
                    {formatRelativeTime(entry.timestamp)}
                  </span>
                </div>
                {/* Do not allow restoring the latest (current) snapshot: only older entries */}
                {onRestoreEntry && i > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          'Restore this configuration snapshot? This will overwrite the current value for this key.',
                        )
                      ) {
                        onRestoreEntry(entry)
                      }
                    }}
                    className="text-[11px] px-2 py-0.5 rounded border border-border text-foreground hover:bg-muted"
                  >
                    Restore
                  </button>
                )}
              </div>
              <div className="p-2">
                <pre className="w-full text-xs text-foreground overflow-auto max-h-40 rounded bg-muted/30 border border-border p-3">
                  <DiffView
                    before={formatValue(valueBefore)}
                    after={formatValue(valueAfter)}
                  />
                </pre>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default SiteConfigEditHistory
