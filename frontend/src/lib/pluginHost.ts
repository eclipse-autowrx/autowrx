// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

/**
 * Host-side plumbing for loading page plugins, shared by the trusted in-page
 * loader (PluginPageRender) and the sandboxed plugin page (sandbox-plugin.html):
 * - global shims (React, ReactDOM, require, webpack-style registry, DAPlugins)
 * - script injection + wait for registration under window.DAPlugins['page-plugin']
 */

const log = (..._args: any[]) => {}

export const GLOBAL_KEY = 'page-plugin'
export const REGISTER_TIMEOUT_MS = 15000
export const POLL_INTERVAL_MS = 100
export const YIELD_AFTER_LOAD_MS = 200

/** Store plugin registrations per plugin_id since all plugins register under the same 'page-plugin' key */
const pluginRegistrations = new Map<string, any>()
/** Map plugin URLs to plugin_ids so we can match registrations even when multiple plugins load simultaneously */
const urlToPluginId = new Map<string, string>()

export interface LoadPluginRegistrationOptions {
  pluginId: string
  pluginUrl: string
  /**
   * Plugin script text already fetched by the caller. When set it is executed as
   * an inline <script> (no network request, no blob: URL, so it works under CSPs
   * that forbid blob: scripts); pluginUrl then only identifies the plugin.
   */
  pluginSource?: string
  /** Called whenever a script element is injected (or cleared); caller owns removing it on unmount. */
  onScriptInjected?: (script: HTMLScriptElement | null) => void
  isCancelled?: () => boolean
}

export interface LoadedPluginRegistration {
  registration: any
  /** Last script element injected for this load (null if none is attached). */
  script: HTMLScriptElement | null
}

/** Return the cached registration for a plugin_id, if the plugin already registered earlier. */
export function getCachedPluginRegistration(pluginId: string): any | null {
  return pluginRegistrations.get(pluginId) ?? null
}

/**
 * Install the global dependencies plugins expect BEFORE their script executes:
 * window.React / window.ReactDOM(+Client), a synchronous module registry,
 * a require() shim and a webpack-style __webpack_require__.
 */
export async function ensurePluginShims(): Promise<void> {
  // Always ensure React is available (plugins might check for it)
  const ReactMod = await import('react')
  ;(window as any).React = (ReactMod as any).default || ReactMod
  log('React attached to window')

  // Always ensure ReactDOM is available (plugins need this)
  const ReactDOMClient = await import('react-dom/client')
  ;(window as any).ReactDOM = ReactDOMClient
  ;(window as any).ReactDOMClient = ReactDOMClient // Some plugins might look for this
  log('ReactDOM attached to window')

  // Ensure require shim is available and handles all React-related modules
  const ReactDOMMod = await import('react-dom/client')
  const JSXRuntime = await import('react/jsx-runtime')

  // Create a synchronous module registry that loaders can query
  // Some module loaders (like webpack) check module availability synchronously
  const moduleRegistry: Record<string, any> = {
    react: ReactMod,
    'react-dom': ReactDOMMod,
    'react-dom/client': ReactDOMMod,
    'react/jsx-runtime': JSXRuntime,
    'react/jsx-dev-runtime': JSXRuntime,
  }

  // Make module registry available synchronously
  ;(window as any).__PLUGIN_MODULES__ = moduleRegistry

  const requireShim = function (id: string) {
    if (moduleRegistry[id]) {
      return moduleRegistry[id]
    }
    throw new Error(`Module ${id} not found`)
  }

  ;(window as any).require = requireShim
  ;(globalThis as any).require = requireShim

  // Some loaders might check for webpack-style module cache
  if (!(window as any).__webpack_require__) {
    ;(window as any).__webpack_require__ = {
      cache: moduleRegistry,
      resolve: (id: string) => {
        if (moduleRegistry[id]) return id
        throw new Error(`Cannot resolve module: ${id}`)
      },
    }
  } else {
    // Merge with existing webpack cache if it exists
    Object.assign(
      (window as any).__webpack_require__.cache || {},
      moduleRegistry,
    )
  }

  log('require() shim added with react-dom/client support and module registry')

  // Small delay to ensure module registry is fully set up before script executes
  // Some loaders check module availability synchronously during script evaluation
  await new Promise((r) => setTimeout(r, 50))
}

/**
 * Inject the plugin script (module first, classic fallback) and wait until it
 * registers under window.DAPlugins[GLOBAL_KEY] (or in the per-plugin map).
 * Returns the registration and the script element the caller should clean up.
 * With options.pluginSource the script text is run inline instead of via src.
 */
