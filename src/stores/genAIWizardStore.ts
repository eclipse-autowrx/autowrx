import create from 'zustand'

type PrototypeData = {
  prototypeName: string
  modelName?: string
  modelId?: string
  widget_config?: any
  wizardGeneratedCode?: string
}

type WizardGenAIStoreState = {
  wizardPrompt: string
  wizardLog: string
  wizardGeneratedCode: string
  wizardGenerateCodeAction: (() => void) | null
  wizardRunSimulationAction: (() => void) | null
  prototypeData: PrototypeData
}

type WizardGenAIStoreActions = {
  setWizardPrompt: (prompt: string) => void
  setWizardLog: (log: string) => void
  setWizardGeneratedCode: (code: string) => void
  registerWizardGenerateCodeAction: (action: () => void) => void
  executeWizardGenerateCodeAction: () => void
  registerWizardSimulationRun: (action: () => void) => void
  executeWizardSimulationRun: () => boolean
  setPrototypeData: (data: Partial<PrototypeData>) => void
  resetPrototypeData: () => void
}

const useWizardGenAIStore = create<
  WizardGenAIStoreState & WizardGenAIStoreActions
>((set, get) => ({
  wizardPrompt: '',
  wizardLog: '',
  wizardGeneratedCode: '',
  wizardGenerateCodeAction: null,
  wizardRunSimulationAction: null,
  prototypeData: {
    prototypeName: '',
    modelName: '',
    modelId: '',
    widget_config: '',
    wizardGeneratedCode: '',
  },

  setWizardPrompt: (prompt: string) => set({ wizardPrompt: prompt }),
  setWizardLog: (log: string) => set({ wizardLog: log }),

  setWizardGeneratedCode: (code: string) => {
    set((state) => ({
      wizardGeneratedCode: code,
      prototypeData: { ...state.prototypeData, wizardGeneratedCode: code },
    }))
  },

  registerWizardGenerateCodeAction: (action: () => void) =>
    set({ wizardGenerateCodeAction: action }),

  executeWizardGenerateCodeAction: () => {
    const { wizardGenerateCodeAction } = get()
    if (wizardGenerateCodeAction) {
      wizardGenerateCodeAction()
      return true
    } else {
      console.warn('Wizard generate code action is not registered')
      return false
    }
  },

  registerWizardSimulationRun: (action: () => void) =>
    set({ wizardRunSimulationAction: action }),

  executeWizardSimulationRun: () => {
    const { wizardRunSimulationAction } = get()
    if (wizardRunSimulationAction) {
      wizardRunSimulationAction()
      return true
    } else {
      console.warn('Wizard simulation run action is not registered')
      return false
    }
  },

  setPrototypeData: (data: Partial<PrototypeData>) =>
    set((state) => ({
      prototypeData: { ...state.prototypeData, ...data },
    })),

  resetPrototypeData: () =>
    set({
      prototypeData: {
        prototypeName: '',
        modelName: '',
        modelId: '',
        widget_config: '',
        wizardGeneratedCode: '',
      },
    }),
}))

export default useWizardGenAIStore
