import { mountStoreDevtool } from 'simple-zustand-devtools'
import { immer } from 'zustand/middleware/immer'
import { create } from 'zustand'
import { Model, Prototype } from '@/types/model.type'

type ModelState = {
    // access?: Token | null
    model?: Model | null,
    prototype?: Prototype | null

}

type Actions = {
    setActiveModel: (_: Model) => void
    setActivePrototype: (_: Prototype) => void
}

const useModelStore = create<ModelState & Actions>()(
    immer((set) => ({
        model: undefined,
        prototype: undefined,
        setActiveModel: (model) =>
            set((state) => {
                console.log(`set active model`, model)
                state.model = model
            }),
        setActivePrototype: (prototype) =>
            set((state) => {
                console.log(`set active prototype`, prototype)
                state.prototype = prototype
            }),
    }))
)

if (process.env.NODE_ENV === 'development') {
  mountStoreDevtool('ModelStore', useModelStore)
}

export default useModelStore
