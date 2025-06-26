import { mountStoreDevtool } from 'simple-zustand-devtools'
import { immer } from 'zustand/middleware/immer'
import { create } from 'zustand'

type GlobalState = {
  isChatShowed?: boolean
  isShowedAutomationControl?: boolean
  automationSequence?: any
}

type Actions = {
  setIsChatShowed: (value: boolean) => void
  setIsShowedAutomationControl?: (value: boolean) => void
  setAutomationSequence?: (sequence: any) => void
  setAutomationSequenceActionAt?: (index: number, action: any) => void
}

const useGlobalStore = create<GlobalState & Actions>()(
  immer((set) => ({
    isChatShowed: false,
    isShowedAutomationControl: false,
    automationSequence: null,
    setIsChatShowed: (value) =>
      set((state) => {
        state.isChatShowed = value
      }),
    setIsShowedAutomationControl: (value) =>
      set((state) => {
        state.isShowedAutomationControl = value
      }),
    setAutomationSequence: (sequence) =>
      set((state) => {
        const newSequence = {...sequence}
        newSequence.lastUpdated = new Date()
        state.automationSequence = newSequence
      }),
    setAutomationSequenceActionAt: (index, action) => {
      // console.log('setAutomationSequenceActionAt', index, action)
      set((state) => {
        if (state.automationSequence && state.automationSequence.actions.length > index) {
          // Create a new array to trigger reactivity
          const newSequence = {...state.automationSequence}
          newSequence.actions[index] = action
          newSequence.lastUpdated = new Date()
          state.automationSequence = newSequence
        }
      })
    }
  })),
)

if (process.env.NODE_ENV === 'development') {
  mountStoreDevtool('GlobalStore', useGlobalStore)
}

export default useGlobalStore
