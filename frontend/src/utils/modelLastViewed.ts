// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const LS_LAST_VIEWED_KEY = 'model_last_viewed'

export function getLastViewedMap(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(LS_LAST_VIEWED_KEY) || '{}')
  } catch {
    return {}
  }
}

export function recordModelView(modelId: string): void {
  try {
    const map = getLastViewedMap()
    map[modelId] = Date.now()
    localStorage.setItem(LS_LAST_VIEWED_KEY, JSON.stringify(map))
  } catch {}
}
