import { mountStoreDevtool } from 'simple-zustand-devtools'
import { immer } from 'zustand/middleware/immer'
import { create } from 'zustand'

type RuntimeState = {
  apisValue?: {}
  appLog?: string
}

type Actions = {
  setActiveApis: (_: any) => void
  setAppLog: (log: string) => void
}

const useRuntimeStore = create<RuntimeState & Actions>()(
  immer((set) => ({
    apisValue: [],
    appLog: "",
    setAppLog: (log) => {
      set((state) => {
        state.appLog = log
      })
    },
    setActiveApis: (values) =>
      set((state) => {
        state.apisValue = values
      })
  }))
)

if (process.env.NODE_ENV === 'development') {
  mountStoreDevtool('RuntimeStore', useRuntimeStore)
}

export default useRuntimeStore
