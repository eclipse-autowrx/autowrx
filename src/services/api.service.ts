// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { CVI, VSSRelease } from '@/types/api.type'
import { serverAxios } from './base'

export const getApiByModelIdService = async (modelId: string) => {
  return (await serverAxios.get<CVI>(`/apis/model_id/${modelId}`)).data
}

export const listVSSVersionsService = async () => {
  return (await serverAxios.get<VSSRelease[]>(`/apis/vss`)).data
}
