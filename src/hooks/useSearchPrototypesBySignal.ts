// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { searchPrototypesBySignal } from '@/services/search.service'
import { useQuery } from '@tanstack/react-query'

const useSearchPrototypesBySignal = (signal?: string) => {
  return useQuery({
    queryKey: ['searchPrototypesBySignal', signal],
    queryFn: async () => await searchPrototypesBySignal(signal!),
    retry: 0,
    enabled: !!signal,
  })
}

export default useSearchPrototypesBySignal
