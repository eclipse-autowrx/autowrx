// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

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
