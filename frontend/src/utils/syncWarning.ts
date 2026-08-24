// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { toast } from 'react-toastify'

const SYNC_WARNING_MESSAGE =
  'Your changes were saved, but could not be synced to the external system.'

const MUTATING_METHODS = new Set(['post', 'put', 'patch', 'delete'])

export const isMutatingRequest = (method?: string) => {
  if (!method) return false
  return MUTATING_METHODS.has(method.toLowerCase())
}

let lastSyncWarningAt = 0
const SYNC_WARNING_DEDUPE_MS = 8000

export const showSyncWarningToast = (_rawHeader?: string) => {
  const now = Date.now()
  if (now - lastSyncWarningAt < SYNC_WARNING_DEDUPE_MS) return
  lastSyncWarningAt = now
  toast.warn(SYNC_WARNING_MESSAGE, { autoClose: 6000 })
}

export const hasSyncWarningHeader = (headers: Record<string, unknown> | undefined): boolean => {
  if (!headers) return false
  return Boolean(headers['x-sync-warning'])
}

/** Pause before navigation so a sync-failure toast stays visible. */
export const SYNC_WARNING_REDIRECT_DELAY_MS = 6000
