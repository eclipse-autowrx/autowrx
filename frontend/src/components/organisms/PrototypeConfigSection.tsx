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
import { PREDEFINED_PROTOTYPE_CONFIGS } from '@/pages/SiteConfigManagement'
import { pushSiteConfigEdit } from '@/utils/siteConfigHistory'

const PrototypeConfigSection: React.FC = () => {
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

            const res = await configManagementService.getConfigs({
                secret: false,
                scope: 'site',
                category: 'prototype',
                limit: 100,
            })

            const existingConfigs = res.results || []
            const existingKeys = new Set(existingConfigs.map((c) => c.key))

            const missingConfigs = PREDEFINED_PROTOTYPE_CONFIGS.filter(
                (c) => !existingKeys.has(c.key)
            )

            if (missingConfigs.length > 0) {
                await configManagementService.bulkUpsertConfigs({ configs: missingConfigs })

                const updatedRes = await configManagementService.getConfigs({
                    secret: false,
                    scope: 'site',
                    category: 'prototype',
                    limit: 100,
                })
                setConfigs(sortByPredefined(updatedRes.results || []))
            } else {
                setConfigs(sortByPredefined(existingConfigs))
            }
        } catch (err) {
            toast({
                title: 'Load failed',
                description: err instanceof Error ? err.message : 'Failed to load prototype configs',
                variant: 'destructive',
            })
        } finally {
            setIsLoading(false)
        }
    }

    const sortByPredefined = (list: Config[]) => {
        const order = new Map(PREDEFINED_PROTOTYPE_CONFIGS.map((c, i) => [c.key, i]))
        return [...list].sort((a, b) => (order.get(a.key) ?? 999) - (order.get(b.key) ?? 999))
    }

    const handleEditConfig = (config: Config) => {
        setEditingConfig(config)
        setIsFormOpen(true)
    }

    const handleDeleteConfig = async (config: Config) => {
        const isPredefined = PREDEFINED_PROTOTYPE_CONFIGS.some((c) => c.key === config.key)
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
                setTimeout(() => window.location.reload(), 800)
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
                    section: 'prototype',
                })
                toast({ title: 'Updated', description: `Config "${config.key}" updated. Reloading page...` })
            } else {
                await configManagementService.createConfig({ ...config, secret: false })
                toast({ title: 'Created', description: `Config "${config.key}" created. Reloading page...` })
            }
            setTimeout(() => window.location.reload(), 800)
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
        if (!window.confirm('Restore all prototype configs to default values? This will reset prototype editor settings.')) return

        try {
            setIsLoading(true)
            const allConfigs = await configManagementService.getConfigs({
                secret: false,
                scope: 'site',
                category: 'prototype',
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

            toast({ title: 'Restored', description: 'Prototype configs restored to default values. Reloading page...' })
            setTimeout(() => window.location.reload(), 800)
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
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <div className="flex flex-col">
                    <h2 className="text-lg font-semibold text-foreground">
                        Prototype Editor Configuration
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Control features and behaviour of the prototype code editor
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
                        onUpdated={loadConfigs}
                        historySection="prototype"
                    />
                )}
            </div>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-w-150">
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

export default PrototypeConfigSection
