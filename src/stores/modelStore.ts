import { mountStoreDevtool } from 'simple-zustand-devtools'
import { immer } from 'zustand/middleware/immer'
import { create } from 'zustand'
import { Model } from '@/types/model.type'

type ModelState = {
  // access?: Token | null
  model?: Model | null
}

type Actions = {
  setActiveModel: (_: Model) => void
}

const useModelStore = create<ModelState & Actions>()(
  immer((set) => ({
    model: undefined,
    setActiveModel: (model) =>
      set((state) => {
        state.model = model
      }),
  })),
)

if (process.env.NODE_ENV === 'development') {
  mountStoreDevtool('ModelStore', useModelStore)
}

export default useModelStore
