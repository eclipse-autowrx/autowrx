// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

export type Property = {
  name: string
  type: 'string' | 'number' | 'boolean' | 'null'
  value: string
}

export type PropertyType = 'string' | 'number' | 'boolean' | 'null'

export interface CustomPropertyType {
  name: string
  type: PropertyType
  value: string | number | boolean | null
}
