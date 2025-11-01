// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { Model } from '@/types/model.type'
import { getModel } from '@/services/model.service'

const useCurrentModel = () => {
  const { model_id } = useParams<{ model_id: string }>()

  return useQuery<Model>({
    queryKey: ['model', model_id],
    queryFn: () => getModel(model_id!),
    enabled: !!model_id,
  })
}

export default useCurrentModel
