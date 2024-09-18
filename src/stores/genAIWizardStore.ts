import create from 'zustand'
import { parseCvi } from '@/lib/utils'
import { CVI_v4_1 } from '@/data/CVI_v4.1'
import dashboard_templates from '@/data/dashboard_templates'

type WizardPrototype = {
  name: string
  model_id?: string
  id?: string
  widget_config?: any
  code?: string
}

type WizardGenAIStoreState = {
  wizardPrompt: string
  wizardLog: string

  wizardGenerateCodeAction: (() => void) | null

  wizardSimulating: boolean
  wizardRunSimulationAction: (() => void) | null
  wizardStopSimulationAction: (() => void) | null

  wizardPrototype: WizardPrototype
  activeModelApis: any[]

  allWizardRuntimes: any[]
  wizardActiveRtId: string | undefined
}

type WizardGenAIStoreActions = {
  setWizardPrompt: (prompt: string) => void
  setWizardLog: (log: string) => void

  setWizardGeneratedCode: (code: string) => void
  registerWizardGenerateCodeAction: (action: () => void) => void
  executeWizardGenerateCodeAction: () => void

  setWizardSimulating: (simulating: boolean) => void
  registerWizardSimulationRun: (action: () => void) => void
  registerWizardSimulationStop: (action: () => void) => void
  executeWizardSimulationRun: () => boolean
  executeWizardSimulationStop: () => boolean

  setPrototypeData: (data: Partial<WizardPrototype>) => void
  resetWizardStore: () => void
  setAllWizardRuntimes: (runtimes: any[]) => void
  setWizardActiveRtId: (rtId: string | undefined) => void
}

const parseSignalCVI = () => {
  const cviData = JSON.parse(CVI_v4_1)
  const parsedApiList = parseCvi(cviData)

  parsedApiList.forEach((item: any) => {
    if (item.type === 'branch') return
    let arName = item.name.split('.')
    if (arName.length > 1) {
      item.shortName = '.' + arName.slice(1).join('.')
    } else {
      item.shortName = item.name // Ensure root elements have their name as shortName
    }
  })

  parsedApiList.sort((a, b) => {
    const aParts = a.name.split('.')
    const bParts = b.name.split('.')

    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      if (aParts[i] !== bParts[i]) {
        return (aParts[i] || '').localeCompare(bParts[i] || '')
      }
    }

    return 0
  })

  return parsedApiList
}

const defaultWizardPrototype: WizardPrototype = {
  name: '',
  model_id: '',
  id: 'this-is-a-mock-prototype-id',
  widget_config: dashboard_templates[0].config,
  code: '',
}

const useWizardGenAIStore = create<
  WizardGenAIStoreState & WizardGenAIStoreActions
>((set, get) => ({
  wizardPrompt: '',
  wizardLog: '',

  wizardGeneratedCode: '',
  wizardGenerateCodeAction: null,

  wizardSimulating: false,
  wizardRunSimulationAction: null,
  wizardStopSimulationAction: null,

  wizardPrototype: defaultWizardPrototype,
  activeModelApis: parseSignalCVI(),

  allWizardRuntimes: [],
  wizardActiveRtId: '',

  setWizardActiveRtId: (rtId: string | undefined) =>
    set({ wizardActiveRtId: rtId }),

  setAllWizardRuntimes: (runtimes: any[]) =>
    set({ allWizardRuntimes: runtimes }),

  setWizardSimulating: (simulating: boolean) =>
    set({ wizardSimulating: simulating }),

  setWizardPrompt: (prompt: string) => set({ wizardPrompt: prompt }),
  setWizardLog: (log: string) => set({ wizardLog: log }),

  setWizardGeneratedCode: (code: string) => {
    set((state) => ({
      wizardGeneratedCode: code,
      wizardPrototype: { ...state.wizardPrototype, code: code },
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

  registerWizardSimulationStop: (action: () => void) =>
    set({ wizardStopSimulationAction: action }),

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

  executeWizardSimulationStop: () => {
    const { wizardStopSimulationAction } = get()
    if (wizardStopSimulationAction) {
      wizardStopSimulationAction()
      return true
    } else {
      console.warn('Wizard simulation stop action is not registered')
      return false
    }
  },

  setPrototypeData: (data: Partial<WizardPrototype>) =>
    set((state) => ({
      wizardPrototype: { ...state.wizardPrototype, ...data },
    })),

  resetWizardStore: () => {
    const { executeWizardSimulationStop } = get()
    executeWizardSimulationStop()
    set({
      wizardPrompt: '',
      wizardLog: '',
      wizardPrototype: defaultWizardPrototype,
    })
  },
}))

export default useWizardGenAIStore
