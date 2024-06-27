import { mountStoreDevtool } from 'simple-zustand-devtools'
import { immer } from 'zustand/middleware/immer'
import { create } from 'zustand'
import { CustomApi, Model, Prototype, VehicleApi } from '@/types/model.type'
import { CVI_v4_1 } from '@/data/CVI_v4.1'
import { parseCvi } from '@/lib/utils'

type ModelState = {
  // access?: Token | null
  model?: Model | null
  activeModelApis: any[]
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
        if (model) {
          const cviData = JSON.parse(CVI_v4_1)
          // console.log('cviData', cviData)
          const parsedApiList = parseCvi(cviData)
          // console.log('parsedApiList', parsedApiList)

          parsedApiList.forEach((item: any) => {
            if (item.type == 'branch') return
            let arName = item.name.split('.')
            if (arName.length > 1) {
              item.shortName = '.' + arName.slice(1).join('.')
            }
          })

          // Append custom APIs to the parsed API list
          if (model.custom_apis) {
            const customApis = model.custom_apis.map((api: CustomApi) => {
              let arName = api.name.split('.')
              return {
                ...api,
                isWishlist: true,
                shortName:
                  arName.length > 1
                    ? '.' + arName.slice(1).join('.')
                    : undefined,
              }
            })
            state.activeModelApis = [...customApis, ...parsedApiList]
          } else {
            state.activeModelApis = parsedApiList
          }
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
  })),
)

if (process.env.NODE_ENV === 'development') {
  mountStoreDevtool('ModelStore', useModelStore)
}

export default useModelStore
