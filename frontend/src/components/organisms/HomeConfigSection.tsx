// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useState, useEffect, useRef } from 'react'
import { configManagementService } from '@/services/configManagement.service'
import { Button } from '@/components/atoms/button'
import { useToast } from '@/components/molecules/toaster/use-toast'
import CodeEditor, { CodeEditorHandle } from '@/components/molecules/CodeEditor'
import { Spinner } from '@/components/atoms/spinner'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { pushSiteConfigEdit } from '@/utils/siteConfigHistory'
import SiteConfigEditHistory from '@/components/molecules/SiteConfigEditHistory'

const HomeConfigSection: React.FC = () => {
  const { data: self, isLoading: selfLoading } = useSelfProfileQuery()
  const [homeConfig, setHomeConfig] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [savingHome, setSavingHome] = useState<boolean>(false)
  const { toast } = useToast()
  const codeEditorRef = useRef<CodeEditorHandle>(null)

  useEffect(() => {
    if (selfLoading || !self) return
    loadHomeConfig()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selfLoading, !!self])

  const loadHomeConfig = async () => {
    try {
      setIsLoading(true)
      // Query by key and scope instead of using getConfigByKey
      const res = await configManagementService.getConfigs({
        key: 'CFG_HOME_CONTENT',
        scope: 'site',
        limit: 1,
      })

      if (res.results && res.results.length > 0) {
        const config = res.results[0]
        // If value is object/array, stringify it for the editor
        const content =
          typeof config.value === 'string'
            ? config.value
            : JSON.stringify(config.value || {}, null, 2)
        setHomeConfig(content)
      } else {
        // Config doesn't exist yet, use empty object as fallback
        const fallbackContent = JSON.stringify({}, null, 2)
        setHomeConfig(fallbackContent)
      }
    } catch (err: any) {
      console.error('Load home config error:', err)
      // If config doesn't exist or error, use empty object as fallback
      const fallbackContent = JSON.stringify({}, null, 2)
      setHomeConfig(fallbackContent)
      toast({
        title: 'Load home config failed',
        description:
          err?.response?.data?.message ||
          err?.message ||
          'Failed to load home configuration',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSavingHome(true)

      // Parse JSON to validate and get object value
      let configValue: any
      try {
        configValue = JSON.parse(homeConfig || '{}')
      } catch (parseErr) {
        toast({
          title: 'Invalid JSON',
          description: 'Please ensure the configuration is valid JSON',
          variant: 'destructive',
        })
        setSavingHome(false)
        return
      }

      // Check if config exists first
      const existing = await configManagementService.getConfigs({
        key: 'CFG_HOME_CONTENT',
        scope: 'site',
        limit: 1,
      })

      // Check if it's a real DB config (has id) or just a default (no id)
      const hasDbConfig =
        existing.results &&
        existing.results.length > 0 &&
        existing.results[0].id &&
        !(existing.results[0] as any).isDefault

      const valueBefore =
        existing.results && existing.results.length > 0
          ? existing.results[0].value
          : undefined

      if (hasDbConfig) {
        // Update existing config in DB
        const configId = existing.results[0].id!
        await configManagementService.updateConfigById(configId, {
          value: configValue,
        })
      } else {
        // Create new config (either no results or only default value)
        await configManagementService.createConfig({
          key: 'CFG_HOME_CONTENT',
          scope: 'site',
          value: configValue,
          secret: false,
          valueType: 'array',
          category: 'home',
        })
      }

      pushSiteConfigEdit({
        key: 'CFG_HOME_CONTENT',
        valueBefore,
        valueAfter: configValue,
        valueType: 'array',
        section: 'home',
      })
      toast({ title: 'Saved', description: 'Home configuration updated. Reloading page...' })

      // Reload page to show changes immediately
      setTimeout(() => {
        window.location.href = window.location.href
      }, 800)
    } catch (err: any) {
      console.error('Save home config error:', err)
      toast({
        title: 'Save failed',
        description:
          err?.response?.data?.message ||
          err?.message ||
          'Failed to save home configuration',
        variant: 'destructive',
      })
      setSavingHome(false)
    }
  }

  return (
    <>
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className="text-lg font-semibold text-foreground">
            Home Configuration
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure home page content and layout
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => codeEditorRef.current?.foldAll()}
            disabled={isLoading}
          >
            Collapse all
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => codeEditorRef.current?.unfoldAll()}
            disabled={isLoading}
          >
            Expand all
          </Button>
          <Button size="sm" onClick={handleSave} disabled={savingHome}>
            {savingHome ? 'Saving...' : 'Save'}
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
              ref={codeEditorRef}
              code={homeConfig}
              setCode={setHomeConfig}
              editable={true}
              language="json"
              onBlur={() => {}}
              fontSize={14}
            />
          </div>
        )}
      </div>
      <div className="px-6 pb-6">
        <SiteConfigEditHistory section="home" />
      </div>
    </>
  )
}

export default HomeConfigSection
