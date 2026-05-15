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
import { EXCLUDED_FROM_SITE_CONFIG_KEYS, PREDEFINED_SITE_CONFIGS } from '@/pages/SiteConfigManagement'
import { pushSiteConfigEdit } from '@/utils/siteConfigHistory'

const SecretConfigSection: React.FC = () => {
  const { data: self, isLoading: selfLoading } = useSelfProfileQuery()
  const [configs, setConfigs] = useState<Config[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<Config | undefined>()
  const { toast } = useToast()

  useEffect(() => {
    if (selfLoading || !self) return
    loadConfigs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selfLoading, !!self])

  const loadConfigs = async () => {
    try {
      setIsLoading(true)

      // Get existing secret configs from BE
      const res = await configManagementService.getConfigs({ secret: true })
      let allSecretConfigs = res.results || []
      const existingKeys = new Set(allSecretConfigs.map((c) => c.key))

      // Identify predefined secret configs
      const predefinedSecretConfigs = PREDEFINED_SITE_CONFIGS.filter(
        (c) => c.secret === true,
      )

      // Find and create missing predefined secret configs (self-healing)
      const missingConfigs = predefinedSecretConfigs.filter(
        (c) => !existingKeys.has(c.key),
      )

      if (missingConfigs.length > 0) {
        await configManagementService.bulkUpsertConfigs({
          configs: missingConfigs,
        })
        // Re-fetch after healing
        const updatedRes = await configManagementService.getConfigs({
          secret: true,
        })
        allSecretConfigs = updatedRes.results || []
      }

      // Filter out keys that should be excluded from site-config page
      const filteredConfigs = allSecretConfigs.filter(
        (config) => !EXCLUDED_FROM_SITE_CONFIG_KEYS.includes(config.key),
      )
      setConfigs(filteredConfigs)
    } catch (err) {
      toast({
        title: 'Load failed',
        description:
          err instanceof Error ? err.message : 'Failed to load secret configs',
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
    if (!window.confirm(`Delete secret config "${config.key}"?`)) return

    try {
      setIsLoading(true)
      if (config.id) {
        await configManagementService.deleteConfigById(config.id)
        toast({ title: 'Deleted', description: `Config "${config.key}" deleted. Reloading page...` })

        // Reload page to show changes immediately
        setTimeout(() => {
          window.location.href = window.location.href
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
          section: 'secrets',
        })
        toast({ title: 'Updated', description: `Config "${config.key}" updated. Reloading page...` })
      } else {
        await configManagementService.createConfig({ ...config, secret: true })
        toast({ title: 'Created', description: `Config "${config.key}" created. Reloading page...` })
      }

      // Reload page to show changes immediately
      setTimeout(() => {
        window.location.href = window.location.href
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

  const handleFactoryReset = async () => {
    if (!window.confirm('Restore all secret configs to default values? This will overwrite your current settings.')) return

    try {
      setIsLoading(true)
      
      const predefinedSecretConfigs = PREDEFINED_SITE_CONFIGS.filter(
        (c) => c.secret === true,
      )

      // Bulk upsert the defaults directly
      await configManagementService.bulkUpsertConfigs({
        configs: predefinedSecretConfigs,
      })

      toast({ title: 'Restored', description: 'Secret configs restored to default values. Reloading page...' })

      // Reload page to show changes immediately
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

  return (
    <>
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold text-foreground">
              Secret Configurations
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage sensitive configuration values (admin only)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={() => setIsFormOpen(true)} size="sm" disabled={isLoading}>
              + Add Secret
            </Button>
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
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Spinner />
          </div>
        ) : (
          <ConfigList
            configs={configs}
            onEdit={handleEditConfig}
            onDelete={handleDeleteConfig}
            showDelete
            isLoading={isLoading}
            historySection="secrets"
          />
        )}
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingConfig ? 'Edit Secret Configuration' : 'Create Secret Configuration'}
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

export default SecretConfigSection
