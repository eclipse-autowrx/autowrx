// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { configManagementService } from '@/services/configManagement.service'
import { Button } from '@/components/atoms/button'
import { useToast } from '@/components/molecules/toaster/use-toast'
import CodeEditor from '@/components/molecules/CodeEditor'
import { Spinner } from '@/components/atoms/spinner'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { pushSiteConfigEdit } from '@/utils/siteConfigHistory'
import SiteConfigEditHistory from '@/components/molecules/SiteConfigEditHistory'
import HexOklchConverter from '@/components/molecules/HexOklchConverter'

function getPreviewScopedCss(css: string): string {
  const start = css.indexOf(':root')
  if (start === -1) return ''
  const open = css.indexOf('{', start)
  if (open === -1) return ''
  let depth = 1
  let i = open + 1
  while (i < css.length && depth > 0) {
    if (css[i] === '{') depth++
    else if (css[i] === '}') depth--
    i++
  }
  const inner = css.slice(open + 1, i - 1).trim()
  if (!inner) return ''
  return `.site-style-preview { ${inner} }`
}

const COLOR_VARS = [
  { key: 'background', label: 'Background' },
  { key: 'foreground', label: 'Foreground' },
  { key: 'primary', label: 'Primary' },
  { key: 'primary-foreground', label: 'Primary text' },
  { key: 'secondary', label: 'Secondary' },
  { key: 'muted', label: 'Muted' },
  { key: 'muted-foreground', label: 'Muted text' },
  { key: 'destructive', label: 'Destructive' },
  { key: 'border', label: 'Border' },
  { key: 'input', label: 'Input' },
  { key: 'ring', label: 'Ring' },
] as const

const SiteStyleColorPreview: React.FC<{ css: string }> = ({ css }) => {
  const scopedCss = useMemo(() => getPreviewScopedCss(css), [css])
  if (!scopedCss) return null
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4">
      <p className="text-sm font-medium text-foreground mb-3">Live color preview</p>
      <style dangerouslySetInnerHTML={{ __html: scopedCss }} />
      <div className="site-style-preview space-y-4">
        <div className="flex flex-wrap gap-3">
          {COLOR_VARS.map(({ key, label }) => (
            <div key={key} className="flex flex-col items-center gap-1">
              <div
                className="w-10 h-10 rounded-md border border-[var(--border)] shadow-sm"
                style={{ background: `var(--${key})` }}
                title={label}
              />
              <span className="text-xs text-muted-foreground max-w-18 truncate" title={label}>
                {label}
              </span>
            </div>
          ))}
        </div>
        <div className="rounded-md border border-[var(--border)] p-4" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
          <p className="text-sm font-medium mb-2">Sample UI</p>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <button
              type="button"
              className="px-3 py-1.5 rounded-md text-sm font-medium"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              Primary button
            </button>
            <button
              type="button"
              className="px-3 py-1.5 rounded-md text-sm font-medium border"
              style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
            >
              Outline
            </button>
          </div>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Muted text sample
          </p>
          <input
            type="text"
            readOnly
            placeholder="Input style"
            className="mt-2 w-full max-w-xs rounded-md border px-2 py-1.5 text-sm"
            style={{ borderColor: 'var(--input)', background: 'var(--background)' }}
          />
        </div>
      </div>
    </div>
  )
}

type StyleSubTab = 'style' | 'history'

const SiteStyleSection: React.FC = () => {
  const { data: self, isLoading: selfLoading } = useSelfProfileQuery()
  const [globalCss, setGlobalCss] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [savingStyle, setSavingStyle] = useState<boolean>(false)
  const [restoringDefault, setRestoringDefault] = useState<boolean>(false)
  const [subTab, setSubTab] = useState<StyleSubTab>('style')
  const lastSavedCssRef = useRef<string>('')
  const { toast } = useToast()

  useEffect(() => {
    if (selfLoading || !self) return
    loadGlobalCss()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selfLoading, !!self])

  const loadGlobalCss = async () => {
    try {
      setIsLoading(true)
      const res = await configManagementService.getGlobalCss()
      const content = res?.content || ''
      setGlobalCss(content)
      lastSavedCssRef.current = content
    } catch (err) {
      toast({
        title: 'Load site style failed',
        description:
          err instanceof Error ? err.message : 'Failed to load site style',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSavingStyle(true)
      const valueBefore = lastSavedCssRef.current
      await configManagementService.updateGlobalCss(globalCss)
      pushSiteConfigEdit({
        key: 'SITE_STYLE_CSS',
        valueBefore,
        valueAfter: globalCss,
        section: 'style',
      })
      lastSavedCssRef.current = globalCss
      toast({ title: 'Saved', description: 'Site style updated. Reloading page...' })
      
      // Reload page to apply new CSS immediately
      setTimeout(() => {
        window.location.href = window.location.href
      }, 800)
    } catch (err) {
      toast({
        title: 'Save failed',
        description:
          err instanceof Error ? err.message : 'Failed to save site style',
        variant: 'destructive',
      })
      setSavingStyle(false)
    }
  }

  const handleRestoreDefault = async () => {
    if (!window.confirm('Restore default CSS? This will overwrite your current changes.')) return

    try {
      setRestoringDefault(true)
      const res = await configManagementService.restoreDefaultGlobalCss()
      setGlobalCss(res?.content || '')
      toast({ title: 'Restored', description: 'Site style restored to default. Reloading page...' })
      
      // Reload page to apply default CSS immediately
      setTimeout(() => {
        window.location.href = window.location.href
      }, 800)
    } catch (err) {
      toast({
        title: 'Restore failed',
        description:
          err instanceof Error ? err.message : 'Failed to restore default style',
        variant: 'destructive',
      })
      setRestoringDefault(false)
    }
  }

  return (
    <>
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className="text-lg font-semibold text-foreground">
            Site Style (global.css)
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Customize the appearance of your site with custom CSS
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleRestoreDefault}
            variant="outline"
            size="sm"
            disabled={restoringDefault || isLoading}
          >
            {restoringDefault ? 'Restoring...' : 'Restore Default'}
          </Button>
          <Button size="sm" onClick={handleSave} disabled={savingStyle || isLoading}>
            {savingStyle ? 'Saving...' : 'Save Style'}
          </Button>
        </div>
      </div>

      {/* Sub-tabs: Style | History */}
      <div className="px-6 pt-2 border-b border-border flex items-end justify-between">
        <div className="flex gap-1 pb-2">
          <button
            type="button"
            onClick={() => setSubTab('style')}
            className={`px-4 py-2 rounded-t-md text-sm font-medium transition-colors ${
              subTab === 'style'
                ? 'bg-muted text-foreground border border-b-0 border-border -mb-px'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            Style
          </button>
          <button
            type="button"
            onClick={() => setSubTab('history')}
            className={`px-4 py-2 rounded-t-md text-sm font-medium transition-colors ${
              subTab === 'history'
                ? 'bg-muted text-foreground border border-b-0 border-border -mb-px'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            History
          </button>
        </div>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Spinner />
          </div>
        ) : subTab === 'history' ? (
          <div className="px-0">
            <SiteConfigEditHistory section="style" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <HexOklchConverter />
            <SiteStyleColorPreview css={globalCss} />
            <div className="h-[60vh] flex flex-col">
              <CodeEditor
                code={globalCss}
                setCode={setGlobalCss}
                editable={true}
                language="css"
                onBlur={() => {}}
                fontSize={14}
              />
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default SiteStyleSection
