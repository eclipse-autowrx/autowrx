// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

export const filterAndCompareVehicleApis = (
  code: string,
  activeModelApis: any,
) => {
  if (!code) {
    return { apisInCodeOnly: [], apisInModel: [], apisNotInModel: [] }
  }

  // Replace all sequences of whitespace with a single space
  code = code.replace(/\s+/g, ' ').trim()

  // Capture Vehicle APIs while allowing spaces and line breaks around dots
  const vehicleApiPattern = /\bVehicle(?:\s*\.\s*[A-Za-z0-9_]+)+/g
  const vehicleApisInCode = code.match(vehicleApiPattern) || []

  const methodNames = ['get', 'set', 'subscribe', 'set_many', 'add', 'apply']

  const processedApis = vehicleApisInCode
    .map((api) => {
      let cleanApi = api.replace(/\s+/g, '')

      // Remove a function call at the end, such as .get() or .set(0)
      cleanApi = cleanApi.replace(/\.\w+\([^)]*\)$/g, '')

      const parts = cleanApi.split('.')
      const filteredParts = parts.filter((part) => !methodNames.includes(part))

      // Exclude APIs whose second part is a method name
      if (methodNames.includes(filteredParts[1])) {
        return null
      }

      return filteredParts.join('.')
    })
    .filter((api) => api !== null)

  const normalizedApis = [...new Set(processedApis)]
  const filteredApis = normalizedApis.filter((api) => api !== 'Vehicle')

  const apisInModel: string[] = []
  const apisNotInModel: string[] = []
  const apisInCodeOnly: string[] = [...filteredApis]

  filteredApis.forEach((apiUsedInCode) => {
    if (!apiUsedInCode) return

    const foundInModel = activeModelApis.some(
      (api: any) => api.name === apiUsedInCode,
    )

    if (foundInModel) {
      apisInModel.push(apiUsedInCode)
    } else {
      apisNotInModel.push(apiUsedInCode)
    }
  })

  return {
    apisInCodeOnly,
    apisInModel,
    apisNotInModel,
  }
}
