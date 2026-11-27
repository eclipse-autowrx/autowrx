// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import axios from 'axios'
import config from '@/configs/config'
import type { User } from '@/types/user.type'

export interface RefreshResponse {
  access?: { token: string; expires: string }
  user?: User
}

// No interceptors: a 401 from the refresh itself must not trigger another refresh.
const refreshAxios = axios.create({
  baseURL: `${config.serverBaseUrl}/${config.serverVersion}`,
  withCredentials: true,
})

let inFlight: Promise<RefreshResponse> | null = null

/**
 * POST /auth/refresh-tokens once for all callers. The backend deletes the
 * refresh token it accepts, so a second request sent with the same cookie
 * before the first one returns is rejected, and the user gets signed out.
 * A caller that asks while a refresh runs gets the result of that refresh.
 */
export function refreshSession(): Promise<RefreshResponse> {
  if (!inFlight) {
    inFlight = refreshAxios
      .post<RefreshResponse>('/auth/refresh-tokens', {})
      .then((res) => res.data ?? {})
      .finally(() => {
        inFlight = null
      })
  }
  return inFlight
}
