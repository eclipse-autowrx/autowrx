import create from 'zustand'
import { parseCvi } from '@/lib/utils'
import { CVI_v4_1 } from '@/data/CVI_v4.1'
import { CVI } from '@/data/CVI'
import dashboard_templates from '@/data/dashboard_templates'
import { createPrototypeService } from '@/services/prototype.service'
import { createModelService } from '@/services/model.service'
import default_journey from '@/data/default_journey'

/* Extend the prototype type to include additional fields if needed */
type WizardPrototype = {
  name: string
  model_id?: string
  modelName?: string
  id?: string
  widget_config?: any
  code?: string
  api_data_url?: string
  api_version?: string
  mainApi?: string
}

type WizardGenAIStoreState = {
  wizardPrompt: string
  wizardLog: string
  wizardGenerateCodeAction: (() => void) | null
  wizardSimulating: boolean
  wizardRunSimulationAction: (() => void) | null
  wizardStopSimulationAction: (() => void) | null
  wizardSavePrototypeAction: (() => void) | null
  codeGenerating: boolean
  wizardPrototype: WizardPrototype
  activeModelApis: any[]
  allWizardRuntimes: any[]
  wizardActiveRtId: string | undefined
  wizardDeployRtId: string
}

type WizardGenAIStoreActions = {
  setWizardPrompt: (prompt: string) => void
  setWizardLog: (log: string) => void
  setCodeGenerating: (isGenerating: boolean) => void

  setWizardGeneratedCode: (code: string) => void
  registerWizardGenerateCodeAction: (action: () => void) => void
  executeWizardGenerateCodeAction: () => boolean

  setWizardSimulating: (simulating: boolean) => void
  registerWizardSimulationRun: (action: () => void) => void
  registerWizardSimulationStop: (action: () => void) => void
  executeWizardSimulationRun: () => boolean
  executeWizardSimulationStop: () => boolean

  registerWizardSavePrototypeAction: (action: () => void) => void
  executeWizardSavePrototypeAction: () => void

  setPrototypeData: (data: Partial<WizardPrototype>) => void
  resetWizardStore: () => void
  setAllWizardRuntimes: (runtimes: any[]) => void
  setWizardActiveRtId: (rtId: string | undefined) => void
  setWizardDeployRtId: (rtId: string) => void
  savePrototype: (options: {
    toast: (msg: string) => void
    navigate: (path: string) => void
    onClose?: () => void
    refetch?: () => void
  }) => Promise<void>
}

const parseSignalCVI = (cviData: any) => {
  const parsedCviData =
    typeof cviData === 'string' ? JSON.parse(cviData) : cviData
  const parsedApiList = parseCvi(parsedCviData)

  parsedApiList.forEach((item: any) => {
    if (item.type === 'branch') return
    let arName = item.name.split('.')
    if (arName.length > 1) {
      item.shortName = '.' + arName.slice(1).join('.')
    } else {
      item.shortName = item.name
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
  modelName: '',
  id: 'this-is-a-mock-prototype-id',
  widget_config: dashboard_templates[0].config,
  code: '',
  api_data_url: '',
  api_version: 'v4.1',
  mainApi: 'Vehicle',
}

const useWizardGenAIStore = create<
  WizardGenAIStoreState & WizardGenAIStoreActions
>((set, get) => ({
  wizardPrompt: '',
  wizardLog: '',
  wizardGenerateCodeAction: null,
  wizardSimulating: false,
  wizardRunSimulationAction: null,
  wizardStopSimulationAction: null,
  wizardSavePrototypeAction: null,
  codeGenerating: false,
  wizardPrototype: defaultWizardPrototype,
  activeModelApis: parseSignalCVI(CVI_v4_1),
  allWizardRuntimes: [],
  wizardActiveRtId: '',
  wizardDeployRtId: '',

  setCodeGenerating: (isGenerating: boolean) => {
    set({ codeGenerating: isGenerating })
  },

  setWizardActiveRtId: (rtId: string | undefined) => {
    set((state) => {
      let cviData
      if (rtId?.includes('VSS3') || rtId?.includes('ETAS')) {
        cviData = CVI
      } else if (rtId?.includes('VSS4')) {
        cviData = CVI_v4_1
      } else {
        cviData = CVI_v4_1
      }
      const parsedApis = parseSignalCVI(cviData)
      return {
        wizardActiveRtId: rtId,
        activeModelApis: parsedApis,
      }
    })
  },

  setWizardDeployRtId: (rtId: string) => {
    set({ wizardDeployRtId: rtId })
  },

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

  registerWizardSavePrototypeAction: (action: () => void) =>
    set({ wizardSavePrototypeAction: action }),
  executeWizardSavePrototypeAction: () => {
    const { wizardSavePrototypeAction } = get()
    if (wizardSavePrototypeAction) {
      wizardSavePrototypeAction()
    } else {
      console.warn('Wizard save prototype action is not registered')
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

  savePrototype: async (options: {
    toast: (msg: string) => void
    navigate: (path: string) => void
    onClose?: () => void
    refetch?: () => void
  }) => {
    const { wizardPrototype } = get()
    let modelId: string
    try {
      if (wizardPrototype.model_id) {
        modelId = wizardPrototype.model_id
      } else if (wizardPrototype.modelName) {
        const modelBody = {
          main_api: wizardPrototype.mainApi || 'Vehicle',
          name: wizardPrototype.modelName,
          api_version: wizardPrototype.api_version || 'v4.1',
        }
        if (wizardPrototype.api_data_url) {
          ;(modelBody as any).api_data_url = wizardPrototype.api_data_url
        }
        modelId = await createModelService(modelBody)
        set({ wizardPrototype: { ...wizardPrototype, model_id: modelId } })
      } else {
        throw new Error('Model data is missing')
      }

      const body = {
        model_id: modelId,
        name: wizardPrototype.name,
        language: 'python',
        state: 'development',
        apis: { VSC: [], VSS: [] },
        code: wizardPrototype.code || '',
        complexity_level: 3,
        customer_journey: default_journey,
        description: {
          problem: '',
          says_who: '',
          solution: '',
          status: '',
        },
        image_file: '/imgs/default_prototype_cover.jpg',
        skeleton: '{}',
        tags: [],
        widget_config: wizardPrototype.widget_config || '',
        autorun: true,
      }

      const response = await createPrototypeService(body)
      options.toast(`Prototype "${wizardPrototype.name}" created successfully`)
      await options.navigate(
        `/model/${modelId}/library/prototype/${response.id}`,
      )
      if (options.onClose) options.onClose()
      if (options.refetch) await options.refetch()
    } catch (error: any) {
      console.error(error)
      throw error
    }
  },
}))

export default useWizardGenAIStore
