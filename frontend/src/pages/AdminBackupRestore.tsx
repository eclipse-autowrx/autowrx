// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useRef, useState } from 'react'
import usePermissionHook from '@/hooks/usePermissionHook'
import { PERMISSIONS } from '@/const/permission'
import {
  BACKUP_SECTIONS,
  ConflictItem,
  ConflictReport,
  Resolution,
  SectionKey,
  UploadAnalysisResult,
  applyRestore,
  downloadBackup,
  uploadBackup,
} from '@/services/backup.service'
import { Button } from '@/components/atoms/button'
import {
  TbArchive,
  TbCloudUpload,
  TbDownload,
  TbAlertTriangle,
  TbCheck,
  TbX,
  TbLoader2,
} from 'react-icons/tb'
import { useToast } from '@/components/molecules/toaster/use-toast'

// ─── Section labels for display ──────────────────────────────────────────────

const SECTION_LABELS: Record<string, string> = Object.fromEntries(
  BACKUP_SECTIONS.map((s) => [s.key, s.label]),
)

// ─── Conflict resolution table ───────────────────────────────────────────────

interface ConflictTableProps {
  sectionKey: string
  items: ConflictItem[]
  onResolutionChange: (sectionKey: string, itemId: string, resolution: 'skip' | 'replace') => void
}

