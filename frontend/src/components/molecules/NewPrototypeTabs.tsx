// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC } from 'react'
import { cn } from '@/lib/utils'
import { TbCode, TbGauge, TbMapPin, TbRoute } from 'react-icons/tb'
import { TabConfig } from '@/components/organisms/CustomTabEditor'
import { getTabConfig } from '@/components/molecules/PrototypeTabs'

interface NewPrototypeTabsProps {
    /** Raw tabs array from model.custom_template.prototype_tabs */
    tabs?: any[]
    /** Currently active plugin slug (custom tab) */
    activePluginId: string | null
    /** Currently active builtin tab key ('overview' | 'code' | 'dashboard' | 'journey' | ...) */
    activeBuiltinKey: string | null
    /** Whether a prototype has been created; builtin tabs are disabled when false */
    hasPrototype: boolean
    /** Called when user clicks a tab */
    onTabChange: (targetTab: string, targetPluginSlug?: string) => void
    /** Global visual style for all tab buttons. Defaults to 'tab' (bottom-border style). */
    tabsVariant?: string
}

/** Render a tab icon: use custom SVG if present, otherwise fall back to the default icon node. */
const renderTabIcon = (tabConfig: TabConfig, defaultIcon: React.ReactNode) => {
    if (tabConfig.iconSvg) {
        return (
            <span
                className="w-5 h-5 mr-2 shrink-0 [&>svg]:w-full [&>svg]:h-full [&>svg]:fill-current"
                dangerouslySetInnerHTML={{ __html: tabConfig.iconSvg }}
            />
        )
    }
    return defaultIcon
}

/** Compute class names for an active/inactive button tab based on the global tabsVariant. */
const tabItemClasses = (variant: string | undefined, isActive: boolean, disabled?: boolean) => {
    switch (variant) {
        case 'primary':
            return cn(
                'flex items-center self-center px-3 py-1.5 rounded-md text-sm font-semibold mx-1 cursor-pointer transition-colors',
                isActive
                    ? 'bg-primary text-primary-foreground'
                    : disabled
                        ? 'text-muted-foreground/30 cursor-default pointer-events-none'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )
        case 'outline':
            return cn(
                'flex items-center self-center px-3 py-1.5 rounded-md text-sm font-semibold mx-1 cursor-pointer border transition-colors',
                isActive
                    ? 'border-primary text-primary'
                    : disabled
                        ? 'border-transparent text-muted-foreground/30 cursor-default pointer-events-none'
                        : 'border-transparent text-muted-foreground hover:bg-accent hover:text-foreground',
            )
        case 'ghost':
            return cn(
                'flex items-center self-center px-3 py-1.5 rounded-md text-sm font-semibold mx-1 cursor-pointer transition-colors',
                isActive
                    ? 'bg-accent text-foreground'
                    : disabled
                        ? 'text-muted-foreground/30 cursor-default pointer-events-none'
                        : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
            )
        default: // 'tab'
            return cn(
                'flex h-full text-sm font-semibold items-center justify-center min-w-20 border-b-2 px-4 py-1 transition-colors',
                isActive
                    ? 'text-primary border-primary'
                    : disabled
                        ? 'text-muted-foreground/30 border-transparent cursor-default'
                        : 'text-muted-foreground border-transparent hover:opacity-80',
            )
    }
}

const NewPrototypeTabs: FC<NewPrototypeTabsProps> = ({
    tabs,
    activePluginId,
    activeBuiltinKey,
    hasPrototype,
    onTabChange,
    tabsVariant,
}) => {
    const variant = tabsVariant || 'tab'
    const tabConfigs = getTabConfig(tabs)
    const visibleTabs = tabConfigs.filter((t) => !t.hidden)

    return (
        <>
            {visibleTabs.map((tabConfig, index) => {
                if (tabConfig.type === 'builtin') {
                    const { key, label } = tabConfig
                    let defaultIcon: React.ReactNode = null

                    switch (key) {
                        case 'overview':
                            defaultIcon = <TbRoute className="w-5 h-5 mr-2" />
                            break
                        case 'journey':
                            defaultIcon = <TbMapPin className="w-5 h-5 mr-2" />
                            break
                        case 'code':
                            defaultIcon = <TbCode className="w-5 h-5 mr-2" />
                            break
                        case 'dashboard':
                            defaultIcon = <TbGauge className="w-5 h-5 mr-2" />
                            break
                        default:
                            return null
                    }

                    const isActive = !activePluginId && activeBuiltinKey === key
                    const icon = renderTabIcon(tabConfig, defaultIcon)

                    return (
                        <button
                            key={`nf-builtin-${key}-${index}`}
                            disabled={!hasPrototype}
                            onClick={() => hasPrototype && onTabChange(key)}
                            className={tabItemClasses(variant, isActive, !hasPrototype)}
                        >
                            {icon}
                            {label}
                        </button>
                    )
                } else {
                    const { label, plugin } = tabConfig
                    const isActive = activePluginId === plugin
                    const icon = renderTabIcon(tabConfig, null)

                    return (
                        <button
                            key={`nf-custom-${plugin}-${index}`}
                            onClick={() => plugin && onTabChange('plug', plugin)}
                            className={tabItemClasses(variant, isActive)}
                        >
                            {icon}
                            {label}
                        </button>
                    )
                }
            })}
        </>
    )
}

export default NewPrototypeTabs
