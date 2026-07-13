// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { TabConfig } from '@/components/organisms/CustomTabEditor'

export type LegacyModelTab = {
  label: string
  plugin: string
}

export type ModelTabInput = TabConfig | LegacyModelTab

export const DEFAULT_MODEL_BUILTIN_TABS: TabConfig[] = [
  { type: 'builtin', key: 'overview', label: 'Overview' },
  { type: 'builtin', key: 'api', label: 'Vehicle API' },
  { type: 'builtin', key: 'library', label: 'Prototype Library' },
]

export interface ModelBuiltinTabRoute {
  path: string
  subs: string[]
  dataId: string
}

export const MODEL_BUILTIN_TAB_ROUTES: Record<string, ModelBuiltinTabRoute> = {
  overview: {
    path: 'overview',
    subs: ['/model/:model_id'],
    dataId: 'tab-model-overview',
  },
  api: {
    path: 'api',
    subs: [
      '/model/:model_id/api',
      '/model/:model_id/api/:api',
      '/model/:model_id/api/:source/:api',
    ],
    dataId: 'tab-model-api',
  },
  library: {
    path: 'library/list',
    subs: [
      '/model/:model_id/library',
      '/model/:model_id/library/:tab',
      '/model/:model_id/library/:tab/:prototype_id',
    ],
    dataId: 'tab-model-library',
  },
}

export const getModelTabConfig = (tabs?: ModelTabInput[]): TabConfig[] => {
  if (!tabs || tabs.length === 0) {
    return DEFAULT_MODEL_BUILTIN_TABS
  }

  if (tabs.every((t) => 'type' in t)) {
    const typedTabs = tabs as TabConfig[]
    const hasBuiltin = typedTabs.some((t) => t.type === 'builtin')
    if (!hasBuiltin) {
      const customTabs = typedTabs.filter(
        (t) => t.type === 'custom' && !!t.plugin,
      )
      return [...DEFAULT_MODEL_BUILTIN_TABS, ...customTabs]
    }
    return typedTabs
  }

  const customTabs: TabConfig[] = (tabs as LegacyModelTab[])
    .filter((tab) => !!tab.plugin)
    .map((tab) => ({
      type: 'custom' as const,
      label: tab.label,
      plugin: tab.plugin,
    }))

  return [...DEFAULT_MODEL_BUILTIN_TABS, ...customTabs]
}

export const sanitizeModelTabsForSave = (tabs: TabConfig[]): TabConfig[] =>
  tabs.filter(
    (tab) =>
      tab.type === 'builtin' ||
      (tab.type === 'custom' && !!tab.plugin?.trim() && !!tab.label?.trim()),
  )

export const hasIncompleteModelTabs = (tabs: TabConfig[]): boolean =>
  tabs.some(
    (tab) =>
      tab.type === 'custom' && (!tab.plugin?.trim() || !tab.label?.trim()),
  )

export const getModelBuiltinTabCount = (
  key: string,
  counts: { vehicleApiCount: number | null; numberOfPrototypes: number },
): number | null => {
  switch (key) {
    case 'overview':
      return null
    case 'api':
      return counts.vehicleApiCount
    case 'library':
      return counts.numberOfPrototypes
    default:
      return null
  }
}
