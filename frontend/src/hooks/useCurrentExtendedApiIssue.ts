// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useQuery } from '@tanstack/react-query'
import useCurrentExtendedApi from './useCurrentExtendedApi'
import { getIssueByApiService } from '@/services/issue.service'

const useCurrentExtendedApiIssue = () => {
  const { data } = useCurrentExtendedApi()
  return useQuery({
    queryKey: ['current-extended-api-issue', data?.id],
    queryFn: () => getIssueByApiService(data?.id!),
    enabled: !!data?.id,
    retry: false,
  })
}

export default useCurrentExtendedApiIssue
