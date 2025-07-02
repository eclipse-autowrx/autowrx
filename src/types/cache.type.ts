// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { Prototype } from './model.type'
import { Model } from './model.type'

export type CachePrototype = Prototype & {
  page: string
  model: Model
  time: Date
  executedTimes?: number
}

export type CacheEntity = {
  referenceId: string
  type: string
  page: string
  time: Date
}
