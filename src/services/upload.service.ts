// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import axios from 'axios'
import { serverAxios } from './base'
import config from '@/configs/config'

const UPLOAD_FILE_URL = config.uploadFileUrl

export const uploadFileService = async (file: any) => {
  const formData = new FormData()
  formData.append('file', file)
  return (
    await axios.post<{ url: string }>(
      `${UPLOAD_FILE_URL}/upload/store-be`,
      formData,
    )
  ).data
}
