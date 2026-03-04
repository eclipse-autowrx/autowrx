// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import {
  configManagementService,
  type Config,
} from '@/services/configManagement.service'

type ConfigRef = Pick<Config, 'id' | 'key'>
type HistoryEntryLike = {
  key: string
  value?: any
  valueAfter?: any
  valueType?: string
}

export const reloadSoon = (delayMs: number = 800) => {
  setTimeout(() => window.location.reload(), delayMs)
}

export const deleteConfigsById = async (
  configs: ConfigRef[],
): Promise<{
  deleted: string[]
  failed: Array<{ key: string; reason: unknown }>
}> => {
  const targets = (configs || []).filter((c) => !!c.id)
  if (targets.length === 0) return { deleted: [], failed: [] }

  const results = await Promise.allSettled(
    targets.map((c) => configManagementService.deleteConfigById(c.id!)),
  )

  const deleted: string[] = []
  const failed: Array<{ key: string; reason: unknown }> = []

  results.forEach((res, idx) => {
    const key = targets[idx]?.key || '(unknown)'
    if (res.status === 'fulfilled') {
      deleted.push(key)
    } else {
      failed.push({ key, reason: res.reason })
    }
  })

  return { deleted, failed }
}

export const upsertConfigFromHistory = async (params: {
  entry: HistoryEntryLike
  scope?: Config['scope']
  category?: string
}): Promise<{ valueBefore: any; targetValue: any }> => {
  const { entry, scope = 'site', category } = params
  const targetValue = entry.valueAfter ?? entry.value

  const res = await configManagementService.getConfigs({
    key: entry.key,
    scope,
    ...(category ? { category } : {}),
    limit: 1,
  })

  const valueBefore =
    res.results && res.results.length > 0 ? res.results[0].value : undefined

  if (res.results && res.results.length > 0) {
    await configManagementService.updateConfigById(res.results[0].id!, {
      value: targetValue,
    })
  } else {
    await configManagementService.createConfig({
      key: entry.key,
      scope,
      ...(category ? { category } : {}),
      value: targetValue,
      secret: false,
      valueType:
        (entry.valueType as 'string' | 'object' | 'array' | 'boolean') ??
        'string',
    })
  }

  return { valueBefore, targetValue }
}

