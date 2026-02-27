// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC } from 'react'
import DaTabItem from '@/components/atoms/DaTabItem'
import { Link, useParams } from 'react-router-dom'
import {
  TbCode,
  TbGauge,
  TbMapPin,
  TbRoute,
} from 'react-icons/tb'
import { TabConfig } from '@/components/organisms/CustomTabEditor'
import { cn } from '@/lib/utils'

interface PrototypeTabsProps {
  tabs?: TabConfig[]
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

/** Compute class names for a tab item based on the global tabsVariant. */
const tabItemClasses = (variant: string | undefined, isActive: boolean) => {
  switch (variant) {
    case 'primary':
      return cn(
        'flex items-center self-center px-3 py-1.5 rounded-md text-sm font-semibold mx-1 cursor-pointer transition-colors',
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground',
      )
    case 'outline':
      return cn(
        'flex items-center self-center px-3 py-1.5 rounded-md text-sm font-semibold mx-1 cursor-pointer border transition-colors',
        isActive
          ? 'border-primary text-primary'
          : 'border-transparent text-muted-foreground hover:bg-accent hover:text-foreground',
      )
    case 'ghost':
      return cn(
        'flex items-center self-center px-3 py-1.5 rounded-md text-sm font-semibold mx-1 cursor-pointer transition-colors',
        isActive
          ? 'bg-accent text-foreground'
          : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
      )
    default: // 'tab'
      return cn(
        'flex h-full text-sm font-semibold items-center justify-center min-w-20 cursor-pointer hover:opacity-80 border-b-2 py-1 px-4',
        isActive
          ? 'text-primary border-primary'
          : 'text-muted-foreground border-transparent',
      )
  }
}

// Default builtin tabs
const DEFAULT_BUILTIN_TABS: TabConfig[] = [
  { type: 'builtin', key: 'overview', label: 'Overview' },
  { type: 'builtin', key: 'journey', label: 'Customer Journey' },
  { type: 'builtin', key: 'code', label: 'SDV Code' },
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
    return oldTabs as TabConfig[]
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

const PrototypeTabs: FC<PrototypeTabsProps> = ({ tabs, tabsVariant }) => {
  const { model_id, prototype_id, tab } = useParams()
  const variant = tabsVariant || 'tab'

  // Get tabs with migration
  const tabConfigs = getTabConfig(tabs)

  // Filter out hidden tabs
  const visibleTabs = tabConfigs.filter(t => !t.hidden)

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
            case 'code':
              route = `/model/${model_id}/library/prototype/${prototype_id}/code`
              defaultIcon = <TbCode className="w-5 h-5 mr-2" />
              dataId = 'tab-code'
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
                className={tabItemClasses(variant, isActive)}
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
          const isActive = tab === 'plug' && window.location.search.includes(`plugid=${plugin}`)
          const icon = renderTabIcon(tabConfig, null)
          const to = `/model/${model_id}/library/prototype/${prototype_id}/plug?plugid=${plugin}`

          if (variant !== 'tab') {
            return (
              <Link
                key={`custom-${plugin}-${index}`}
                to={to}
                className={tabItemClasses(variant, isActive)}
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
