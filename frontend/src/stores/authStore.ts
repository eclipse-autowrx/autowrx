// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { Token } from '@/types/token.type.ts'
import { mountStoreDevtool } from 'simple-zustand-devtools'
import { immer } from 'zustand/middleware/immer'
import { logoutService } from '@/services/auth.service.ts'
import { create } from 'zustand'

type AuthState = {
  access?: Token | null
  user: any
  openLoginDialog: boolean
}

type Actions = {
  setAccess: (_: Token) => void
  setUser: (user: any, access: any) => void
  logOut: () => void
  setOpenLoginDialog: (isOpen: boolean) => void
}

const useAuthStore = create<AuthState & Actions>()(
  immer((set) => ({
    access: undefined,
    user: undefined,
    openLoginDialog: false,
    setUser: (user, access) =>
      set((state) => {
        state.access = access
        state.user = user
      }),
    setAccess: (access) =>
      set((state) => {
        state.access = access
      }),
    logOut: () =>
      set((state) => {
        if (state.access) {
          logoutService().then(() => {
            window.location.pathname = '/'
          })
        }
        state.access = null
        state.user = null
      }),
    setOpenLoginDialog: (isOpen) =>
      set((state) => {
        state.openLoginDialog = isOpen
      }),
  })),
)

if (process.env.NODE_ENV === 'development') {
  mountStoreDevtool('AuthStore', useAuthStore)
}

export default useAuthStore
