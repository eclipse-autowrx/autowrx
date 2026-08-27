// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useEffect, useState } from 'react'
import { useSiteConfig } from '@/utils/siteConfig'
import { getPluginBySlug } from '@/services/plugin.service'

export interface ConfiguredPlugin {
  label: string
  plugin: string
}

// Reads a site config array of { label, plugin } entries and resolves it to
// only the plugins that are actually installed.
export function useConfiguredPlugins(configKey: string): ConfiguredPlugin[] {
  const pluginsConfig = useSiteConfig(configKey)
  const [availablePlugins, setAvailablePlugins] = useState<ConfiguredPlugin[]>(
    [],
  )

  useEffect(() => {
    let cancelled = false
    const configs: ConfiguredPlugin[] = Array.isArray(pluginsConfig)
      ? pluginsConfig
      : []

    const valid = configs.filter(
      (entry) =>
        entry &&
        typeof entry.label === 'string' &&
        typeof entry.plugin === 'string' &&
        entry.label.trim() &&
        entry.plugin.trim(),
    )

    if (valid.length === 0) {
      setAvailablePlugins([])
      return
    }

    const uniqueSlugs = [...new Set(valid.map((p) => p.plugin))]
    Promise.allSettled(
      uniqueSlugs.map((slug) => getPluginBySlug(slug).then(() => slug)),
    ).then((results) => {
      if (cancelled) return
      const installedSlugs = new Set(
        results
          .filter(
            (r): r is PromiseFulfilledResult<string> =>
              r.status === 'fulfilled',
          )
          .map((r) => r.value),
      )
      setAvailablePlugins(valid.filter((p) => installedSlugs.has(p.plugin)))
    })

    return () => {
      cancelled = true
    }
  }, [JSON.stringify(pluginsConfig)])

  return availablePlugins
}
