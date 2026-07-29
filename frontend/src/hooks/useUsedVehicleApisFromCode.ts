// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { filterAndCompareVehicleApis } from '@/lib/vehicleApiUtils'

export const getUsedVehicleApiNames = (
  code: string | undefined,
  activeModelApis?: any[],
): string[] => {
  if (!code || !activeModelApis || activeModelApis.length === 0) {
    return []
  }

  const { apisInModel } = filterAndCompareVehicleApis(code, activeModelApis)
  return apisInModel
}

export const getUsedVehicleApis = (
  code: string | undefined,
  activeModelApis?: any[],
): any[] => {
  if (!activeModelApis || activeModelApis.length === 0) {
    return []
  }

  const apiNames = new Set(getUsedVehicleApiNames(code, activeModelApis))
  return activeModelApis.filter((item: any) => apiNames.has(item.name))
}

export const applySyncWithCodeToOptions = (
  options: Record<string, any>,
  usedApiNames: string[],
): void => {
  if (!options?.syncWithCode || usedApiNames.length === 0) return

  if ('apis' in options) {
    options.apis = [...usedApiNames]
  }

  if ('api' in options) {
    options.api = usedApiNames[0]
  }

  const signalKeys = Object.keys(options).filter((key) => key.endsWith('Signal'))
  if (signalKeys.length > 0 && !('apis' in options) && !('api' in options)) {
    signalKeys.forEach((key, index) => {
      if (usedApiNames[index]) {
        options[key] = usedApiNames[index]
      }
    })
  }
}