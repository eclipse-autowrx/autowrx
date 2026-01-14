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

const STANDARD_STAGE_KEY = 'STANDARD_STAGE'

const StagingConfigSection: React.FC = () => {
  const { data: self, isLoading: selfLoading } = useSelfProfileQuery()
  const [stagingConfig, setStagingConfig] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [saving, setSaving] = useState<boolean>(false)
  const { toast } = useToast()

  useEffect(() => {
    if (selfLoading || !self) return
    loadStagingConfig()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selfLoading, !!self])

  const loadStagingConfig = async () => {
    try {
      setIsLoading(true)
      try {
        const config = await configManagementService.getConfigByKey(STANDARD_STAGE_KEY)
        // If value is object/array, stringify it for the editor
        const content =
          typeof config.value === 'string'
            ? config.value
            : JSON.stringify(config.value || {}, null, 2)
        setStagingConfig(content)
      } catch (err: any) {
        // Config doesn't exist yet, use default structure as fallback
        const defaultStandardStage = {
          isTopMost: true,
          name: '',
          id: '1',
          children: [],
        }
        const fallbackContent = JSON.stringify(defaultStandardStage, null, 2)
        setStagingConfig(fallbackContent)
      }
    } catch (err: any) {
      console.error('Load staging config error:', err)
      // Use default structure as fallback
      const defaultStandardStage = {
        isTopMost: true,
        name: '',
        id: '1',
        children: [],
      }
      const fallbackContent = JSON.stringify(defaultStandardStage, null, 2)
      setStagingConfig(fallbackContent)
      toast({
        title: 'Load staging config failed',
        description:
          err?.response?.data?.message ||
          err?.message ||
          'Failed to load staging configuration',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      // Parse JSON to validate and get object value
      let configValue: any
      try {
        configValue = JSON.parse(stagingConfig || '{}')
      } catch (parseErr) {
        toast({
          title: 'Invalid JSON',
          description: 'Please ensure the configuration is valid JSON',
          variant: 'destructive',
        })
        setSaving(false)
        return
      }

      // Check if config exists first
      try {
        const existing = await configManagementService.getConfigByKey(STANDARD_STAGE_KEY)
        // Update existing config
        await configManagementService.updateConfigByKey(STANDARD_STAGE_KEY, {
          value: configValue,
        })
      } catch (err: any) {
        // Config doesn't exist, create new one
        await configManagementService.createConfig({
          key: STANDARD_STAGE_KEY,
          scope: 'site',
          value: configValue,
          secret: false,
          valueType: 'object',
          category: 'deploy',
        })
      }

      toast({ title: 'Saved', description: 'Standard staging frame configuration updated successfully' })
    } catch (err: any) {
      console.error('Save staging config error:', err)
      toast({
        title: 'Save failed',
        description:
          err?.response?.data?.message ||
          err?.message ||
          'Failed to save staging configuration',
        variant: 'destructive',
      })
      setSaving(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className="text-lg font-semibold text-foreground">
            Standard Staging Frame
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure standard staging frame structure and component hierarchy
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Spinner />
          </div>
        ) : (
          <div className="h-[70vh] flex flex-col">
            <CodeEditor
              code={stagingConfig}
              setCode={setStagingConfig}
              editable={true}
              language="json"
              onBlur={() => {}}
              fontSize={14}
            />
          </div>
        )}
      </div>
    </>
  )
}

export default StagingConfigSection
