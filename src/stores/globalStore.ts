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
        state.automationSequence = sequence
      })
  })),
)

if (process.env.NODE_ENV === 'development') {
  mountStoreDevtool('GlobalStore', useGlobalStore)
}

export default useGlobalStore
