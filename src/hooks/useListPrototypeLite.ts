// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useQuery } from '@tanstack/react-query'
import { listAllPrototypes } from '@/services/prototype.service'

const useListPrototypeLite = () => {
  return useQuery({
    queryKey: ['listPrototypeLite', listAllPrototypes],
    queryFn: listAllPrototypes,
  })
}
export default useListPrototypeLite
