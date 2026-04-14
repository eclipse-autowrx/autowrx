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
import { createWithEqualityFn } from 'zustand/traditional'

type AuthState = {
  access?: Token | null
  user: any
  openLoginDialog: boolean
  authBootstrapped: boolean
}

type Actions = {
  setAccess: (_: Token) => void
  setUser: (user: any, access: any) => void
  logOut: () => void
  setOpenLoginDialog: (isOpen: boolean) => void
  setAuthBootstrapped: (bootstrapped: boolean) => void
}

const useAuthStore = createWithEqualityFn<AuthState & Actions>()(
  immer((set) => ({
    access: undefined,
    user: undefined,
    openLoginDialog: false,
    authBootstrapped: false,
    setUser: (user, access) =>
      set((state) => {
        state.access = access
        state.user = user
        state.authBootstrapped = true
      }),
    setAccess: (access) =>
      set((state) => {
        state.access = access
        state.authBootstrapped = true
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
    setAuthBootstrapped: (bootstrapped) =>
      set((state) => {
        state.authBootstrapped = bootstrapped
      }),
  })),
)

if (process.env.NODE_ENV === 'development') {
  mountStoreDevtool('AuthStore', useAuthStore)
}

export default useAuthStore
