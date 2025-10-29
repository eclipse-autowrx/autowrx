// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { mountStoreDevtool } from 'simple-zustand-devtools'
import { create } from 'zustand'
import { CustomApi, Model, Prototype, VehicleApi } from '@/types/model.type'
import { parseCvi } from '@/lib/utils'
import { getComputedAPIs } from '@/services/model.service'

const defaultNodeData = {
  type: 'branch',
  children: {},
  description: 'Vehicle',
}

type ModelState = {
  // access?: Token | null
  model?: Model | null
  activeModelApis?: any[]
  activeModelUspSevices?: any[]
  activeModelV2CApis?: any[]
  prototype?: Prototype | null
  supportApis: any[]
  prototypeHasUnsavedChanges: boolean
}

type Actions = {
  setActiveModel: (_: Model) => Promise<void>
  setActivePrototype: (_: Prototype) => void
  refreshModel: () => Promise<void>
  setPrototypeHasUnsavedChanges: (hasChanges: boolean) => void
}

const useModelStore = create<ModelState & Actions>()((set, get) => ({
  model: undefined,
  activeModelApis: [],
  activeModelUspSevices: [],
  activeModelV2CApis: [],
  supportApis: [],
  prototype: undefined,
  prototypeHasUnsavedChanges: false,
  setActiveModel: async (model) => {
    let ret: any
    let supportApis = [
      {
        label: 'COVESA',
        code: 'COVESA',
      },
    ]
    let activeModelUspSevices = []
    let activeModelV2CApis = []
    if (model) {
      // New way
      // console.log("model", model)
      try {
        ret = await getComputedAPIs(model.id)
      } catch (error) {
        ret = { Vehicle: defaultNodeData }
      }

      // Default fallback value
      if (!ret) {
        ret = model.main_api
          ? {
              [model.main_api]: {
                ...defaultNodeData,
                description: model.main_api,
              },
            }
          : { Vehicle: defaultNodeData }
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
      if (Array.isArray(model?.extend?.vehicle_api?.supports)) {
        supportApis = model?.extend?.vehicle_api?.supports
        activeModelUspSevices = model?.extend?.vehicle_api?.USP || []
        activeModelV2CApis = model?.extend?.vehicle_api?.V2C || []
      }
      // Ensure COVESA is always included
      if (!supportApis.some((s) => s.code === 'COVESA')) {
        supportApis.push({ label: 'COVESA', code: 'COVESA' })
      }
      // Ensure COVESA is always included
      if (!supportApis.some((s) => s.code === 'COVESA')) {
        supportApis.push({ label: 'COVESA', code: 'COVESA' })
      }
    } else {
      ret = []
    }

    set((state) => ({
      ...state,
      supportApis,
      activeModelUspSevices,
      activeModelV2CApis,
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
  setPrototypeHasUnsavedChanges: (hasChanges) =>
    set((state) => ({
      ...state,
      prototypeHasUnsavedChanges: hasChanges,
    })),
}))

if (process.env.NODE_ENV === 'development') {
  mountStoreDevtool('ModelStore', useModelStore)
}

export default useModelStore
