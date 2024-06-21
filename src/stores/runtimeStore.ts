import { mountStoreDevtool } from 'simple-zustand-devtools'
import { immer } from 'zustand/middleware/immer'
import { create } from 'zustand'

type RuntimeState = {
  apisValue?: {}
}

type Actions = {
  setActiveApis: (_: any) => void
}

const useRuntimeStore = create<RuntimeState & Actions>()(
  immer((set) => ({
    apisValue: [],
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
