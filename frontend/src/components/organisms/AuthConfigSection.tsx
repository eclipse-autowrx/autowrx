// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useState, useEffect } from 'react'
import { configManagementService, Config } from '@/services/configManagement.service'
import { Button } from '@/components/atoms/button'
import { Checkbox } from '@/components/atoms/checkbox'
import { Label } from '@/components/atoms/label'
import { useToast } from '@/components/molecules/toaster/use-toast'
import { Spinner } from '@/components/atoms/spinner'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { PREDEFINED_AUTH_CONFIGS } from '@/pages/SiteConfigManagement'
import { pushSiteConfigEdit } from '@/utils/siteConfigHistory'

const AuthConfigSection: React.FC = () => {
  const { data: self, isLoading: selfLoading } = useSelfProfileQuery()
  const [configs, setConfigs] = useState<Config[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (selfLoading || !self) return
    loadConfigs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selfLoading, !!self])

  const loadConfigs = async () => {
    try {
      setIsLoading(true)

      // Get existing auth configs from DB
      const res = await configManagementService.getConfigs({
        secret: false,
        scope: 'site',
        category: 'auth',
        limit: 100,
      })

      const existingConfigs = res.results || []
      const existingKeys = new Set(existingConfigs.map(config => config.key))

      // Find missing predefined auth configs and create them
      const missingConfigs = PREDEFINED_AUTH_CONFIGS.filter(
        config => !existingKeys.has(config.key)
      )

      if (missingConfigs.length > 0) {
        await configManagementService.bulkUpsertConfigs({
          configs: missingConfigs,
        })

        // Reload configs after creating missing ones
        const updatedRes = await configManagementService.getConfigs({
          secret: false,
          scope: 'site',
          category: 'auth',
          limit: 100,
        })

        setConfigs(updatedRes.results || [])
      } else {
        setConfigs(existingConfigs)
      }
    } catch (err) {
      toast({
        title: 'Load failed',
        description: err instanceof Error ? err.message : 'Failed to load auth configs',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleConfig = async (config: Config) => {
    try {
      setIsSaving(true)
      const newValue = !config.value

      if (config.id) {
        await configManagementService.updateConfigById(config.id, {
          value: newValue,
        })
        pushSiteConfigEdit({
          key: config.key,
          valueBefore: config.value,
          valueAfter: newValue,
          valueType: config.valueType,
          section: 'auth',
        })
        toast({
          title: 'Updated',
          description: `${config.key} ${newValue ? 'enabled' : 'disabled'}. Reloading page...`,
        })

        // Force hard reload to clear all caches including auth config cache
        setTimeout(() => {
          window.location.href = window.location.href
        }, 800)
      }
    } catch (err) {
      toast({
        title: 'Update failed',
        description: err instanceof Error ? err.message : 'Failed to update config',
        variant: 'destructive',
      })
      setIsSaving(false)
    }
  }

  const handleFactoryReset = async () => {
    if (
      !window.confirm(
        'Restore all auth configs to default values? This will reset authentication settings to their default open mode (all enabled).'
      )
    )
      return

    try {
      setIsLoading(true)

      // Delete all auth configs
      const allConfigs = await configManagementService.getConfigs({
        secret: false,
        scope: 'site',
        category: 'auth',
        limit: 100,
      })

      for (const config of allConfigs.results || []) {
        try {
          if (config.id) {
            await configManagementService.deleteConfigById(config.id)
          }
        } catch (e) {
          console.warn('Failed to delete config', config.key, e)
        }
      }

      toast({ 
        title: 'Restored', 
        description: 'Auth configs restored to default values. Reloading page...' 
      })
      
      // Force hard reload to clear all caches including auth config cache
      setTimeout(() => {
        window.location.href = window.location.href
      }, 800)
    } catch (err) {
      toast({
        title: 'Reset failed',
        description: err instanceof Error ? err.message : 'Failed to reset configs',
        variant: 'destructive',
      })
      setIsLoading(false)
    }
  }

  const getConfigInfo = (key: string) => {
    return PREDEFINED_AUTH_CONFIGS.find(c => c.key === key)
  }

  return (
    <>
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold text-foreground">
              Authentication Configuration
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Control authentication and user registration settings
            </p>
          </div>
          <Button
            onClick={handleFactoryReset}
            variant="outline"
            size="sm"
            disabled={isLoading || isSaving}
          >
            Restore default
          </Button>
        </div>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Spinner />
          </div>
        ) : (
          <div className="space-y-6">
            {configs.map((config) => {
              const info = getConfigInfo(config.key)
              return (
                <div
                  key={config.id}
                  className="flex items-start justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground">{config.key}</h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          config.value
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}
                      >
                        {config.value ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {info?.description || config.description || 'No description available'}
                    </p>
                  </div>
                  <div className="ml-4 flex items-center">
                    <Checkbox
                      checked={config.value === true}
                      onCheckedChange={() => handleToggleConfig(config)}
                      disabled={isSaving}
                      className="h-5 w-5"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {configs.length === 0 && !isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            No authentication configurations found
          </div>
        )}
      </div>
    </>
  )
}

export default AuthConfigSection

