// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useQuery } from '@tanstack/react-query'
import { listModelPrototypes } from '@/services/prototype.service'

const useListModelPrototypes = (model_id: string) => {
  return useQuery({
    queryKey: ['listModelPrototypes', model_id],
    queryFn: () => listModelPrototypes(model_id),
  })
}

export default useListModelPrototypes
