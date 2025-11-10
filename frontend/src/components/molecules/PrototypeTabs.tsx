// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC } from 'react'
import DaTabItem from '@/components/atoms/DaTabItem'
import { useParams } from 'react-router-dom'
import {
  TbCode,
  TbGauge,
  TbMapPin,
  TbRoute,
} from 'react-icons/tb'
import { TabConfig } from '@/components/organisms/CustomTabEditor'

interface PrototypeTabsProps {
  tabs?: TabConfig[]
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

  // Old format: prepend default builtin tabs
  const customTabs: TabConfig[] = oldTabs.map(tab => ({
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

const PrototypeTabs: FC<PrototypeTabsProps> = ({ tabs }) => {
  const { model_id, prototype_id, tab } = useParams()

  // Get tabs with migration
  const tabConfigs = getTabConfig(tabs)

  // Filter out hidden tabs
  const visibleTabs = tabConfigs.filter(t => !t.hidden)

  return (
    <>
      {visibleTabs.map((tabConfig, index) => {
        if (tabConfig.type === 'builtin') {
          // Render builtin tabs
          const { key, label } = tabConfig
          let route = ''
          let icon = null
          let dataId = ''

          switch (key) {
            case 'overview':
              route = `/model/${model_id}/library/prototype/${prototype_id}/view`
              icon = <TbRoute className="w-5 h-5 mr-2" />
              break
            case 'journey':
              route = `/model/${model_id}/library/prototype/${prototype_id}/journey`
              icon = <TbMapPin className="w-5 h-5 mr-2" />
              dataId = 'tab-journey'
              break
            case 'code':
              route = `/model/${model_id}/library/prototype/${prototype_id}/code`
              icon = <TbCode className="w-5 h-5 mr-2" />
              dataId = 'tab-code'
              break
            case 'dashboard':
              route = `/model/${model_id}/library/prototype/${prototype_id}/dashboard`
              icon = <TbGauge className="w-5 h-5 mr-2" />
              dataId = 'tab-dashboard'
              break
            default:
              return null
          }

          // Determine if tab is active
          const isActive =
            (key === 'overview' && (!tab || tab === 'view')) ||
            (tab === key)

          return (
            <DaTabItem
              key={`builtin-${key}`}
              active={isActive}
              to={route}
              dataId={dataId}
            >
              {icon}
              {label}
            </DaTabItem>
          )
        } else {
          // Render custom tabs
          const { label, plugin } = tabConfig
          const isActive = tab === 'plug' && window.location.search.includes(`plugid=${plugin}`)

          return (
            <DaTabItem
              key={`custom-${plugin}-${index}`}
              active={isActive}
              to={`/model/${model_id}/library/prototype/${prototype_id}/plug?plugid=${plugin}`}
            >
              {label}
            </DaTabItem>
          )
        }
      })}
    </>
  )
}

export default PrototypeTabs

