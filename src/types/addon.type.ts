// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

export interface AddOn {
  id: string
  model_id?: string
  createdBy?: string
  createdAt?: Date
  type: 'GenAI_Widget' | 'GenAI_Python' | 'GenAI_Dashboard'
  name: string
  description: string
  image_file?: string
  apiKey: string
  endpointUrl: string
  version?: any
  visibility?: 'public' | 'private'
  customPayload?: any
  rating?: number
  samples?: string
  team?: any
  isMock?: boolean
  method?: string,
  requestField?: string,
  responseField?: string
}

export interface Config {
  serverBaseUrl: string
  cacheBaseUrl: string
  serverVersion: string
  studioUrl: string
  studioBeUrl: string
  widgetMarketPlaceUrl: string
  widgetMarketPlaceBe: string
  uploadFileUrl: string
  instanceLogo: string
  instance: string
  defaultModelId: string
  genAI: {
    defaultEndpointUrl: string
    marketplaceUrl: string
    sdvApp?: AddOn[]
    dashboard?: AddOn[]
    widget?: AddOn[]
  }
  github: {
    clientId: string
  }
  features: {
    description: string
    id: string
  }[]
}
