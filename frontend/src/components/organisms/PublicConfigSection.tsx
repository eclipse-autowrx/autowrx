// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useState, useEffect } from 'react'
import { configManagementService, Config } from '@/services/configManagement.service'
import ConfigForm from '@/components/molecules/ConfigForm'
import ConfigList from '@/components/molecules/ConfigList'
import { Button } from '@/components/atoms/button'
import { useToast } from '@/components/molecules/toaster/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/atoms/dialog'
import { Spinner } from '@/components/atoms/spinner'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { PREDEFINED_SITE_CONFIGS } from '@/pages/SiteConfigManagement'
import { pushSiteConfigEdit } from '@/utils/siteConfigHistory'
import NavBarActionsEditor, { NavBarAction } from '@/components/molecules/NavBarActionsEditor'
import SiteConfigEditHistory from '@/components/molecules/SiteConfigEditHistory'

const PublicConfigSection: React.FC = () => {
  const { data: self, isLoading: selfLoading } = useSelfProfileQuery()
  const [configs, setConfigs] = useState<Config[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<Config | undefined>()
  const [navBarActions, setNavBarActions] = useState<NavBarAction[]>([])
  const [originalNavBarActions, setOriginalNavBarActions] = useState<NavBarAction[]>([])
  const [isSavingNavBarActions, setIsSavingNavBarActions] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (selfLoading || !self) return
    loadConfigs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selfLoading, !!self])

  const loadConfigs = async () => {
    try {
      setIsLoading(true)

      // First, get existing configs from DB
      const res = await configManagementService.getConfigs({
        secret: false,
        scope: 'site',
        limit: 100,
      })

      const existingConfigs = res.results || []
      const existingKeys = new Set(existingConfigs.map(config => config.key))

      // Find missing predefined configs and create them (excluding NAV_BAR_ACTIONS)
      // NAV_BAR_ACTIONS should only be created when user explicitly adds actions
      const missingConfigs = PREDEFINED_SITE_CONFIGS.filter(
        config => !existingKeys.has(config.key) && config.key !== 'NAV_BAR_ACTIONS'
      )

      // Find existing configs with empty values (empty string, null, or undefined) that should have defaults
      const configsToUpdate: any[] = []
      PREDEFINED_SITE_CONFIGS.forEach(predefinedConfig => {
        if (predefinedConfig.key === 'NAV_BAR_ACTIONS') return
        
        const existingConfig = existingConfigs.find(c => c.key === predefinedConfig.key)
        if (existingConfig) {
          const isEmpty = existingConfig.value === null || 
                         existingConfig.value === undefined || 
                         existingConfig.value === '' ||
                         (typeof existingConfig.value === 'string' && existingConfig.value.trim() === '')
          
          // If existing config is empty but predefined has a non-empty default, update it
          if (isEmpty && predefinedConfig.value !== null && 
              predefinedConfig.value !== undefined && 
              predefinedConfig.value !== '' &&
              !(typeof predefinedConfig.value === 'string' && predefinedConfig.value.trim() === '')) {
            configsToUpdate.push(predefinedConfig)
          }
        }
      })

      // Create missing configs and update empty ones
      const configsToUpsert = [...missingConfigs, ...configsToUpdate]
      if (configsToUpsert.length > 0) {
        await configManagementService.bulkUpsertConfigs({
          configs: configsToUpsert,
        })

        // Reload configs after creating missing ones
        const updatedRes = await configManagementService.getConfigs({
          secret: false,
          scope: 'site',
          limit: 100,
        })

        // Filter to only show predefined configs (excluding NAV_BAR_ACTIONS)
        const predefinedKeys = new Set(PREDEFINED_SITE_CONFIGS.map(c => c.key))
        const filteredConfigs = (updatedRes.results || []).filter(
          config => predefinedKeys.has(config.key) && config.key !== 'NAV_BAR_ACTIONS'
        )

        // Load nav bar actions separately - only show actual DB data, empty if null/undefined
        const navBarActionsConfig = (updatedRes.results || []).find(
          config => config.key === 'NAV_BAR_ACTIONS'
        )
        if (navBarActionsConfig && navBarActionsConfig.value !== null && navBarActionsConfig.value !== undefined) {
          const actions = Array.isArray(navBarActionsConfig.value) ? navBarActionsConfig.value as NavBarAction[] : []
          setNavBarActions(actions)
          setOriginalNavBarActions(JSON.parse(JSON.stringify(actions)))
        } else {
          // DB is empty/null - show empty state
          setNavBarActions([])
          setOriginalNavBarActions([])
        }

        setConfigs(filteredConfigs)
      } else {
        // Filter to only show predefined configs (excluding NAV_BAR_ACTIONS)
        const predefinedKeys = new Set(PREDEFINED_SITE_CONFIGS.map(c => c.key))
        const filteredConfigs = existingConfigs.filter(
          config => predefinedKeys.has(config.key) && config.key !== 'NAV_BAR_ACTIONS'
        )

        // Load nav bar actions separately - only show actual DB data, empty if null/undefined
        const navBarActionsConfig = existingConfigs.find(
          config => config.key === 'NAV_BAR_ACTIONS'
        )
        if (navBarActionsConfig && navBarActionsConfig.value !== null && navBarActionsConfig.value !== undefined) {
          const actions = Array.isArray(navBarActionsConfig.value) ? navBarActionsConfig.value as NavBarAction[] : []
          setNavBarActions(actions)
          setOriginalNavBarActions(JSON.parse(JSON.stringify(actions)))
        } else {
          // DB is empty/null - show empty state
          setNavBarActions([])
          setOriginalNavBarActions([])
        }

        setConfigs(filteredConfigs)
      }
    } catch (err) {
      toast({
        title: 'Load failed',
        description: err instanceof Error ? err.message : 'Failed to load configs',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditConfig = (config: Config) => {
    setEditingConfig(config)
    setIsFormOpen(true)
  }

  const handleDeleteConfig = async (config: Config) => {
    // Prevent deletion of predefined configs
    const isPredefined = PREDEFINED_SITE_CONFIGS.some(c => c.key === config.key)
    if (isPredefined) {
      toast({
        title: 'Cannot delete',
        description: 'Predefined configurations cannot be deleted. You can only edit their values.',
        variant: 'destructive',
      })
      return
    }

    if (!window.confirm(`Delete config "${config.key}"?`)) return

    try {
      setIsLoading(true)
      if (config.id) {
        await configManagementService.deleteConfigById(config.id)
        toast({ title: 'Deleted', description: `Config "${config.key}" deleted. Reloading page...` })
        
        // Reload page to show changes immediately
        setTimeout(() => {
          window.location.reload()
        }, 800)
      }
    } catch (err) {
      toast({
        title: 'Delete failed',
        description: err instanceof Error ? err.message : 'Failed to delete config',
        variant: 'destructive',
      })
      setIsLoading(false)
    }
  }

  const handleSaveConfig = async (config: any) => {
    try {
      setIsLoading(true)
      if (editingConfig?.id) {
        await configManagementService.updateConfigById(editingConfig.id, config)
        pushSiteConfigEdit({
          key: config.key,
          valueBefore: editingConfig.value,
          valueAfter: config.value,
          valueType: config.valueType,
          section: 'public',
        })
        toast({ title: 'Updated', description: `Config "${config.key}" updated. Reloading page...` })
      } else {
        await configManagementService.createConfig({ ...config, secret: false })
        toast({ title: 'Created', description: `Config "${config.key}" created. Reloading page...` })
      }
      
      // Reload page to show changes immediately
      setTimeout(() => {
        window.location.reload()
      }, 800)
    } catch (err) {
      toast({
        title: 'Save failed',
        description: err instanceof Error ? err.message : 'Failed to save config',
        variant: 'destructive',
      })
      setIsLoading(false)
    }
  }

  const handleCancelForm = () => {
    setIsFormOpen(false)
    setEditingConfig(undefined)
  }

  const handleSaveNavBarActions = async () => {
    try {
      setIsSavingNavBarActions(true)
      
      // Update the NAV_BAR_ACTIONS config
      await configManagementService.updateConfigByKey('NAV_BAR_ACTIONS', {
        value: navBarActions,
      })
      pushSiteConfigEdit({
        key: 'NAV_BAR_ACTIONS',
        valueBefore: originalNavBarActions,
        valueAfter: navBarActions,
        valueType: 'array',
        section: 'public',
      })
      toast({ 
        title: 'Saved', 
        description: 'Navigation bar actions updated successfully. Reloading page...' 
      })
      
      // Reload page to show changes immediately
      setTimeout(() => {
        window.location.reload()
      }, 800)
    } catch (err) {
      toast({
        title: 'Save failed',
        description: err instanceof Error ? err.message : 'Failed to save navigation bar actions',
        variant: 'destructive',
      })
      setIsSavingNavBarActions(false)
    }
  }

  const handleFactoryReset = async () => {
    if (!window.confirm('Restore all public configs to default values? This will overwrite your current settings.')) return

    try {
      setIsLoading(true)
      // Only delete public configs (predefined public keys + NAV_BAR_ACTIONS), not other sections
      const publicKeys = new Set([
        ...PREDEFINED_SITE_CONFIGS.map((c) => c.key),
        'NAV_BAR_ACTIONS',
      ])

      const allConfigs = await configManagementService.getConfigs({
        secret: false,
        scope: 'site',
        limit: 100,
      })

      // Delete only public configs
      for (const config of allConfigs.results || []) {
        if (!publicKeys.has(config.key)) continue
        try {
          if (config.id) {
            await configManagementService.deleteConfigById(config.id)
          }
        } catch (e) {
          console.warn('Failed to delete config', config.key, e)
        }
      }

      toast({ title: 'Restored', description: 'Public configs restored to default values. Reloading page...' })
      
      // Reload page to show changes immediately
      setTimeout(() => {
        window.location.reload()
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

  // Check if navBarActions have changed
  const hasNavBarActionsChanged = () => {
    return JSON.stringify(navBarActions) !== JSON.stringify(originalNavBarActions)
  }

  return (
    <>
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold text-foreground">
              Public Configurations
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage public site configuration values
            </p>
          </div>
          <Button
            onClick={handleFactoryReset}
            variant="outline"
            size="sm"
            disabled={isLoading}
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
          <>
            {/* Other Configs List */}
            <ConfigList
              configs={configs}
              onEdit={handleEditConfig}
              onDelete={handleDeleteConfig}
              isLoading={isLoading}
              historySection="public"
            />

            {/* Navigation Bar Actions Section - Moved to bottom */}
            <div className="mt-8 border border-border rounded-lg bg-card">
              <div className="px-6 py-4 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground">
                  Navigation Bar Actions
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure custom action buttons with icons and links for the navigation bar
                </p>
              </div>
              <div className="p-6">
                <NavBarActionsEditor
                  value={navBarActions}
                  onChange={setNavBarActions}
                />
                {hasNavBarActionsChanged() && (
                  <div className="mt-4 flex justify-end">
                    <Button
                      onClick={handleSaveNavBarActions}
                      disabled={isSavingNavBarActions}
                    >
                      {isSavingNavBarActions ? 'Saving...' : 'Save Navigation Bar Actions'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <div className="pb-6">
              <SiteConfigEditHistory section="public" />
            </div>
          </>
        )}
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingConfig ? 'Edit Configuration' : 'Create Configuration'}
            </DialogTitle>
          </DialogHeader>

          <ConfigForm
            config={editingConfig}
            onSave={handleSaveConfig}
            onCancel={handleCancelForm}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}

export default PublicConfigSection
