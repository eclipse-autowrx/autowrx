// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useState, useEffect } from 'react'
import { configManagementService } from '@/services/configManagement.service'
import { Button } from '@/components/atoms/button'
import { useToast } from '@/components/molecules/toaster/use-toast'
import CodeEditor from '@/components/molecules/CodeEditor'
import { Spinner } from '@/components/atoms/spinner'
import useSelfProfileQuery from '@/hooks/useSelfProfile'

const SiteStyleSection: React.FC = () => {
  const { data: self, isLoading: selfLoading } = useSelfProfileQuery()
  const [globalCss, setGlobalCss] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [savingStyle, setSavingStyle] = useState<boolean>(false)
  const [restoringDefault, setRestoringDefault] = useState<boolean>(false)
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
      setGlobalCss(res?.content || '')
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
      await configManagementService.updateGlobalCss(globalCss)
      toast({ title: 'Saved', description: 'Site style updated' })
    } catch (err) {
      toast({
        title: 'Save failed',
        description:
          err instanceof Error ? err.message : 'Failed to save site style',
        variant: 'destructive',
      })
    } finally {
      setSavingStyle(false)
    }
  }

  const handleRestoreDefault = async () => {
    if (!window.confirm('Restore default CSS? This will overwrite your current changes.')) return

    try {
      setRestoringDefault(true)
      const res = await configManagementService.restoreDefaultGlobalCss()
      setGlobalCss(res?.content || '')
      toast({ title: 'Restored', description: 'Site style restored to default' })
    } catch (err) {
      toast({
        title: 'Restore failed',
        description:
          err instanceof Error ? err.message : 'Failed to restore default style',
        variant: 'destructive',
      })
    } finally {
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
            disabled={restoringDefault || isLoading}
          >
            {restoringDefault ? 'Restoring...' : 'Restore Default'}
          </Button>
          <Button onClick={handleSave} disabled={savingStyle || isLoading}>
            {savingStyle ? 'Saving...' : 'Save Style'}
          </Button>
        </div>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Spinner />
          </div>
        ) : (
          <div className="h-[70vh] flex flex-col">
            <CodeEditor
              code={globalCss}
              setCode={setGlobalCss}
              editable={true}
              language="css"
              onBlur={() => {}}
              fontSize={14}
            />
          </div>
        )}
      </div>
    </>
  )
}

export default SiteStyleSection
