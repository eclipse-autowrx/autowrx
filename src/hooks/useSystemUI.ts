import create from 'zustand'

interface SystemUIState {
  showPrototypeFlowASIL: boolean
  setShowPrototypeFlowASIL: (value: boolean) => void
  showPrototypeDashboardFullScreen: boolean
  setShowPrototypeDashboardFullScreen: (value: boolean) => void
}

export const useSystemUI = create<SystemUIState>((set) => ({
  showPrototypeFlowASIL: false,
  setShowPrototypeFlowASIL: (value) =>
    set(() => ({ showPrototypeFlowASIL: value })),
  showPrototypeDashboardFullScreen: false,
  setShowPrototypeDashboardFullScreen: (value) =>
    set(() => ({ showPrototypeDashboardFullScreen: value })),
}))
