// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC } from 'react'
import DaTabItem from '@/components/atoms/DaTabItem'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  TbCode,
  TbGauge,
  TbMapPin,
  TbMessagePlus,
  TbRoute,
  TbBrandVscode,
} from 'react-icons/tb'
import { TabConfig, TabsBorderRadius } from '@/components/organisms/CustomTabEditor'
import { renderTabIcon, tabItemClasses } from '@/lib/tabUtils'
import { useSiteConfig } from '@/utils/siteConfig'

interface PrototypeTabsProps {
  tabs?: TabConfig[]
  /** Global visual style for all tab buttons. Defaults to 'tab' (bottom-border style). */
  tabsVariant?: string
  /** Border radius for tab buttons. Defaults to 'medium'. */
  tabsBorderRadius?: TabsBorderRadius
}


// Default builtin tabs
const DEFAULT_BUILTIN_TABS: TabConfig[] = [
  { type: 'builtin', key: 'overview', label: 'Overview' },
  { type: 'builtin', key: 'journey', label: 'Customer Journey' },
  { type: 'builtin', key: 'feedback', label: 'Feedback' },
  { type: 'builtin', key: 'code', label: 'SDV Code' },
  { type: 'builtin', key: 'vscode', label: 'VS Code' },
  { type: 'builtin', key: 'dashboard', label: 'Dashboard' },
]

// Migration helper: convert old format to new format
export const migrateTabConfig = (oldTabs?: Array<{ label: string; plugin: string }>): TabConfig[] => {
  if (!oldTabs || oldTabs.length === 0) {
    return DEFAULT_BUILTIN_TABS
  }

  // Check if it's already in new format (has 'type' property)
  const firstTab = oldTabs[0] as any
  if (firstTab && 'type' in firstTab) {
    // Already in new format - merge with default built-in tabs to ensure all built-ins are present
    const existingTabs = oldTabs as TabConfig[]
    const existingBuiltinKeys = new Set(
      existingTabs.filter(t => t.type === 'builtin' && t.key).map(t => t.key!)
    )
    
    // Add any missing built-in tabs from DEFAULT_BUILTIN_TABS
    const missingBuiltinTabs = DEFAULT_BUILTIN_TABS.filter(
      defaultTab => !existingBuiltinKeys.has(defaultTab.key!)
    )
    
    // Merge: existing built-ins (preserve their order/hidden state) + missing built-ins + custom tabs
    const existingBuiltinTabs = existingTabs.filter(t => t.type === 'builtin')
    const customTabs = existingTabs.filter(t => t.type === 'custom')
    
    // Reorder built-ins to match DEFAULT_BUILTIN_TABS order, then add missing ones
    const orderedBuiltinTabs: TabConfig[] = []
    for (const defaultTab of DEFAULT_BUILTIN_TABS) {
      const existing = existingBuiltinTabs.find(t => t.key === defaultTab.key)
      if (existing) {
        orderedBuiltinTabs.push(existing)
      } else {
        orderedBuiltinTabs.push(defaultTab)
      }
    }
    
    return [...orderedBuiltinTabs, ...customTabs]
  }

  // Old format: prepend default builtin tabs.
  // Entries with an empty plugin string were originally builtin tabs whose type/key metadata
  // was lost during serialization (e.g. saved by an older version of TemplateForm that stripped
  // TabConfig fields). They carry no actionable info, so we skip them to avoid ghost custom tabs.
  const customTabs: TabConfig[] = oldTabs
    .filter(tab => !!tab.plugin)
    .map(tab => ({
      type: 'custom',
      label: tab.label,
      plugin: tab.plugin,
    }))

  return [...DEFAULT_BUILTIN_TABS, ...customTabs]
}

// Get tab configuration, applying migration if needed
export const getTabConfig = (tabs?: any[]): TabConfig[] => {
  return migrateTabConfig(tabs)
}

