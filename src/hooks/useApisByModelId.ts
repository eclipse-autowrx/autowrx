// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { getApiByModelIdService } from '@/services/api.service'
import { useQuery } from '@tanstack/react-query'

const useApisByModelId = (modelId?: string) => {
  return useQuery({
    queryKey: ['apis', 'model_id', modelId],
    queryFn: () => getApiByModelIdService(modelId!),
    enabled: !!modelId,
  })
}

export default useApisByModelId
