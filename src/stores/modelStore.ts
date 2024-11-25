import { mountStoreDevtool } from 'simple-zustand-devtools'
import { immer } from 'zustand/middleware/immer'
import { create } from 'zustand'
import { CustomApi, Model, Prototype, VehicleApi } from '@/types/model.type'
import { CVI_v4_1 } from '@/data/CVI_v4.1'
import { parseCvi } from '@/lib/utils'
import { getComputedAPIs } from '@/services/model.service'

type ModelState = {
  // access?: Token | null
  model?: Model | null
  activeModelApis?: any[]
  prototype?: Prototype | null
}

type Actions = {
  setActiveModel: (_: Model) => Promise<void>
  setActivePrototype: (_: Prototype) => void
  refreshModel: () => Promise<void>
}

const useModelStore = create<ModelState & Actions>()((set, get) => ({
  model: undefined,
  activeModelApis: [],
  prototype: undefined,
  setActiveModel: async (model) => {
    let ret: any
    if (model) {
      // New way
      console.log("model", model)
      try {
        ret = model.api_version
          ? await getComputedAPIs(model.id)
          : JSON.parse(CVI_v4_1)
      } catch (error) {
        ret = JSON.parse(CVI_v4_1)
      }

      ret = parseCvi(ret)
      ret.forEach((item: any) => {
        if (item.type == 'branch') return
        let arName = item.name.split('.')
        if (arName.length > 1) {
          item.shortName = '.' + arName.slice(1).join('.')
        } else {
          item.shortName = item.name // Ensure root elements have their name as shortName
        }
      })

      if (!model.api_version && model.custom_apis) {
        const customApis = model.custom_apis.map((api: CustomApi) => {
          let arName = api.name.split('.')
          return {
            ...api,
            isWishlist: true,
            shortName:
              arName.length > 1 ? '.' + arName.slice(1).join('.') : api.name, // Ensure root elements have their name as shortName
          }
        })
        ret = [...customApis, ...ret]
      }

      ret.sort((a: any, b: any) => {
        const aParts = a.name.split('.')
        const bParts = b.name.split('.')

        for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
          if (aParts[i] !== bParts[i]) {
            return (aParts[i] || '').localeCompare(bParts[i] || '')
          }
        }

        return 0
      })
    } else {
      ret = []
    }

    set((state) => ({
      ...state,
      model,
      activeModelApis: ret,
    }))
  },
  setActivePrototype: (prototype) =>
    set((state) => {
      //
      return {
        ...state,
        prototype,
      }
    }),
  refreshModel: async () => {
    const currentModel = get().model
    if (currentModel) {
      await get().setActiveModel(currentModel)
    }
  },
}))

if (process.env.NODE_ENV === 'development') {
  mountStoreDevtool('ModelStore', useModelStore)
}

export default useModelStore
