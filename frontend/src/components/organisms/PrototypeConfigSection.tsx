// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

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
import type { SiteConfigHistorySection } from '@/components/molecules/ConfigList'
import SiteConfigEditHistory from '@/components/molecules/SiteConfigEditHistory'
import { PREDEFINED_SITE_CONFIGS } from '@/pages/SiteConfigManagement'
import { pushSiteConfigEdit } from '@/utils/siteConfigHistory'
import type { SiteConfigEditEntry } from '@/utils/siteConfigHistory'

import {
    deleteConfigsById,
    reloadSoon,
    upsertConfigFromHistory,
} from '@/utils/siteConfigAdmin'

type PrototypeSubTab = 'config' | 'history'
const PROTOTYPE_HISTORY_SECTION = 'prototype' as SiteConfigHistorySection

const PrototypeConfigSection: React.FC = () => {
    const { data: self, isLoading: selfLoading } = useSelfProfileQuery()
    const [configs, setConfigs] = useState<Config[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [subTab, setSubTab] = useState<PrototypeSubTab>('config')
    const { toast } = useToast()

    useEffect(() => {
        if (selfLoading || !self) return
        loadConfigs()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selfLoading, !!self])

    const loadConfigs = async () => {
        try {
            setIsLoading(true)

            const predefinedPrototypeConfigs = PREDEFINED_SITE_CONFIGS.filter(
                (config) => config.category === 'prototype',
            )

            // Get existing Prototype configs from DB
            const res = await configManagementService.getConfigs({
                secret: false,
                scope: 'site',
                category: 'prototype',
                limit: 100,
            })

            const existingConfigs = res.results || []
            const existingKeys = new Set(existingConfigs.map((config) => config.key))

            // Find missing predefined Prototype configs and create them
            const missingConfigs = predefinedPrototypeConfigs.filter(
                (config) => !existingKeys.has(config.key),
            )

            if (missingConfigs.length > 0) {
                await configManagementService.bulkUpsertConfigs({
                    configs: missingConfigs,
                })

                const updatedRes = await configManagementService.getConfigs({
                    secret: false,
                    scope: 'site',
                    category: 'prototype',
                    limit: 100,
                })

                setConfigs(updatedRes.results || [])
            } else {
                setConfigs(existingConfigs)
            }
        } catch (err) {
            toast({
                title: 'Load failed',
                description:
                    err instanceof Error ? err.message : 'Failed to load Prototype configs',
                variant: 'destructive',
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleFactoryReset = async () => {
        if (
            !window.confirm(
                'Restore all Prototype configs to default values? This will reset Prototype settings to their defaults.',
            )
        ) {
            return
        }

        try {
            setIsLoading(true)

            const predefinedPrototypeConfigs = PREDEFINED_SITE_CONFIGS.filter(
                (config) => config.category === 'prototype',
            )

            // Delete all Prototype configs
            const allConfigs = await configManagementService.getConfigs({
                secret: false,
                scope: 'site',
                category: 'prototype',
                limit: 100,
            })

            const { failed } = await deleteConfigsById(allConfigs.results || [])
            failed.forEach((f) =>
                console.warn('Failed to delete Prototype config', f.key, f.reason),
            )

            // Recreate defaults
            if (predefinedPrototypeConfigs.length > 0) {
                await configManagementService.bulkUpsertConfigs({
                    configs: predefinedPrototypeConfigs,
                })
            }

            toast({
                title: 'Restored',
                description:
                    'Prototype configs restored to default values. Reloading page...',
            })

            reloadSoon()
        } catch (err) {
            toast({
                title: 'Reset failed',
                description:
                    err instanceof Error
                        ? err.message
                        : 'Failed to reset Prototype configs',
                variant: 'destructive',
            })
            setIsLoading(false)
        }
    }

    const handleRestoreHistoryEntry = async (entry: SiteConfigEditEntry) => {
        try {
            setIsLoading(true)
            const { valueBefore, targetValue } = await upsertConfigFromHistory({
                entry,
                scope: 'site',
                category: 'prototype',
            })

            pushSiteConfigEdit({
                key: entry.key,
                valueBefore,
                valueAfter: targetValue,
                valueType: entry.valueType,
                section: 'prototype',
            })

            toast({
                title: 'Restored',
                description: `Configuration "${entry.key}" restored. Reloading page...`,
            })

            reloadSoon()
        } catch (err) {
            toast({
                title: 'Restore failed',
                description:
                    err instanceof Error
                        ? err.message
                        : 'Failed to restore Prototype configuration',
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
                        Prototype Configuration
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Configure Prototype-specific behavior and feature visibility
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
                        <SiteConfigEditHistory
                            section={PROTOTYPE_HISTORY_SECTION}
                            onRestoreEntry={handleRestoreHistoryEntry}
                        />
                    </div>
                ) : (
                    <ConfigList
                        configs={configs}
                        onEdit={() => { }}
                        onDelete={() => { }}
                        isLoading={isLoading}
                        onUpdated={loadConfigs}
                        historySection={PROTOTYPE_HISTORY_SECTION}
                    />
                )}
            </div>
        </>
    )
}

export default PrototypeConfigSection
