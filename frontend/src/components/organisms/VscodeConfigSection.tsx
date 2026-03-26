import React, { useEffect, useState } from 'react'
import {
  configManagementService,
  type Config,
} from '@/services/configManagement.service'
import { Button } from '@/components/atoms/button'
import { Spinner } from '@/components/atoms/spinner'
import { useToast } from '@/components/molecules/toaster/use-toast'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import ConfigList from '@/components/molecules/ConfigList'
import { PREDEFINED_SITE_CONFIGS } from '@/pages/SiteConfigManagement'
import { deleteConfigsById, reloadSoon } from '@/utils/siteConfigAdmin'

const VscodeConfigSection: React.FC = () => {
  const { data: self, isLoading: selfLoading } = useSelfProfileQuery()
  const [configs, setConfigs] = useState<Config[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (selfLoading || !self) return
    loadConfigs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selfLoading, !!self])

  const loadConfigs = async () => {
    try {
      setIsLoading(true)

      const predefinedVscodeConfigs = PREDEFINED_SITE_CONFIGS.filter(
        (config) => config.category === 'vscode',
      )

      // Load existing configs from DB (split by secret/public)
      const [publicRes, secretRes] = await Promise.all([
        configManagementService.getConfigs({
          secret: false,
          scope: 'site',
          category: 'vscode',
          limit: 100,
        }),
        configManagementService.getConfigs({
          secret: true,
          scope: 'site',
          category: 'vscode',
          limit: 100,
        }),
      ])

      const existingConfigs = [...(publicRes.results || []), ...(secretRes.results || [])]
      const existingKeys = new Set(existingConfigs.map((c) => c.key))

      // Create missing defaults (including secret ones)
      const missingConfigs = predefinedVscodeConfigs.filter((c) => !existingKeys.has(c.key))
      if (missingConfigs.length > 0) {
        await configManagementService.bulkUpsertConfigs({
          configs: missingConfigs,
        })
      }

      const [updatedPublicRes, updatedSecretRes] = await Promise.all([
        configManagementService.getConfigs({
          secret: false,
          scope: 'site',
          category: 'vscode',
          limit: 100,
        }),
        configManagementService.getConfigs({
          secret: true,
          scope: 'site',
          category: 'vscode',
          limit: 100,
        }),
      ])

      const updatedConfigs = [
        ...(updatedPublicRes.results || []),
        ...(updatedSecretRes.results || []),
      ]

      // Keep a stable order matching PREDEFINED_SITE_CONFIGS
      const order = new Map(
        predefinedVscodeConfigs.map((c, idx) => [c.key, idx]),
      )
      updatedConfigs.sort((a, b) => (order.get(a.key) ?? 999) - (order.get(b.key) ?? 999))

      setConfigs(updatedConfigs)
    } catch (err) {
      toast({
        title: 'Load failed',
        description: err instanceof Error ? err.message : 'Failed to load VSCode configs',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFactoryReset = async () => {
    if (
      !window.confirm(
        'Restore all VSCode / Coder configs to default values? This will overwrite your current settings.',
      )
    ) {
      return
    }

    try {
      setIsLoading(true)

      const predefinedVscodeConfigs = PREDEFINED_SITE_CONFIGS.filter(
        (config) => config.category === 'vscode',
      )

      const [publicRes, secretRes] = await Promise.all([
        configManagementService.getConfigs({
          secret: false,
          scope: 'site',
          category: 'vscode',
          limit: 100,
        }),
        configManagementService.getConfigs({
          secret: true,
          scope: 'site',
          category: 'vscode',
          limit: 100,
        }),
      ])

      const allConfigs = [...(publicRes.results || []), ...(secretRes.results || [])]
      const { failed } = await deleteConfigsById(
        allConfigs.map((c) => ({ id: c.id!, key: c.key })),
      )
      failed.forEach((f) => console.warn('Failed to delete VSCode config', f.key, f.reason))

      await configManagementService.bulkUpsertConfigs({
        configs: predefinedVscodeConfigs,
      })

      toast({
        title: 'Restored',
        description: 'VSCode configs restored to default values. Reloading page...',
      })
      reloadSoon()
    } catch (err) {
      toast({
        title: 'Reset failed',
        description: err instanceof Error ? err.message : 'Failed to reset VSCode configs',
        variant: 'destructive',
      })
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className="text-lg font-semibold text-foreground">VSCode / Coder Configuration</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure Coder workspace integration and the prototypes folder mapping
          </p>
        </div>

        <Button onClick={handleFactoryReset} variant="outline" size="sm" disabled={isLoading}>
          Restore default
        </Button>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Spinner />
          </div>
        ) : (
          <ConfigList
            configs={configs}
            onEdit={() => {}}
            onDelete={() => {}}
            isLoading={isLoading}
            onUpdated={loadConfigs}
          />
        )}
      </div>
    </>
  )
}

export default VscodeConfigSection

