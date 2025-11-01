// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { getExtendedApi } from '@/services/extendedApis.service'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'

const useCurrentExtendedApi = () => {
  const { model_id, api } = useParams()

  return useQuery({
    queryKey: ['current-extended-api', model_id, api],
    queryFn: () => getExtendedApi(api!, model_id!),
    enabled: !!model_id && !!api,
    retry: false,
  })
}

export default useCurrentExtendedApi