const ConflictTable: React.FC<ConflictTableProps> = ({ sectionKey, items, onResolutionChange }) => {
  if (!items.length) return null
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-foreground mb-2">
        {SECTION_LABELS[sectionKey] ?? sectionKey}
        <span className="ml-2 text-xs font-normal text-muted-foreground">
          ({items.length} conflict{items.length !== 1 ? 's' : ''})
        </span>
      </h3>
      <div className="rounded-md border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Name</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Details</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground w-36">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((item) => (
              <tr key={item.id} className="bg-background hover:bg-muted/20 transition-colors">
                <td className="px-3 py-2 font-medium">{item.name}</td>
                <td className="px-3 py-2 text-muted-foreground text-xs">{item.description}</td>
                <td className="px-3 py-2">
                  <select
                    className="w-full rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                    value={item.resolution}
                    onChange={(e) =>
                      onResolutionChange(sectionKey, item.id, e.target.value as 'skip' | 'replace')
                    }
                  >
                    <option value="skip">Skip (keep existing)</option>
                    <option value="replace">Replace with backup</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

const AdminBackupRestore: React.FC = () => {
  const [isAuthorized] = usePermissionHook([PERMISSIONS.MANAGE_USERS])
  const { toast } = useToast()

  // ── Backup state ──
  const [selectedSections, setSelectedSections] = useState<SectionKey[]>(
    BACKUP_SECTIONS.map((s) => s.key),
  )
  const [isBackingUp, setIsBackingUp] = useState(false)

  // ── Restore state ──
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [analysis, setAnalysis] = useState<UploadAnalysisResult | null>(null)
  const [conflicts, setConflicts] = useState<ConflictReport>({})
  const [isApplying, setIsApplying] = useState(false)
  const [restoreResult, setRestoreResult] = useState<{
    imported: Record<string, number>
    skipped: Record<string, number>
    errors: Array<{ type: string; id: string; error: string }>
  } | null>(null)

  if (!isAuthorized) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground">Access denied</h1>
          <p className="mt-2 text-base text-muted-foreground">
            You do not have permission to access backup and restore.
          </p>
        </div>
      </div>
    )
  }

  // ── Backup handlers ──

  const toggleSection = (key: SectionKey) => {
    setSelectedSections((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    )
  }

  const handleDownloadBackup = async () => {
    if (!selectedSections.length) {
      toast({ title: 'Select at least one section to back up', variant: 'destructive' })
      return
    }
    setIsBackingUp(true)
    try {
      const blob = await downloadBackup(selectedSections)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `autowrx-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.zip`
      a.click()
      URL.revokeObjectURL(url)
      toast({ title: 'Backup downloaded successfully' })
    } catch (err: any) {
      toast({
        title: 'Backup failed',
        description: err?.response?.data?.message || err?.message || 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setIsBackingUp(false)
    }
  }

  // ── Restore handlers ──

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset restore state
    setAnalysis(null)
    setConflicts({})
    setRestoreResult(null)
    setIsUploading(true)

    try {
      const result = await uploadBackup(file)
      setAnalysis(result)
      // Deep-copy conflicts so we can mutate resolutions
      const initialConflicts: ConflictReport = {}
      for (const [key, items] of Object.entries(result.conflicts)) {
        initialConflicts[key as SectionKey] = (items as ConflictItem[]).map((item: ConflictItem) => ({
          ...item,
          resolution: 'skip' as const,
        }))
      }
      setConflicts(initialConflicts)
    } catch (err: any) {
      toast({
        title: 'Failed to analyze backup',
        description: err?.response?.data?.message || err?.message || 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleResolutionChange = (sectionKey: string, itemId: string, resolution: 'skip' | 'replace') => {
    setConflicts((prev) => ({
      ...prev,
      [sectionKey]: (prev[sectionKey as SectionKey] || []).map((item) =>
        item.id === itemId ? { ...item, resolution } : item,
      ),
    }))
  }

  const setAllResolutions = (resolution: 'skip' | 'replace') => {
    setConflicts((prev) => {
      const next: ConflictReport = {}
      for (const [key, items] of Object.entries(prev)) {
        next[key as SectionKey] = (items as ConflictItem[] || []).map((item: ConflictItem) => ({ ...item, resolution }))
      }
      return next
    })
  }

  const handleApplyRestore = async () => {
    if (!analysis) return
    setIsApplying(true)
    setRestoreResult(null)

    // Build flat resolutions array from all sections
    const resolutions: Resolution[] = []
    for (const items of Object.values(conflicts)) {
      for (const item of items || []) {
        resolutions.push({ id: item.id, resolution: item.resolution })
      }
    }

    try {
      const result = await applyRestore(analysis.sessionId, resolutions)
      setRestoreResult(result as any)
      setAnalysis(null)
      setConflicts({})
      toast({ title: 'Restore completed successfully' })
    } catch (err: any) {
      toast({
        title: 'Restore failed',
        description: err?.response?.data?.message || err?.message || 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setIsApplying(false)
    }
  }

  const totalConflicts = Object.values(conflicts).reduce(
    (sum, items) => sum + (items?.length ?? 0),
    0,
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-foreground flex items-center gap-3">
            <TbArchive className="text-primary" size={32} />
            Backup & Restore
          </h1>
          <p className="mt-2 text-muted-foreground">
            Export all critical app data as a ZIP file, or restore from a previous backup.
          </p>
        </div>

        {/* ── BACKUP SECTION ── */}
        <section className="mb-10 rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TbDownload className="text-primary" size={22} />
            <h2 className="text-xl font-semibold text-foreground">Create Backup</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-5">
            Select the data sections to include in the backup ZIP.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {BACKUP_SECTIONS.map((section) => (
              <label
                key={section.key}
                className="flex items-center gap-3 cursor-pointer rounded-lg border border-border p-3 hover:bg-muted/30 transition-colors"
              >
                <input
                  type="checkbox"
                  className="rounded border-border accent-primary w-4 h-4"
                  checked={selectedSections.includes(section.key)}
                  onChange={() => toggleSection(section.key)}
                />
                <span className="text-sm font-medium text-foreground">{section.label}</span>
              </label>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleDownloadBackup}
              disabled={isBackingUp || !selectedSections.length}
              className="flex items-center gap-2"
            >
              {isBackingUp ? (
                <TbLoader2 className="animate-spin" size={16} />
              ) : (
                <TbDownload size={16} />
              )}
              {isBackingUp ? 'Creating backup…' : 'Download Backup ZIP'}
            </Button>
            <span className="text-xs text-muted-foreground">
              {selectedSections.length} of {BACKUP_SECTIONS.length} sections selected
            </span>
          </div>
        </section>

        {/* ── RESTORE SECTION ── */}
        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TbCloudUpload className="text-primary" size={22} />
            <h2 className="text-xl font-semibold text-foreground">Restore from Backup</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-5">
            Upload a backup ZIP file. Conflicts will be detected and you can choose to skip or
            replace each item.
          </p>

          {/* File upload area */}
          {!analysis && !isUploading && !restoreResult && (
            <div
              className="border-2 border-dashed border-border rounded-lg p-10 text-center hover:border-primary/60 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const file = e.dataTransfer.files[0]
                if (file && fileInputRef.current) {
                  const dt = new DataTransfer()
                  dt.items.add(file)
                  fileInputRef.current.files = dt.files
                  fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }))
                }
              }}
            >
              <TbCloudUpload className="mx-auto text-muted-foreground mb-3" size={40} />
              <p className="text-sm font-medium text-foreground">
                Click or drag a backup ZIP file here
              </p>
              <p className="text-xs text-muted-foreground mt-1">Only .zip backup files are accepted</p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".zip"
            className="hidden"
            onChange={handleFileUpload}
          />

          {/* Uploading state */}
          {isUploading && (
            <div className="flex items-center gap-3 py-6 text-muted-foreground">
              <TbLoader2 className="animate-spin" size={24} />
              <span className="text-sm">Analyzing backup file…</span>
            </div>
          )}

          {/* Restore result */}
          {restoreResult && (
            <div className="rounded-lg border border-border bg-muted/20 p-5">
              <div className="flex items-center gap-2 mb-4">
                <TbCheck className="text-green-600" size={20} />
                <h3 className="text-base font-semibold text-foreground">Restore Complete</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    Imported
                  </p>
                  {Object.entries(restoreResult.imported).map(([key, count]) => (
                    <div key={key} className="flex justify-between text-sm py-0.5">
                      <span className="text-foreground">{SECTION_LABELS[key] ?? key}</span>
                      <span className="font-medium text-green-600">{count}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    Skipped
                  </p>
                  {Object.entries(restoreResult.skipped).map(([key, count]) => (
                    <div key={key} className="flex justify-between text-sm py-0.5">
                      <span className="text-foreground">{SECTION_LABELS[key] ?? key}</span>
                      <span className="font-medium text-muted-foreground">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {restoreResult.errors.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-destructive uppercase tracking-wide mb-2">
                    Errors ({restoreResult.errors.length})
                  </p>
                  <ul className="space-y-1">
                    {restoreResult.errors.map((err, i) => (
                      <li key={i} className="text-xs text-destructive bg-destructive/10 rounded px-2 py-1">
                        [{err.type}] {err.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setRestoreResult(null)}
              >
                Restore Another Backup
              </Button>
            </div>
          )}

          {/* Analysis result */}
          {analysis && !isApplying && (
            <div>
              {/* Manifest summary */}
              <div className="rounded-lg border border-border bg-muted/20 p-4 mb-5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Backup Info
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Created</p>
                    <p className="text-sm font-medium">
                      {new Date(analysis.manifest.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Sections</p>
                    <p className="text-sm font-medium">{analysis.manifest.sections.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Records</p>
                    <p className="text-sm font-medium">
                      {Object.values(analysis.manifest.counts).reduce((a, b) => a + b, 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Conflicts</p>
                    <p className={`text-sm font-medium ${totalConflicts > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                      {totalConflicts}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {analysis.manifest.sections.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary font-medium"
                    >
                      {SECTION_LABELS[s] ?? s}
                      {analysis.manifest.counts[s] !== undefined && (
                        <span className="ml-1 text-primary/70">({analysis.manifest.counts[s]})</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>

              {/* Conflict resolution */}
              {totalConflicts > 0 ? (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <TbAlertTriangle className="text-amber-500" size={20} />
                    <h3 className="text-base font-semibold text-foreground">
                      Resolve Conflicts ({totalConflicts} items already exist)
                    </h3>
                  </div>

                  {/* Bulk actions */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs text-muted-foreground">Set all to:</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAllResolutions('skip')}
                    >
                      Skip All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAllResolutions('replace')}
                    >
                      Replace All
                    </Button>
                  </div>

                  {(Object.entries(conflicts) as [string, ConflictItem[]][]).map(
                    ([sectionKey, items]) =>
                      items && items.length > 0 ? (
                        <ConflictTable
                          key={sectionKey}
                          sectionKey={sectionKey}
                          items={items}
                          onResolutionChange={handleResolutionChange}
                        />
                      ) : null,
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-4 text-green-700 bg-green-50 rounded-lg px-4 py-3 border border-green-200">
                  <TbCheck size={18} />
                  <span className="text-sm font-medium">No conflicts detected. All items will be imported.</span>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-3 mt-6">
                <Button
                  onClick={handleApplyRestore}
                  disabled={isApplying}
                  className="flex items-center gap-2"
                >
                  {isApplying ? (
                    <TbLoader2 className="animate-spin" size={16} />
                  ) : (
                    <TbCloudUpload size={16} />
                  )}
                  {isApplying ? 'Restoring…' : 'Apply Restore'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setAnalysis(null)
                    setConflicts({})
                  }}
                  className="flex items-center gap-2"
                >
                  <TbX size={16} />
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Applying state */}
          {isApplying && (
            <div className="flex items-center gap-3 py-6 text-muted-foreground">
              <TbLoader2 className="animate-spin" size={24} />
              <span className="text-sm">Applying restore… This may take a moment.</span>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default AdminBackupRestore
