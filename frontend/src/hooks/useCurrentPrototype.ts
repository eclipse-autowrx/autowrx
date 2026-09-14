// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useQuery } from '@tanstack/react-query'
import { useParams, useSearchParams } from 'react-router-dom'
import { Prototype } from '@/types/model.type'
import { getPrototype } from '@/services/prototype.service'
import useAuthStore from '@/stores/authStore'

const useCurrentPrototype = () => {
  const { prototype_id: pathPrototypeId } = useParams<{
    prototype_id: string
  }>()
  const [searchParams] = useSearchParams()
  const prototype_id =
    pathPrototypeId || searchParams.get('prototype_id') || undefined
  // Gate on auth bootstrap so the fetch carries the access token (#665, same pattern
  // as useSelfProfile).
  const [authBootstrapped, accessToken] = useAuthStore((state) => [
    state.authBootstrapped,
    state.access?.token,
  ])

  return useQuery<Prototype>({
    queryKey: ['prototype', prototype_id],
    queryFn: async () => {
      const prototype = await getPrototype(prototype_id!)
      if (!prototype) {
        throw new Error('Prototype not found')
      }
      return prototype
    },
    enabled: !!prototype_id && authBootstrapped,
  })
}

export default useCurrentPrototype
