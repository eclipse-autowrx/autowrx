// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { serverAxios } from './base'

export type GenAISource = 'sdv-copilot' | 'asset' | 'marketplace'

export interface GenerateCodePayload {
  source: GenAISource
  assetId?: string
  addonId?: string
  type: 'GenAI_Python' | 'GenAI_Dashboard' | 'GenAI_Widget'
  prompt: string
  systemMessage?: string
  modelId?: string
}

/**
 * Generate code through the authenticated backend GenAI proxy.
 * The backend resolves the upstream endpoint and credentials; the client never sends them.
 */
export const generateCode = async (
  payload: GenerateCodePayload,
): Promise<string> => {
  const { data } = await serverAxios.post<{ content: string }>(
    '/genai/generate',
    payload,
  )
  return data.content
}
