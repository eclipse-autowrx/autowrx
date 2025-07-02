// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { Token } from '@/types/token.type'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { persist } from 'zustand/middleware'

type AuthState = {
  access?: Token | null
}

type Actions = {
  setAccess: (_: Token) => void
  clear: () => void
}

const useGithubAuthStore = create<AuthState & Actions>()(
  immer(
    persist(
      (set) => ({
        access: undefined,
        setAccess: (access) => {
          set((state) => {
            state.access = access
          })
        },
        clear() {
          set({ access: undefined })
        },
      }),
      {
        name: 'github-auth',
      },
    ),
  ),
)

export default useGithubAuthStore
