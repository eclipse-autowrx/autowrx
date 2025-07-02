// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import create from 'zustand'

const useGenAIWizardStore = create(() => ({
  wizardPrototype: {
    modelName: '',
    name: '',
  },
}))

export default useGenAIWizardStore
