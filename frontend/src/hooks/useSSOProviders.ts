// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useState, useEffect, useCallback } from 'react'
import { getPublicSSOProviders, SSOProvider } from '@/services/sso.service'

// Cache for SSO providers
let ssoProvidersCache: SSOProvider[] | null = null
let ssoCacheExpiry: number | null = null
const SSO_CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export const useSSOProviders = () => {
  const [providers, setProviders] = useState<SSOProvider[]>(
    ssoProvidersCache || [],
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProviders = useCallback(async () => {
    const now = Date.now()

    // Return cached data if still valid
    if (ssoProvidersCache && ssoCacheExpiry && now < ssoCacheExpiry) {
      setProviders(ssoProvidersCache)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const fetchedProviders = await getPublicSSOProviders()
      setProviders(fetchedProviders)

      // Update cache
      ssoProvidersCache = fetchedProviders
      ssoCacheExpiry = now + SSO_CACHE_DURATION
    } catch (err) {
      console.error('Failed to fetch SSO providers:', err)
      setError(
        err instanceof Error ? err.message : 'Failed to fetch SSO providers',
      )
      setProviders([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProviders()
  }, [fetchProviders])

  return { providers, loading, error, refetch: fetchProviders }
}

export default useSSOProviders
