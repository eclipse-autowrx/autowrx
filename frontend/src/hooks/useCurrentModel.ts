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
import { serverAxios } from '@/services/base'

const fetchModelById = async (modelId: string): Promise<Model> => {
  const response = await serverAxios.get(`/model/${modelId}`)
  return response.data
}

const useCurrentModel = () => {
  const { modelId } = useParams<{ modelId: string }>()

  return useQuery<Model>({
    queryKey: ['model', modelId],
    queryFn: () => fetchModelById(modelId!),
    enabled: !!modelId,
  })
}

export default useCurrentModel
