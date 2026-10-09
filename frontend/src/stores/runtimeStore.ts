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
  activeRuntimeName?: string
  isAppRunning: boolean
  /** Bumped to remount dashboard widgets (e.g. after a runtime starts an app) */
  remountCountByRuntime: number
  /** The active runtime is occupied by another session (single source for the Preview widget) */
  isRuntimeBusyByOther: boolean
}

type Actions = {
  setActiveApis: (_: any) => void
  setAppLog: (log: string) => void
  setTraceVars: (_: any) => void
  setActiveRuntimeName: (name: string | undefined) => void
  setIsAppRunning: (isRunning: boolean) => void
  incrementRemountCountByRuntime: () => void
  setIsRuntimeBusyByOther: (isBusy: boolean) => void
}

const useRuntimeStore = createWithEqualityFn<RuntimeState & Actions>()(
  immer((set) => ({
    apisValue: [],
    appLog: "",
    activeRuntimeName: undefined,
    isAppRunning: false,
    remountCountByRuntime: 0,
    isRuntimeBusyByOther: false,
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
    setActiveRuntimeName: (name) =>
      set((state) => {
        state.activeRuntimeName = name
      }),
    setIsAppRunning: (isRunning) =>
      set((state) => {
        state.isAppRunning = isRunning
      }),
    incrementRemountCountByRuntime: () =>
      set((state) => {
        state.remountCountByRuntime += 1
      }),
    setIsRuntimeBusyByOther: (isBusy) =>
      set((state) => {
        state.isRuntimeBusyByOther = isBusy
      }),
  }))
)

if (process.env.NODE_ENV === 'development') {
  mountStoreDevtool('RuntimeStore', useRuntimeStore)
}

export default useRuntimeStore

