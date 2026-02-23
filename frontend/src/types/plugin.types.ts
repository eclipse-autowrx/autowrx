// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import type { Model, Prototype } from './model.type'
import type { VehicleAPI, CVI, ExtendedApi, ExtendedApiCreate, ExtendedApiRet } from './api.type'
import type { List } from './common.type'

/**
 * Limited API callbacks provided to plugins for interacting with the host application
 *
 * Plugins can only:
 * 1. Update model/prototype data (typically via the 'extend' field)
 * 2. Read vehicle API information
 */
export interface PluginAPI {
  // ========================================
  // Model & Prototype Updates
  // ========================================

  /**
   * Update the current model's data
   * @param updates Partial model data to update
   * @returns Promise resolving to the updated model
   * @throws Error if model_id is not available or update fails
   *
   * @example
   * await api.updateModel({
   *   extend: { pluginData: { lastSaved: new Date() } }
   * })
   */
  updateModel?: (updates: Partial<Model>) => Promise<Model>

  /**
   * Update the current prototype's data
   * @param updates Partial prototype data to update
   * @returns Promise resolving to the updated prototype
   * @throws Error if prototype_id is not available or update fails
   *
   * @example
   * await api.updatePrototype({
   *   extend: { pluginSettings: { theme: 'dark' } }
   * })
   */
  updatePrototype?: (updates: Partial<Prototype>) => Promise<Prototype>

  // ========================================
  // Vehicle API Operations (Read & Write)
  // ========================================

  /**
   * Get computed vehicle APIs for a model
   * @param model_id The model ID (optional, defaults to current model)
   * @returns Promise resolving to the computed vehicle API tree
   *
   * @example
   * const apis = await api.getComputedAPIs()
   * console.log(apis['Vehicle.Speed'])
   */
  getComputedAPIs?: (model_id?: string) => Promise<CVI>

  /**
   * Get details for a specific vehicle API
   * @param api_name The API path (e.g., 'Vehicle.Speed')
   * @param model_id The model ID (optional, defaults to current model)
   * @returns Promise resolving to the API details
   *
   * @example
   * const speedApi = await api.getApiDetail('Vehicle.Speed')
   * console.log(speedApi.datatype, speedApi.description)
   */
  getApiDetail?: (api_name: string, model_id?: string) => Promise<VehicleAPI>

  /**
   * List available VSS (Vehicle Signal Specification) versions
   * @returns Promise resolving to array of VSS release versions
   *
   * @example
   * const versions = await api.listVSSVersions()
   * console.log(versions) // ['4.0', '3.1', ...]
   */
  listVSSVersions?: () => Promise<string[]>

  /**
   * Replace all vehicle APIs for a model with new API specification
   * @param api_data_url URL to the new API specification file
   * @param model_id The model ID (optional, defaults to current model)
   * @returns Promise resolving when APIs are replaced
   *
   * @example
   * await api.replaceAPIs('https://example.com/vss-4.0.json')
   */
  replaceAPIs?: (api_data_url: string, model_id?: string) => Promise<void>

  /**
   * Set runtime API values (for testing/simulation)
   * @param values Object mapping API paths to values
   *
   * @example
   * await api.setRuntimeApiValues({
   *   'Vehicle.Speed': 65.5,
   *   'Vehicle.CurrentLocation.Latitude': 37.7749
   * })
   */
  setRuntimeApiValues?: (values: Record<string, any>) => void

  /**
   * Get current runtime API values
   * @returns Current runtime API values
   *
   * @example
   * const values = api.getRuntimeApiValues()
   * console.log(values['Vehicle.Speed'])
   */
  getRuntimeApiValues?: () => Record<string, any>

  // ========================================
  // Navigation
  // ========================================

  /**
   * Navigate to a specific prototype tab
   * @param tab Built-in tab key ('view', 'journey', 'code', 'dashboard') or 'plug' for custom plugin tabs
   * @param pluginSlug Required when tab is 'plug' — the plugin slug to activate
   *
   * @example
   * // Navigate to the code tab
   * api.setActiveTab?.('code')
   *
   * // Navigate to a custom plugin tab
   * api.setActiveTab?.('plug', 'my-plugin-slug')
   *
   * // Navigate to dashboard
   * api.setActiveTab?.('dashboard')
   */
  setActiveTab?: (tab: string, pluginSlug?: string) => void

  // ========================================
  // Wishlist API Operations (Custom/Extended APIs)
  // ========================================

  /**
   * Create a new wishlist API (custom vehicle signal)
   * @param data Extended API creation data
   * @returns Promise resolving to the created API
   *
   * @example
   * await api.createWishlistApi({
   *   model: model_id,
   *   apiName: 'Vehicle.CustomSignal',
   *   description: 'My custom signal',
   *   type: 'sensor',
   *   datatype: 'float',
   *   skeleton: 'Vehicle.CustomSignal',
   *   isWishlist: true
   * })
   */
  createWishlistApi?: (data: ExtendedApiCreate) => Promise<ExtendedApiRet>

  /**
   * Update an existing wishlist API
   * @param id The wishlist API ID
   * @param data Partial data to update
   * @returns Promise resolving to the updated API
   *
   * @example
   * await api.updateWishlistApi('api-id-123', {
   *   description: 'Updated description',
   *   datatype: 'double'
   * })
   */
  updateWishlistApi?: (id: string, data: Partial<ExtendedApiCreate>) => Promise<Partial<ExtendedApiCreate>>

  /**
   * Delete a wishlist API
   * @param id The wishlist API ID
   * @returns Promise resolving when deleted
   *
   * @example
   * await api.deleteWishlistApi('api-id-123')
   */
  deleteWishlistApi?: (id: string) => Promise<void>

  /**
   * Get a specific wishlist API by name
   * @param name The API name (e.g., 'Vehicle.CustomSignal')
   * @param model_id The model ID (optional, defaults to current model)
   * @returns Promise resolving to the API details
   *
   * @example
   * const api = await api.getWishlistApi('Vehicle.CustomSignal')
   */
  getWishlistApi?: (name: string, model_id?: string) => Promise<ExtendedApi>

  /**
   * List all wishlist APIs for a model
   * @param model_id The model ID (optional, defaults to current model)
   * @returns Promise resolving to list of wishlist APIs
   *
   * @example
   * const wishlistApis = await api.listWishlistApis()
   */
  listWishlistApis?: (model_id?: string) => Promise<List<ExtendedApi>>
}

/**
 * Props passed to plugin Page components
 */
export interface PluginPageProps {
  /**
   * Dynamic data passed from the host application
   * Can contain model, prototype, or other contextual data
   */
  data?: any

  /**
   * Plugin configuration settings
   */
  config?: {
    plugin_id?: string
    [key: string]: any
  }

  /**
   * API callbacks for plugin-to-host communication
   */
  api?: PluginAPI
}

/**
 * Plugin registration object that must be exposed on window.DAPlugins[pluginName]
 */
export interface PluginRegistration {
  /**
   * React components exported by the plugin
   */
  components?: {
    Page?: React.ComponentType<PluginPageProps>
    [key: string]: React.ComponentType<any> | undefined
  }

  /**
   * Imperative mount function for non-React plugins
   */
  mount?: (element: HTMLElement, props?: PluginPageProps) => void

  /**
   * Cleanup function called when plugin is unmounted
   */
  unmount?: (element?: HTMLElement | null) => void
}
