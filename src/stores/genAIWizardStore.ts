import create from 'zustand'

type WizardGenAIStoreState = {
  wizardPrompt: string
  wizardLog: string
  wizardGeneratedCode: string
  wizardGenerateCodeAction: (() => void) | null
  wizardRunSimulationAction: (() => void) | null
}

type WizardGenAIStoreActions = {
  setWizardPrompt: (prompt: string) => void
  setWizardLog: (log: string) => void
  setWizardGeneratedCode: (code: string) => void
  registerWizardGenerateCodeAction: (action: () => void) => void
  executeWizardGenerateCodeAction: () => void
  registerWizardSimulationRun: (action: () => void) => void
  executeWizardSimulationRun: () => boolean
}

const useWizardGenAIStore = create<
  WizardGenAIStoreState & WizardGenAIStoreActions
>((set, get) => ({
  wizardPrompt: '',
  wizardLog: '',
  wizardGeneratedCode: '',
  wizardGenerateCodeAction: null,
  wizardRunSimulationAction: null,

  setWizardPrompt: (prompt: string) => set({ wizardPrompt: prompt }),

  setWizardLog: (log: string) => set({ wizardLog: log }),

  setWizardGeneratedCode: (code: string) => set({ wizardGeneratedCode: code }),

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
}))

export default useWizardGenAIStore
