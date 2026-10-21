// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import axios from 'axios'
import { serverAxios } from './base'

export const uploadFileService = async (file: Blob) => {
  const formData = new FormData()
  formData.append('file', file)
  try {
    return (
      await serverAxios.post<{ url: string }>(`/file/upload/store-be`, formData)
    ).data
  } catch (error) {
    // Surface the server's reason (e.g. 415 "File type not allowed") to callers' toasts
    const serverMessage = axios.isAxiosError(error)
      ? error.response?.data?.message
      : undefined
    if (serverMessage && error instanceof Error) error.message = serverMessage
    throw error
  }
}
