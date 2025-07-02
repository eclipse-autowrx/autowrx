// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { listDiscussionsService } from '@/services/discussion.service'
import { DISCUSSION_REF_TYPE } from '@/types/discussion.type'
import { useQuery } from '@tanstack/react-query'

const useListDiscussions = (
  ref: string,
  ref_type: DISCUSSION_REF_TYPE,
  populate?: string,
) => {
  return useQuery({
    queryKey: ['discussions', ref, ref_type],
    queryFn: async () => await listDiscussionsService(ref, ref_type, populate),
  })
}

export default useListDiscussions
