// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { listVSSVersionsService } from '@/services/api.service'
import { useQuery } from '@tanstack/react-query'

const useListVSSVersions = () => {
  return useQuery({
    queryKey: ['listVSSVersions'],
    queryFn: listVSSVersionsService,
  })
}

export default useListVSSVersions
