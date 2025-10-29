// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useQuery } from '@tanstack/react-query'
import { getModel } from '@/services/model.service'

const useGetModel = (model_id?: string | null) => {
  return useQuery({
    queryKey: ['getModel', model_id],
    queryFn: () => getModel(model_id!),
    enabled: !!model_id,
  })
}

export default useGetModel
