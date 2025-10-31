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

const PublicConfigSection: React.FC = () => {
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

      // First, get existing configs from DB
      const res = await configManagementService.getConfigs({
        secret: false,
        scope: 'site',
        limit: 100,
      })

      const existingConfigs = res.results || []
      const existingKeys = new Set(existingConfigs.map(config => config.key))

      // Find missing predefined configs and create them
      const missingConfigs = PREDEFINED_SITE_CONFIGS.filter(
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
          limit: 100,
        })

        // Filter to only show predefined configs
        const predefinedKeys = new Set(PREDEFINED_SITE_CONFIGS.map(c => c.key))
        const filteredConfigs = (updatedRes.results || []).filter(
          config => predefinedKeys.has(config.key)
        )

        setConfigs(filteredConfigs)
      } else {
        // Filter to only show predefined configs
        const predefinedKeys = new Set(PREDEFINED_SITE_CONFIGS.map(c => c.key))
        const filteredConfigs = existingConfigs.filter(
          config => predefinedKeys.has(config.key)
        )

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
        toast({ title: 'Deleted', description: `Config "${config.key}" deleted` })
        await loadConfigs()
      }
    } catch (err) {
      toast({
        title: 'Delete failed',
        description: err instanceof Error ? err.message : 'Failed to delete config',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveConfig = async (config: any) => {
    try {
      setIsLoading(true)
      if (editingConfig?.id) {
        await configManagementService.updateConfigById(editingConfig.id, config)
        toast({ title: 'Updated', description: `Config "${config.key}" updated` })
      } else {
        await configManagementService.createConfig({ ...config, secret: false })
        toast({ title: 'Created', description: `Config "${config.key}" created` })
      }
      setIsFormOpen(false)
      setEditingConfig(undefined)
      await loadConfigs()
    } catch (err) {
      toast({
        title: 'Save failed',
        description: err instanceof Error ? err.message : 'Failed to save config',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelForm = () => {
    setIsFormOpen(false)
    setEditingConfig(undefined)
  }

  const handleFactoryReset = async () => {
    if (!window.confirm('Reset all public configs to factory defaults? This will restore predefined configurations.')) return

    try {
      setIsLoading(true)
      // Delete all configs and reload - the predefined ones will be re-created on load
      const allConfigs = await configManagementService.getConfigs({
        secret: false,
        scope: 'site',
        limit: 100,
      })

      // Delete all existing configs
      for (const config of allConfigs.results || []) {
        try {
          if (config.id) {
            await configManagementService.deleteConfigById(config.id)
          }
        } catch (e) {
          console.warn('Failed to delete config', config.key, e)
        }
      }

      toast({ title: 'Reset', description: 'Public configs reset to factory defaults' })
      await loadConfigs() // This will re-create predefined configs
    } catch (err) {
      toast({
        title: 'Reset failed',
        description: err instanceof Error ? err.message : 'Failed to reset configs',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
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
            variant="destructive"
            size="sm"
            disabled={isLoading}
          >
            Factory Reset
          </Button>
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
            isLoading={isLoading}
          />
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
