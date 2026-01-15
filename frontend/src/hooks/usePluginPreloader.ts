// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useEffect, useRef } from 'react'
import { getPluginBySlug, getPluginById, type Plugin } from '@/services/plugin.service'
import { TabConfig } from '@/components/organisms/CustomTabEditor'

interface PreloadOptions {
  prototypeTabs?: TabConfig[]
  stagingPlugins?: Plugin[]
  delay?: number // Delay before starting preload in ms (default: 2000ms)
  enabled?: boolean // Whether preloading is enabled (default: true)
}

/**
 * Hook to preload plugin JavaScript files in the background
 * Collects plugin identifiers from prototype tabs and staging plugins,
 * fetches their metadata, and preloads the JS files for faster tab switching
 */
const usePluginPreloader = ({
  prototypeTabs = [],
  stagingPlugins = [],
  delay = 2000,
  enabled = true,
}: PreloadOptions) => {
  const preloadedUrls = useRef<Set<string>>(new Set())
  const isPreloading = useRef(false)

  useEffect(() => {
    if (!enabled) return

    // Collect unique plugin identifiers
    const pluginIdentifiers = new Set<string>()

    // From prototype tabs: extract plugin slugs from custom tabs
    prototypeTabs.forEach((tab) => {
      if (tab.type === 'custom' && tab.plugin) {
        pluginIdentifiers.add(tab.plugin)
      }
    })

    // From staging plugins: extract plugin IDs or slugs
    stagingPlugins.forEach((plugin) => {
      if (plugin.slug) {
        pluginIdentifiers.add(plugin.slug)
      } else if (plugin.id) {
        pluginIdentifiers.add(plugin.id)
      }
      // If plugin already has URL, we can preload it directly
      if (plugin.url && !preloadedUrls.current.has(plugin.url)) {
        preloadScript(plugin.url)
        preloadedUrls.current.add(plugin.url)
      }
    })

    if (pluginIdentifiers.size === 0) return

    // Wait for idle before starting preload
    const startPreload = () => {
      if (isPreloading.current) return
      isPreloading.current = true

      // Fetch plugin metadata and preload scripts
      const preloadAll = async () => {
        const pluginIds = Array.from(pluginIdentifiers)
        
        // Batch fetch plugin metadata (with small delay between batches to avoid overwhelming server)
        for (let i = 0; i < pluginIds.length; i++) {
          const pluginId = pluginIds[i]
          
          try {
            // Try to get plugin by slug first, then by ID
            let pluginMeta: Plugin | null = null
            try {
              pluginMeta = await getPluginBySlug(pluginId)
            } catch (e) {
              try {
                pluginMeta = await getPluginById(pluginId)
              } catch (e2) {
                // Plugin not found, skip
                if (process.env.NODE_ENV === 'development') {
                  console.warn(`[usePluginPreloader] Plugin not found: ${pluginId}`)
                }
                continue
              }
            }

            if (pluginMeta?.url && !preloadedUrls.current.has(pluginMeta.url)) {
              preloadScript(pluginMeta.url)
              preloadedUrls.current.add(pluginMeta.url)
            }
          } catch (error) {
            // Silently handle errors - don't block preloading of other plugins
            if (process.env.NODE_ENV === 'development') {
              console.warn(`[usePluginPreloader] Failed to preload plugin ${pluginId}:`, error)
            }
          }

          // Small delay between requests to avoid overwhelming the server
          if (i < pluginIds.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 100))
          }
        }

        isPreloading.current = false
      }

      preloadAll()
    }

    // Use requestIdleCallback if available, otherwise use setTimeout
    if ('requestIdleCallback' in window) {
      const idleCallbackId = (window as any).requestIdleCallback(
        () => {
          setTimeout(startPreload, delay)
        },
        { timeout: delay + 1000 }
      )
      return () => {
        if (idleCallbackId) {
          (window as any).cancelIdleCallback(idleCallbackId)
        }
      }
    } else {
      // Fallback to setTimeout
      const timeoutId = setTimeout(startPreload, delay)
      return () => clearTimeout(timeoutId)
    }
  }, [prototypeTabs, stagingPlugins, delay, enabled])
}

/**
 * Preload a JavaScript file using both link prefetch and fetch
 * @param url - The URL of the JavaScript file to preload
 */
const preloadScript = (url: string) => {
  if (!url || typeof url !== 'string') return

  // Strategy 1: Use <link rel="prefetch"> for browser-native prefetching
  try {
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.as = 'script'
    link.href = url
    link.crossOrigin = 'anonymous'
    document.head.appendChild(link)
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[usePluginPreloader] Failed to create prefetch link for ${url}:`, error)
    }
  }

  // Strategy 2: Use fetch() with low priority to ensure caching
  // Note: fetch priority is not widely supported, but we use it for browsers that support it
  try {
    fetch(url, {
      method: 'GET',
      cache: 'default',
      // @ts-ignore - priority is not in all TypeScript definitions but is supported in some browsers
      priority: 'low',
      credentials: 'omit', // Don't send cookies for external scripts
    }).catch(() => {
      // Silently ignore fetch errors - prefetch is best-effort
    })
  } catch (error) {
    // Silently ignore errors
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[usePluginPreloader] Failed to fetch ${url}:`, error)
    }
  }
}

export default usePluginPreloader
