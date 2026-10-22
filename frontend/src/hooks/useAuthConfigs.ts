// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useState, useEffect } from 'react'
import { configManagementService } from '@/services/configManagement.service'

interface AuthConfigs {
  PUBLIC_VIEWING: boolean
  SELF_REGISTRATION: boolean
  SSO_AUTO_REGISTRATION: boolean
  PASSWORD_MANAGEMENT: boolean
}

// Cache for auth configs
let authConfigCache: AuthConfigs | null = null
let cacheExpiry: number | null = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Default values (all true = open mode, equivalent to STRICT_AUTH=false)
const DEFAULT_AUTH_CONFIGS: AuthConfigs = {
  PUBLIC_VIEWING: true,
  SELF_REGISTRATION: true,
  SSO_AUTO_REGISTRATION: true,
  PASSWORD_MANAGEMENT: true,
}

/**
 * Fetch auth configs from the backend
 */
const fetchAuthConfigs = async (): Promise<AuthConfigs> => {
  const now = Date.now()

  // Return cached data if still valid
  if (authConfigCache && cacheExpiry && now < cacheExpiry) {
    return authConfigCache
  }

  try {
    // Fetch all public configs with category='auth'
    const configs = await configManagementService.getPublicConfigs('site')

    // Extract auth configs
    const authConfigs: AuthConfigs = {
      PUBLIC_VIEWING:
        configs.PUBLIC_VIEWING ?? DEFAULT_AUTH_CONFIGS.PUBLIC_VIEWING,
      SELF_REGISTRATION:
        configs.SELF_REGISTRATION ?? DEFAULT_AUTH_CONFIGS.SELF_REGISTRATION,
      SSO_AUTO_REGISTRATION:
        configs.SSO_AUTO_REGISTRATION ??
        DEFAULT_AUTH_CONFIGS.SSO_AUTO_REGISTRATION,
      PASSWORD_MANAGEMENT:
        configs.PASSWORD_MANAGEMENT ?? DEFAULT_AUTH_CONFIGS.PASSWORD_MANAGEMENT,
    }

    // Update cache
    authConfigCache = authConfigs
    cacheExpiry = now + CACHE_DURATION

    return authConfigs
  } catch (error) {
    console.warn('Failed to fetch auth configs, using defaults:', error)
    // Return cached data if available, otherwise return defaults
    return authConfigCache || DEFAULT_AUTH_CONFIGS
  }
}

/**
 * React hook to get authentication configuration settings
 * @returns Object with auth configs, loading state, and refetch function
 */
export const useAuthConfigs = () => {
  const [configs, setConfigs] = useState<AuthConfigs>(
    authConfigCache || DEFAULT_AUTH_CONFIGS,
  )
  const [loading, setLoading] = useState(!authConfigCache)
  const [error, setError] = useState<string | null>(null)

  const loadConfigs = async () => {
    try {
      setLoading(true)
      setError(null)
      const fetchedConfigs = await fetchAuthConfigs()
      setConfigs(fetchedConfigs)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch auth configs',
      )
      setConfigs(DEFAULT_AUTH_CONFIGS)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConfigs()
  }, [])

  return {
    authConfigs: configs,
    loading,
    error,
    refetch: loadConfigs,
  }
}

/**
 * Get auth configs synchronously from cache (for non-React contexts)
 */
export const getAuthConfigsSync = (): AuthConfigs => {
  return authConfigCache || DEFAULT_AUTH_CONFIGS
}

/**
 * Clear auth config cache
 */
export const clearAuthConfigCache = (): void => {
  authConfigCache = null
  cacheExpiry = null
}

export default useAuthConfigs
