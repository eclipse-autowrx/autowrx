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
import {
  PREDEFINED_SITE_CONFIGS,
  PREDEFINED_GENAI_CONFIG_KEYS,
  PREDEFINED_PROTOTYPE_CONFIG_KEYS,
  PREDEFINED_VSCODE_CONFIG_KEYS,
  PREDEFINED_PRIVACY_CONFIG_KEYS,
} from '@/pages/SiteConfigManagement'
import { pushSiteConfigEdit } from '@/utils/siteConfigHistory'
import NavBarActionsEditor, { NavBarAction } from '@/components/molecules/NavBarActionsEditor'
import SiteConfigEditHistory from '@/components/molecules/SiteConfigEditHistory'
import type { SiteConfigEditEntry } from '@/utils/siteConfigHistory'
import {
  deleteConfigsById,
  reloadSoon,
  upsertConfigFromHistory,
} from '@/utils/siteConfigAdmin'

type PublicSubTab = 'config' | 'history'

const PublicConfigSection: React.FC = () => {
  const { data: self, isLoading: selfLoading } = useSelfProfileQuery()
  const [configs, setConfigs] = useState<Config[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<Config | undefined>()
  const [navBarActions, setNavBarActions] = useState<NavBarAction[]>([])
  const [originalNavBarActions, setOriginalNavBarActions] = useState<NavBarAction[]>([])
  const [isSavingNavBarActions, setIsSavingNavBarActions] = useState(false)
  const [subTab, setSubTab] = useState<PublicSubTab>('config')
  const { toast } = useToast()

  const isGenAIKey = (key: string) =>
    PREDEFINED_GENAI_CONFIG_KEYS.includes(key)
  const isPrototypeKey = (key: string) =>
    PREDEFINED_PROTOTYPE_CONFIG_KEYS.includes(key)
  const isVscodeKey = (key: string) => PREDEFINED_VSCODE_CONFIG_KEYS.includes(key)
  const isPrivacyKey = (key: string) =>
    PREDEFINED_PRIVACY_CONFIG_KEYS.includes(key)
  const isSpecialSectionKey = (key: string) =>
    isGenAIKey(key) || isPrototypeKey(key) || isVscodeKey(key) || isPrivacyKey(key)

  useEffect(() => {
    if (selfLoading || !self) return
    loadConfigs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selfLoading, !!self])

  const loadConfigs = async () => {
    try {
      setIsLoading(true)

      // Get existing configs from BE
      const res = await configManagementService.getConfigs({
        secret: false,
        scope: 'site',
        limit: 100,
      })

      let allConfigs = res.results || []
      const existingKeys = new Set(allConfigs.map((c) => c.key))

      // Identify predefined public configs (not in special sections)
      const predefinedPublicConfigs = PREDEFINED_SITE_CONFIGS.filter(
        (c) => !isSpecialSectionKey(c.key),
      )

      // Find and create missing predefined public configs (self-healing)
      const missingConfigs = predefinedPublicConfigs.filter(
        (c) => !existingKeys.has(c.key),
      )

      if (missingConfigs.length > 0) {
        await configManagementService.bulkUpsertConfigs({
          configs: missingConfigs,
        })
        // Re-fetch after healing
        const updatedRes = await configManagementService.getConfigs({
          secret: false,
          scope: 'site',
          limit: 100,
        })
        allConfigs = updatedRes.results || []
      }

      // Filter to only show general public configs for the main list (excluding NAV_BAR_ACTIONS)
      const generalPredefinedKeys = new Set(
        predefinedPublicConfigs
          .map((c) => c.key)
          .filter((key) => key !== 'NAV_BAR_ACTIONS'),
      )
      const predefinedOrder = new Map(
        PREDEFINED_SITE_CONFIGS.map((c, i) => [c.key, i]),
      )
      const filteredConfigs = allConfigs
        .filter((config) => generalPredefinedKeys.has(config.key))
        .sort(
          (a, b) =>
            (predefinedOrder.get(a.key) ?? 999) -
            (predefinedOrder.get(b.key) ?? 999),
        )

      // Load nav bar actions
      const navBarActionsConfig = allConfigs.find(
        (config) => config.key === 'NAV_BAR_ACTIONS',
      )
      if (
        navBarActionsConfig &&
        navBarActionsConfig.value !== null &&
        navBarActionsConfig.value !== undefined
      ) {
        const actions = Array.isArray(navBarActionsConfig.value)
          ? (navBarActionsConfig.value as NavBarAction[])
          : []
        setNavBarActions(actions)
        setOriginalNavBarActions(JSON.parse(JSON.stringify(actions)))
      } else {
        setNavBarActions([])
        setOriginalNavBarActions([])
      }

      setConfigs(filteredConfigs)
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
      
      const predefinedPublicConfigs = PREDEFINED_SITE_CONFIGS.filter(
        (c) => !isSpecialSectionKey(c.key),
      )

      // Instead of deleting and hoping for BE re-seed (which only happens on startup),
      // we bulk upsert the defaults directly.
      await configManagementService.bulkUpsertConfigs({
        configs: predefinedPublicConfigs,
      })

      toast({ title: 'Restored', description: 'Public configs restored to default values. Reloading page...' })

      // Reload page to show changes immediately
      reloadSoon()
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

  const handleRestoreHistoryEntry = async (entry: SiteConfigEditEntry) => {
    try {
      setIsLoading(true)
      const { valueBefore, targetValue } = await upsertConfigFromHistory({
        entry,
        scope: 'site',
      })
      pushSiteConfigEdit({
        key: entry.key,
        valueBefore,
        valueAfter: targetValue,
        valueType: entry.valueType,
        section: 'public',
      })
      toast({
        title: 'Restored',
        description: `Configuration "${entry.key}" restored. Reloading page...`,
      })
      setTimeout(() => window.location.reload(), 800)
    } catch (err) {
      toast({
        title: 'Restore failed',
        description: err instanceof Error ? err.message : 'Failed to restore configuration',
        variant: 'destructive',
      })
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className="text-lg font-semibold text-foreground">
            Public Configurations
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage public site configuration values
          </p>
        </div>
        <div className="flex items-center gap-2">
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

      {/* Sub-tabs: Config | History */}
      <div className="px-6 pt-2 border-b border-border flex items-end justify-between">
        <div className="flex gap-1 pb-2">
          <button
            type="button"
            onClick={() => setSubTab('config')}
            className={`px-4 py-2 rounded-t-md text-sm font-medium transition-colors ${subTab === 'config'
              ? 'bg-muted text-foreground border border-b-0 border-border -mb-px'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
          >
            Config
          </button>
          <button
            type="button"
            onClick={() => setSubTab('history')}
            className={`px-4 py-2 rounded-t-md text-sm font-medium transition-colors ${subTab === 'history'
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
            <SiteConfigEditHistory section="public" onRestoreEntry={handleRestoreHistoryEntry} />
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
