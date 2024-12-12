import create from 'zustand'

interface SystemUIState {
  showPrototypeFlowASIL: boolean
  setShowPrototypeFlowASIL: (value: boolean) => void
}

export const useSystemUI = create<SystemUIState>((set) => ({
  showPrototypeFlowASIL: false,
  setShowPrototypeFlowASIL: (value) =>
    set(() => ({ showPrototypeFlowASIL: value })),
}))
