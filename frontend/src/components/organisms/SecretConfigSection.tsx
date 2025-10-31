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
      const res = await configManagementService.getConfigs({ secret: true })
      setConfigs(res.results || [])
    } catch (err) {
      toast({
        title: 'Load failed',
        description: err instanceof Error ? err.message : 'Failed to load secret configs',
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
        await configManagementService.createConfig({ ...config, secret: true })
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
    if (!window.confirm('Reset all secret configs to factory defaults? This cannot be undone.')) return

    try {
      setIsLoading(true)
      // Delete all secret configs
      const allConfigs = await configManagementService.getConfigs({
        secret: true,
        scope: 'site',
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

      toast({ title: 'Reset', description: 'Secret configs reset to factory defaults' })
      await loadConfigs()
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
              Secret Configurations
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage sensitive configuration values (admin only)
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