const PrototypeTabs: FC<PrototypeTabsProps> = ({ tabs, tabsVariant, tabsBorderRadius }) => {
  const { model_id, prototype_id, tab } = useParams()
  const [searchParams] = useSearchParams()
  const variant = tabsVariant || 'tab'
  // Use null sentinel while config is loading so we don't hide/redirect too early.
  const vscodeEnabled = useSiteConfig('VSCODE_ENABLE', null as any)
  const borderRadius = tabsBorderRadius || 'round'

  // Get tabs with migration
  const tabConfigs = getTabConfig(tabs)

  // Filter out hidden tabs
  const visibleTabs = tabConfigs
    .filter((t) => !t.hidden)
    .filter((t) => !(t.type === 'builtin' && t.key === 'vscode' && vscodeEnabled === false))

  // The first visible tab is the default when no tab is in the URL
  const firstVisibleTab = visibleTabs[0]

  return (
    <>
      {visibleTabs.map((tabConfig, index) => {
        if (tabConfig.type === 'builtin') {
          const { key, label } = tabConfig
          let route = ''
          let defaultIcon: React.ReactNode = null
          let dataId = ''

          switch (key) {
            case 'overview':
              route = `/model/${model_id}/library/prototype/${prototype_id}/view`
              defaultIcon = <TbRoute className="w-5 h-5 mr-2" />
              break
            case 'journey':
              route = `/model/${model_id}/library/prototype/${prototype_id}/journey`
              defaultIcon = <TbMapPin className="w-5 h-5 mr-2" />
              dataId = 'tab-journey'
              break
            case 'feedback':
              route = `/model/${model_id}/library/prototype/${prototype_id}/feedback`
              defaultIcon = <TbMessagePlus className="w-5 h-5 mr-2" />
              dataId = 'tab-feedback'
              break
            case 'code':
              route = `/model/${model_id}/library/prototype/${prototype_id}/code`
              defaultIcon = <TbCode className="w-5 h-5 mr-2" />
              dataId = 'tab-code'
              break
            case 'vscode':
              route = `/model/${model_id}/library/prototype/${prototype_id}/vscode`
              defaultIcon = <TbBrandVscode className="w-5 h-5 mr-2" />
              dataId = 'tab-vscode'
              break
            case 'dashboard':
              route = `/model/${model_id}/library/prototype/${prototype_id}/dashboard`
              defaultIcon = <TbGauge className="w-5 h-5 mr-2" />
              dataId = 'tab-dashboard'
              break
            default:
              return null
          }

          const isActive =
            ((!tab || tab === 'view') && firstVisibleTab?.type === 'builtin' && firstVisibleTab?.key === key) ||
            (tab === key)

          const icon = renderTabIcon(tabConfig, defaultIcon)

          if (variant !== 'tab') {
            return (
              <Link
                key={`builtin-${key}`}
                to={route}
                data-id={dataId}
                className={tabItemClasses(variant, isActive, false, borderRadius)}
              >
                {icon}{label}
              </Link>
            )
          }

          return (
            <DaTabItem key={`builtin-${key}`} active={isActive} to={route} dataId={dataId}>
              {icon}{label}
            </DaTabItem>
          )
        } else {
          const { label, plugin } = tabConfig
          const isActive = tab === 'plug' && searchParams.get('plugid') === plugin
          const icon = renderTabIcon(tabConfig, null)
          const to = `/model/${model_id}/library/prototype/${prototype_id}/plug?plugid=${plugin}`

          if (variant !== 'tab') {
            return (
              <Link
                key={`custom-${plugin}-${index}`}
                to={to}
                className={tabItemClasses(variant, isActive, false, borderRadius)}
              >
                {icon}{label}
              </Link>
            )
          }

          return (
            <DaTabItem key={`custom-${plugin}-${index}`} active={isActive} to={to}>
              {icon}{label}
            </DaTabItem>
          )
        }
      })}
    </>
  )
}

export default PrototypeTabs
