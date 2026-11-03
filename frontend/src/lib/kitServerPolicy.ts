// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'ws:', 'wss:'])

/**
 * Parses a raw site-config allowlist (comma- or whitespace/newline-separated string
 * or array of strings) into normalized lowercase host entries.
 */
export function parseKitServerAllowlist(raw: unknown): string[] {
  const parts: string[] = []
  if (typeof raw === 'string') {
    parts.push(...raw.split(/[\s,]+/))
  } else if (Array.isArray(raw)) {
    for (const item of raw) {
      if (typeof item === 'string') {
        parts.push(...item.split(/[\s,]+/))
      }
    }
  }
  return parts.map((entry) => entry.trim().toLowerCase()).filter(Boolean)
}

/**
 * Extracts the lowercased host (hostname[:port]) from a kit server URL if it is a
 * valid http/https/ws/wss URL, or returns null otherwise.
 */
export function getKitServerHost(url: string): string | null {
  if (typeof url !== 'string') return null
  const trimmed = url.trim()
  if (!trimmed) return null
  try {
    const parsed = new URL(trimmed)
    if (!ALLOWED_PROTOCOLS.has(parsed.protocol.toLowerCase())) {
      return null
    }
    return parsed.host ? parsed.host.toLowerCase() : null
  } catch {
    return null
  }
}

/**
 * Checks whether the given kit server URL is permitted for the current user.
 * Admins may use any valid http/https/ws/wss URL; non-admins may only use hosts
 * present in the allowlist.
 */
export function isKitServerAllowed(
  url: string,
  opts: { isAdmin: boolean; allowlist: string[] },
): boolean {
  const host = getKitServerHost(url)
  if (!host) return false
  if (opts.isAdmin) return true
  if (!opts.allowlist || opts.allowlist.length === 0) return false
  try {
    const parsed = new URL(url.trim())
    const hostname = parsed.hostname.toLowerCase()
    const normalizedAllowlist = new Set(
      opts.allowlist.map((entry) => entry.trim().toLowerCase()).filter(Boolean),
    )
    return normalizedAllowlist.has(host) || normalizedAllowlist.has(hostname)
  } catch {
    return false
  }
}
