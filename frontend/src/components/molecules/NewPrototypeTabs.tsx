// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC } from 'react'
import { TbCode, TbGauge, TbMapPin, TbMessagePlus, TbRoute } from 'react-icons/tb'
import { TabConfig, TabsBorderRadius } from '@/components/organisms/CustomTabEditor'
import { getTabConfig } from '@/components/molecules/PrototypeTabs'
import { renderTabIcon, tabItemClasses } from '@/lib/tabUtils'

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
    /** Border radius for tab buttons. Defaults to 'medium'. */
    tabsBorderRadius?: TabsBorderRadius
}


const NewPrototypeTabs: FC<NewPrototypeTabsProps> = ({
    tabs,
    activePluginId,
    activeBuiltinKey,
    hasPrototype,
    onTabChange,
    tabsVariant,
    tabsBorderRadius,
}) => {
    const variant = tabsVariant || 'tab'
    const borderRadius = tabsBorderRadius || 'round'
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
                        case 'feedback':
                            defaultIcon = <TbMessagePlus className="w-5 h-5 mr-2" />
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
                            className={tabItemClasses(variant, isActive, !hasPrototype, borderRadius)}
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
                            className={tabItemClasses(variant, isActive, false, borderRadius)}
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
