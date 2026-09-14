// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { configManagementService } from '@/services/configManagement.service'
import { Button } from '@/components/atoms/button'
import { useToast } from '@/components/molecules/toaster/use-toast'
import { Spinner } from '@/components/atoms/spinner'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { pushSiteConfigEdit } from '@/utils/siteConfigHistory'
import privacyMarkdownComponents from '@/lib/privacyMarkdownComponents'

const PRIVACY_POLICY_KEY = 'PRIVACY_POLICY_CONTENT'

type SubTab = 'edit' | 'preview'

const PrivacyPolicySection: React.FC = () => {
  const { data: self, isLoading: selfLoading } = useSelfProfileQuery()
  const [content, setContent] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [subTab, setSubTab] = useState<SubTab>('edit')
  const lastSavedRef = useRef<string>('')
  const { toast } = useToast()

  useEffect(() => {
    if (selfLoading || !self) return
    loadContent()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selfLoading, !!self])

  const loadContent = async () => {
    try {
      setIsLoading(true)
      const res = await configManagementService.getConfigByKey(PRIVACY_POLICY_KEY)
      const value = typeof res?.value === 'string' ? res.value : ''
      setContent(value)
      lastSavedRef.current = value
    } catch {
      // Config may not exist yet; start with empty
      setContent('')
      lastSavedRef.current = ''
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const valueBefore = lastSavedRef.current
      await configManagementService.updateConfigByKey(PRIVACY_POLICY_KEY, {
        value: content,
      })
      pushSiteConfigEdit({
        key: PRIVACY_POLICY_KEY,
        valueBefore,
        valueAfter: content,
        valueType: 'string',
        section: 'privacy',
      })
      lastSavedRef.current = content
      toast({ title: 'Saved', description: 'Privacy policy content updated successfully.' })
    } catch (err) {
      toast({
        title: 'Save failed',
        description: err instanceof Error ? err.message : 'Failed to save privacy policy content',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const hasChanges = content !== lastSavedRef.current

  return (
    <>
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className="text-lg font-semibold text-foreground">Privacy Policy</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Paste markdown text to display as the Privacy Policy page at{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">/privacy-policy</code>
          </p>
        </div>
        {hasChanges && (
          <Button onClick={handleSave} disabled={isSaving} size="sm">
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        )}
      </div>

      {/* Sub-tabs */}
      <div className="px-6 pt-2 border-b border-border">
        <div className="flex gap-1 pb-2">
          {(['edit', 'preview'] as SubTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setSubTab(tab)}
              className={`px-4 py-2 rounded-t-md text-sm font-medium capitalize transition-colors ${
                subTab === tab
                  ? 'bg-muted text-foreground border border-b-0 border-border -mb-px'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Spinner />
          </div>
        ) : subTab === 'edit' ? (
          <div className="flex flex-col gap-3">
            <textarea
              className="w-full min-h-[500px] rounded-md border border-border bg-background text-foreground text-sm font-mono p-3 resize-y focus:outline-none focus:ring-2 focus:ring-ring"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="# Privacy Policy&#10;&#10;Paste your privacy policy content in Markdown format here..."
              spellCheck={false}
            />
            {hasChanges && (
              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Privacy Policy'}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="border border-border rounded-md px-10 py-8 bg-background min-h-[200px]">
            {content ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={privacyMarkdownComponents}>{content}</ReactMarkdown>
            ) : (
              <p className="text-muted-foreground italic">No content yet. Switch to the Edit tab to add privacy policy content.</p>
            )}
          </div>
        )}
      </div>
    </>
  )
}

export default PrivacyPolicySection
