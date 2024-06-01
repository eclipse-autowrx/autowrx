import { mountStoreDevtool } from 'simple-zustand-devtools'
import { immer } from 'zustand/middleware/immer'
import { create } from 'zustand'
import { Model, Prototype } from '@/types/model.type'
import { CVI_v4_1 } from '@/data/CVI_v4.1'
import { parseCvi } from '@/lib/utils'

type ModelState = {
    // access?: Token | null
    model?: Model | null,
    activeModelApis: any[],
    prototype?: Prototype | null

}

type Actions = {
    setActiveModel: (_: Model) => void
    setActivePrototype: (_: Prototype) => void
}

const useModelStore = create<ModelState & Actions>()(
    immer((set) => ({
        model: undefined,
        activeModelApis: [],
        prototype: undefined,
        setActiveModel: (model) =>
            set((state) => {
                console.log(`set active model`, model)
                state.model = model
                if(model) {
                    const cviData = JSON.parse(CVI_v4_1)
                    const parsedApiList = parseCvi(cviData)

                    parsedApiList.forEach((item: any) => {
                        if (item.type == "branch") return;
                        let arName = item.api.split(".");
                        if (arName.length > 1) {
                            item.shortName = "." + arName.slice(1).join(".")
                        }
                    })
                    state.activeModelApis = parsedApiList
                } else {
                    state.activeModelApis = []
                }
                // console.log('state.activeModelApis', state.activeModelApis)
            }),
        setActivePrototype: (prototype) =>
            set((state) => {
                // console.log(`set active prototype`, prototype)
                state.prototype = prototype
            }),
    }))
)

if (process.env.NODE_ENV === 'development') {
  mountStoreDevtool('ModelStore', useModelStore)
}

export default useModelStore
