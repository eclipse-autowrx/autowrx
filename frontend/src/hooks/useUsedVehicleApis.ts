// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useMemo } from 'react'
import { filterAndCompareVehicleApis } from '@/lib/vehicleApiUtils'
import useModelStore from '@/stores/modelStore'

export function useUsedVehicleApis(code: string) {
  const activeModelApis = useModelStore((s) => s.activeModelApis)

  return useMemo(() => {
    if (!code || !activeModelApis?.length) return []
    const { apisInModel } = filterAndCompareVehicleApis(code, activeModelApis)
    const names = new Set(apisInModel)
    return activeModelApis.filter((api) => names.has(api.name))
  }, [code, activeModelApis])
}
