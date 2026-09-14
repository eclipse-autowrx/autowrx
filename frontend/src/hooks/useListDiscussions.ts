// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useQuery } from '@tanstack/react-query'
import { listDiscussionsService } from '@/services/discussion.service'
import { DISCUSSION_REF_TYPE } from '@/types/discussion.type'

const useListDiscussions = (ref: string, refType: DISCUSSION_REF_TYPE, page: number = 1) => {
  return useQuery({
    queryKey: ['listDiscussions', ref, refType, page],
    queryFn: () => listDiscussionsService(ref, refType, page),
    enabled: !!ref,
  })
}

export { useListDiscussions }
export default useListDiscussions
