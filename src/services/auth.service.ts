// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { AuthToken } from '@/types/token.type'
import { serverAxios } from './base'

export const loginService = async (email: string, password: string) => {
  return (await serverAxios.post<AuthToken>('/auth/login', { email, password }))
    .data
}

export const registerService = async (
  name: string,
  email: string,
  password: string,
  imageFileUrl?: string,
  provider: string = 'Email',
): Promise<AuthToken> => {
  const registrationData: any = {
    name,
    email,
    password,
    provider,
  }

  if (imageFileUrl) {
    registrationData.image_file = imageFileUrl
  }

  return (await serverAxios.post<AuthToken>('/auth/register', registrationData))
    .data
}

export const logoutService = async () => {
  return serverAxios.post('/auth/logout')
}

export const sendResetPasswordEmailService = async (email: string) => {
  return serverAxios.post('/auth/forgot-password', {
    email,
  })
}

export const resetPasswordService = async (password: string, token: string) => {
  return serverAxios.post(
    '/auth/reset-password',
    {
      password,
    },
    {
      params: {
        token,
      },
    },
  )
}

export const ssoService = async (msAccessToken: string) => {
  return serverAxios.post('/auth/sso', {
    msAccessToken,
  })
}