export async function loadPluginRegistration(
  options: LoadPluginRegistrationOptions,
): Promise<LoadedPluginRegistration> {
  const {
    pluginId,
    pluginUrl: PLUGIN_URL,
    pluginSource,
    onScriptInjected,
    isCancelled,
  } = options

  // Map this URL to plugin_id so we can match registrations even when multiple plugins load simultaneously
  urlToPluginId.set(PLUGIN_URL, pluginId)
  ;(window as any).DAPlugins = (window as any).DAPlugins || {}

  // Always use base URL (no versioning) - components stay mounted so script only loads once per component
  // Browser caching will work properly with the same URL
  const scriptUrl = PLUGIN_URL
  const isInline = typeof pluginSource === 'string'
  let injectedScript: HTMLScriptElement | null = null

  const clearInjectedScript = () => {
    if (injectedScript?.parentNode) injectedScript.remove()
    injectedScript = null
    onScriptInjected?.(null)
  }

  async function injectAndWait(asModule: boolean): Promise<any> {
    // Clear the global slot so plugin can register fresh
    ;(window as any).DAPlugins = (window as any).DAPlugins || {}
    ;(window as any).DAPlugins[GLOBAL_KEY] = undefined

    // Remove any existing script tags with this URL to force fresh execution
    const existingScripts = Array.from(
      document.querySelectorAll(
        `script[src="${scriptUrl}"], script[src="${PLUGIN_URL}"]`,
      ),
    )
    existingScripts.forEach((s) => {
      const scriptEl = s as HTMLScriptElement
      log('Removing existing script tag:', scriptEl.src)
      s.remove()
    })

    const script = document.createElement('script')
    if (isInline) {
      // sourceURL keeps stack traces / devtools pointing at the plugin URL
      script.textContent = `${pluginSource}\n//# sourceURL=${PLUGIN_URL}`
    } else {
      script.src = scriptUrl
      script.async = true
      // For ES modules, defer is automatic and redundant - don't set it
      // For classic scripts, defer helps with execution order
      if (!asModule) {
        script.defer = true
      }
      script.crossOrigin = 'anonymous'
    }
    if (asModule) script.type = 'module'

    if (injectedScript) {
      clearInjectedScript()
    }
    injectedScript = script
    onScriptInjected?.(script)

    let scriptLoadError: Error | null = null
    let scriptExecutionError: any = null

    // Capture script execution errors
    const originalErrorHandler = window.onerror
    const errorHandler: OnErrorEventHandler = (
      event,
      source,
      lineno,
      colno,
      error,
    ) => {
      const sourceStr = typeof source === 'string' ? source : ''
      const eventStr =
        typeof event === 'string' ? event : event?.toString() || 'Unknown error'
      // Inline scripts report the document (or sourceURL) as source, so don't filter
      if (
        isInline ||
        sourceStr === scriptUrl ||
        sourceStr.includes(PLUGIN_URL)
      ) {
        scriptExecutionError =
          error || new Error(`${eventStr} at ${sourceStr}:${lineno}:${colno}`)
        log('Script execution error:', scriptExecutionError)
      }
      if (originalErrorHandler) {
        return originalErrorHandler(event, source, lineno, colno, error)
      }
      return false
    }
    window.onerror = errorHandler

    try {
      await new Promise<void>((resolve, reject) => {
        const onLoaded = () => {
          log('Script loaded successfully:', scriptUrl)
          // Check immediately if script registered synchronously (especially for cached scripts)
          const immediateRegistration = (window as any).DAPlugins?.[GLOBAL_KEY]
          if (immediateRegistration) {
            const mappedPluginId = urlToPluginId.get(PLUGIN_URL)
            if (mappedPluginId === pluginId) {
              log(
                'Plugin registered synchronously on script load (cached script)',
              )
              pluginRegistrations.set(pluginId, immediateRegistration)
            }
          }
          resolve()
        }
        script.onload = onLoaded
        script.onerror = (_e) => {
          scriptLoadError = new Error(
            `Failed to load plugin script: ${scriptUrl}`,
          )
          log('Script load error:', scriptLoadError)
          reject(scriptLoadError)
        }
        document.body.appendChild(script)
        log('Script tag appended to DOM:', scriptUrl)
        // Inline scripts fire no load event: treat insertion as loaded and rely
        // on the registration polling below (module errors arrive via onerror).
        if (isInline) onLoaded()
      })
    } finally {
      // Inline module scripts run after insertion, so keep capturing until the yield below
      if (!isInline) window.onerror = originalErrorHandler
    }

    if (scriptLoadError) {
      throw scriptLoadError
    }

    // Yield so the script has a chance to run (especially important for module scripts).
    // For modules, onload fires when module is loaded, but evaluation happens asynchronously.
    await new Promise((r) => setTimeout(r, YIELD_AFTER_LOAD_MS))
    if (isInline) window.onerror = originalErrorHandler
    if (isCancelled?.()) return null

    if (scriptExecutionError) {
      throw new Error(
        `Plugin script execution error: ${scriptExecutionError.message}`,
      )
    }

    // Check immediately after yield - script might have registered already
    // Check our plugin-specific registration map first
    let obj = pluginRegistrations.get(pluginId)
    if (obj) {
      log('Plugin registered immediately after yield (from map)')
      return obj
    }

    // Check global registration - match by URL to plugin_id mapping
    obj = (window as any).DAPlugins?.[GLOBAL_KEY]
    if (obj) {
      const mappedPluginId = urlToPluginId.get(PLUGIN_URL)
      if (mappedPluginId === pluginId) {
        log(
          'Plugin registered immediately after yield (capturing for plugin_id:',
          pluginId,
          ')',
        )
        pluginRegistrations.set(pluginId, obj) // Store in map for this plugin_id
        return obj
      } else {
        log(
          'Found registration but URL mapping mismatch. Mapped:',
          mappedPluginId,
          'Expected:',
          pluginId,
        )
      }
    }

    // For debugging: log what's in DAPlugins
    log('DAPlugins state:', Object.keys((window as any).DAPlugins || {}))
    log('Checking for registration for plugin_id:', pluginId)
    log('Registered plugin IDs:', Array.from(pluginRegistrations.keys()))

    const maxAttempts = Math.ceil(REGISTER_TIMEOUT_MS / POLL_INTERVAL_MS)
    let attempts = 0
    while (attempts < maxAttempts) {
      if (isCancelled?.()) return null

      // Check our plugin-specific map first
      obj = pluginRegistrations.get(pluginId)
      if (obj) {
        log(
          `Plugin registered after ${attempts * POLL_INTERVAL_MS}ms (from map)`,
        )
        return obj
      }

      // Check global - match by URL to plugin_id mapping
      obj = (window as any).DAPlugins?.[GLOBAL_KEY]
      if (obj) {
        const mappedPluginId = urlToPluginId.get(PLUGIN_URL)
        if (mappedPluginId === pluginId) {
          log(
            `Plugin registered after ${attempts * POLL_INTERVAL_MS}ms (capturing for plugin_id: ${pluginId})`,
          )
          pluginRegistrations.set(pluginId, obj) // Store in map
          return obj
        }
      }

      // Log every 10 attempts (1 second) for debugging
      if (attempts > 0 && attempts % 10 === 0) {
        log(
          `Still waiting for registration... ${attempts * POLL_INTERVAL_MS}ms elapsed`,
        )
        log(
          'Current DAPlugins keys:',
          Object.keys((window as any).DAPlugins || {}),
        )
        log('Registered plugin IDs:', Array.from(pluginRegistrations.keys()))
        log('URL to plugin_id mapping:', Array.from(urlToPluginId.entries()))
      }
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
      attempts++
    }

    // Final check before throwing
    obj = pluginRegistrations.get(pluginId)
    if (obj) {
      log('Plugin registered at final check (from map)')
      return obj
    }

    obj = (window as any).DAPlugins?.[GLOBAL_KEY]
    if (obj) {
      const mappedPluginId = urlToPluginId.get(PLUGIN_URL)
      if (mappedPluginId === pluginId) {
        log('Plugin registered at final check (capturing for plugin_id)')
        pluginRegistrations.set(pluginId, obj)
        return obj
      }
    }

    // Enhanced error message with debugging info
    const errorMsg =
      `Plugin did not register at window.DAPlugins['${GLOBAL_KEY}'] within ${REGISTER_TIMEOUT_MS}ms. ` +
      `Script URL: ${scriptUrl}, ` +
      `Plugin ID: ${pluginId}, ` +
      `DAPlugins keys: [${Object.keys((window as any).DAPlugins || {}).join(', ')}], ` +
      `Registered plugin IDs: [${Array.from(pluginRegistrations.keys()).join(', ')}], ` +
      `Script execution error: ${scriptExecutionError ? scriptExecutionError.message : 'none'}`
    log('Registration timeout:', errorMsg)
    throw new Error(errorMsg)
  }

  // Try module first (most plugins are ESM); fall back to classic.
  let registration: any = null
  try {
    registration = await injectAndWait(true)
  } catch {
    if (isCancelled?.()) {
      return { registration: null, script: injectedScript }
    }
    clearInjectedScript()
    log(
      'Module script load failed or not registered in time, retrying as classic',
    )
    registration = await injectAndWait(false)
  }
  return { registration, script: injectedScript }
}
