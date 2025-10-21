// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useQuery } from '@tanstack/react-query'
import { getSelfService } from '@/services/user.service.ts'

const useSelfProfileQuery = () => {
  return useQuery({ queryKey: ['getSelf'], queryFn: getSelfService })
}

export default useSelfProfileQuery
