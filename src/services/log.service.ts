// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { CreateActivityLog } from '@/types/log.type'
import { logAxios } from './base'

export const addLog = async (message: CreateActivityLog) => {
  try {
    return (await logAxios.post('/', message)).data
  } catch (err) {}
  return null
}
