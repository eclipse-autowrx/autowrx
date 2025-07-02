// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import create from 'zustand'

interface SystemUIState {
  showPrototypeFlowASIL: boolean
  setShowPrototypeFlowASIL: (value: boolean) => void
  showPrototypeDashboardFullScreen: boolean
  setShowPrototypeDashboardFullScreen: (value: boolean) => void
  showPrototypeFlowFullScreen: boolean
  setShowPrototypeFlowFullScreen: (value: boolean) => void
  showPrototypeRequirementFullScreen: boolean
  setShowPrototypeRequirementFullScreen: (value: boolean) => void
}

export const useSystemUI = create<SystemUIState>((set) => ({
  showPrototypeFlowASIL: false,
  setShowPrototypeFlowASIL: (value) =>
    set(() => ({ showPrototypeFlowASIL: value })),
  showPrototypeDashboardFullScreen: false,
  setShowPrototypeDashboardFullScreen: (value) =>
    set(() => ({ showPrototypeDashboardFullScreen: value })),
  showPrototypeFlowFullScreen: false,
  setShowPrototypeFlowFullScreen: (value) =>
    set(() => ({ showPrototypeFlowFullScreen: value })),
  showPrototypeRequirementFullScreen: false,
  setShowPrototypeRequirementFullScreen: (value) =>
    set(() => ({ showPrototypeRequirementFullScreen: value })),
}))
