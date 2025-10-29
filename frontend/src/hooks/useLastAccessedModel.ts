// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import useGetModel from './useGetModel'

const LAST_ACCESSED_KEY = 'lastAccessedModelId'

const useLastAccessedModel = () => {
  const lastAccessedModelId = localStorage.getItem(LAST_ACCESSED_KEY)
  const { data: lastAccessedModel, isLoading: isRetrievingLastAccessedModel } =
    useGetModel(lastAccessedModelId)

  const setLastAccessedModel = (modelId: string) => {
    localStorage.setItem(LAST_ACCESSED_KEY, modelId)
  }

  return {
    isRetrievingLastAccessedModel,
    lastAccessedModel,
    setLastAccessedModel,
  }
}

export default useLastAccessedModel
