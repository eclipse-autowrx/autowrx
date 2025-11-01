// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { getComputedAPIs } from '@/services/model.service'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'

const useCurrentModelApi = () => {
  const { model_id } = useParams()
  return useQuery({
    queryKey: ['currentModelApi', model_id],
    queryFn: () => getComputedAPIs(model_id!),
    enabled: !!model_id,
    retry: false,
  })
}

export default useCurrentModelApi
