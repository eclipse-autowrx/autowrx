// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { Prototype } from '@/types/model.type'
import { getPrototype } from '@/services/prototype.service'

const useCurrentPrototype = () => {
  const { prototype_id } = useParams<{ prototype_id: string }>()

  return useQuery<Prototype>({
    queryKey: ['prototype', prototype_id],
    queryFn: async () => {
      const prototype = await getPrototype(prototype_id!)
      if (!prototype) {
        throw new Error('Prototype not found')
      }
      return prototype
    },
    enabled: !!prototype_id,
  })
}

export default useCurrentPrototype
