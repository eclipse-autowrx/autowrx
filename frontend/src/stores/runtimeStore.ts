// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { mountStoreDevtool } from 'simple-zustand-devtools'
import { immer } from 'zustand/middleware/immer'
import { createWithEqualityFn } from 'zustand/traditional'

type RuntimeState = {
  apisValue?: {}
  traceVars?: {}
  appLog?: string
  isAppRunning: boolean
}

type Actions = {
  setActiveApis: (_: any) => void
  setAppLog: (log: string) => void
  setTraceVars: (_: any) => void
  setIsAppRunning: (isRunning: boolean) => void
}

const useRuntimeStore = createWithEqualityFn<RuntimeState & Actions>()(
  immer((set) => ({
    apisValue: [],
    appLog: "",
    isAppRunning: false,
    setAppLog: (log) => {
      set((state) => {
        state.appLog = log
      })
    },
    setActiveApis: (values) =>
      set((state) => {
        state.apisValue = values
      }),
    setTraceVars: (values) =>
      set((state) => {
        state.traceVars = values
      }),
    setIsAppRunning: (isRunning) =>
      set((state) => {
        state.isAppRunning = isRunning
      }),
  }))
)

if (process.env.NODE_ENV === 'development') {
  mountStoreDevtool('RuntimeStore', useRuntimeStore)
}

export default useRuntimeStore

