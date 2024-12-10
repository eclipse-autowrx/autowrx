import _ from 'lodash'
import { create } from 'zustand'

type RefState = {
  value: Record<string, any>
}

type RefActions = {
  setValue: (key: string, value: any) => void
}

const useRefStore = create<RefState & RefActions>()((set) => ({
  value: {},
  setValue: (key: string, value: any) => {
    set((state) => {
      const result = _.cloneDeep(state.value)
      result[key] = value
      return { value: result }
    })
  },
}))

export default useRefStore
