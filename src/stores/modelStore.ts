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
          const parsedApiList = parseCvi(cviData)

          parsedApiList.forEach((item: any) => {
            if (item.type == 'branch') return
            let arName = item.name.split('.')
            if (arName.length > 1) {
              item.shortName = '.' + arName.slice(1).join('.')
            } else {
              item.shortName = item.name // Ensure root elements have their name as shortName
            }
          })

          let combinedApis = parsedApiList
          if (model.custom_apis) {
            const customApis = model.custom_apis.map((api: CustomApi) => {
              let arName = api.name.split('.')
              return {
                ...api,
                isWishlist: true,
                shortName:
                  arName.length > 1
                    ? '.' + arName.slice(1).join('.')
                    : api.name, // Ensure root elements have their name as shortName
              }
            })
            combinedApis = [...customApis, ...parsedApiList]
          }

          combinedApis.sort((a, b) => {
            const aParts = a.name.split('.')
            const bParts = b.name.split('.')

            for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
              if (aParts[i] !== bParts[i]) {
                return (aParts[i] || '').localeCompare(bParts[i] || '')
              }
            }

            return 0
          })

          state.activeModelApis = combinedApis
        } else {
          state.activeModelApis = []
        }
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
