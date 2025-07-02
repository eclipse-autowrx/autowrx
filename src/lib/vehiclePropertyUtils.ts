// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { Property } from '@/types/property.type'
import { isNumeric } from './isNumeric'

export const convertJSONToProperty = (json: string) => {
  const result: Property[] = []
  try {
    const obj = JSON.parse(json)
    for (const [key, value] of Object.entries(obj)) {
      let type: Property['type'] = 'null'
      if (typeof value === 'string') {
        type = 'string'
      } else if (typeof value === 'number') {
        type = 'number'
      } else if (typeof value === 'boolean') {
        type = 'boolean'
      }
      result.push({ name: key, type: type, value: String(value) })
    }
    return result
  } catch (error) {}
  return result
}

export const convertPropertyToJSON = (properties: Property[]) => {
  const result: any = {}
  properties.forEach((property) => {
    if (property.type === 'string') {
      result[property.name] = property.value
    } else if (property.type === 'number') {
      result[property.name] = Number(property.value)
    } else if (property.type === 'boolean') {
      result[property.name] = property.value === 'true'
    } else if (property.type === 'null') {
      result[property.name] = null
    }
  })
  return JSON.stringify(result)
}

export const checkInvalidCategory = (vehicleCategory: string) => {
  if (!vehicleCategory) {
    return 'Error: invalid vehicle category!'
  }
  return false
}

export const checkInvalidCustomProperties = (customProperties: Property[]) => {
  const nonDuplicate = new Set()
  for (const property of customProperties) {
    if (!property.name) {
      return 'Error: property must have a name!'
    }

    if (nonDuplicate.has(property.name)) {
      return `Error: duplicate property name '${property.name}'`
    }
    nonDuplicate.add(property.name)

    if (property.type === 'string' && typeof property.value !== 'string') {
      return `Error: property '${property.name}' value must be a string!`
    }
    if (property.type === 'number') {
      if (typeof property.value !== 'string' || !isNumeric(property.value)) {
        return `Error: property '${property.name}' value must be a number!`
      }
    }
    if (
      property.type === 'boolean' &&
      property.value !== 'true' &&
      property.value !== 'false'
    ) {
      return `Error: property '${property.name}' value must be a boolean!`
    }
    if (property.type === 'null' && property.value !== 'null') {
      return `Error: property '${property.name}' value must be null!`
    }
  }
  return false
}
