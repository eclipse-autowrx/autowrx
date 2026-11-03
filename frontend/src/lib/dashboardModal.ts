// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

export interface DashboardModalOptions {
  muted?: boolean
  autoPlay?: boolean
  alt?: string
  width?: number | string
  height?: number | string
}

export type DashboardModalPayload =
  | { type: 'video' | 'image'; url: string; options?: DashboardModalOptions }
  | { type: 'iframe'; html: string }

/** Origin a widget iframe URL resolves to, or null if it cannot be parsed. */
export const getFrameOrigin = (url: string | undefined): string | null => {
  if (!url) return null
  try {
    return new URL(url, window.location.href).origin
  } catch {
    return null
  }
}

/** Only https media, or same-origin assets (e.g. http in local dev). */
export const isAllowedMediaUrl = (url: unknown): boolean => {
  if (typeof url !== 'string') return false
  try {
    const parsed = new URL(url, window.location.href)
    return (
      parsed.protocol === 'https:' || parsed.origin === window.location.origin
    )
  } catch {
    return false
  }
}

const isSizeValue = (v: unknown): v is number | string =>
  typeof v === 'number' || typeof v === 'string'

export const sanitizeModalPayload = (
  p: unknown,
): DashboardModalPayload | null => {
  if (typeof p !== 'object' || p === null) return null
  const raw = p as Record<string, unknown>

  if (raw.type === 'iframe') {
    return typeof raw.html === 'string'
      ? { type: 'iframe', html: raw.html }
      : null
  }

  if (raw.type !== 'video' && raw.type !== 'image') return null
  if (typeof raw.url !== 'string' || !isAllowedMediaUrl(raw.url)) return null

  const src: Record<string, unknown> =
    typeof raw.options === 'object' && raw.options !== null
      ? (raw.options as Record<string, unknown>)
      : {}
  const options: DashboardModalOptions = {}
  if (typeof src.muted === 'boolean') options.muted = src.muted
  if (typeof src.autoPlay === 'boolean') options.autoPlay = src.autoPlay
  if (typeof src.alt === 'string') options.alt = src.alt
  if (isSizeValue(src.width)) options.width = src.width
  if (isSizeValue(src.height)) options.height = src.height

  return { type: raw.type, url: raw.url, options }
}
