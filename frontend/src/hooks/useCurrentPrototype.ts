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
import { serverAxios } from '@/services/base'

const fetchPrototypeById = async (prototypeId: string): Promise<Prototype> => {
  const response = await serverAxios.get(`/prototype/${prototypeId}`)
  return response.data
}

const useCurrentPrototype = () => {
  const { prototypeId } = useParams<{ prototypeId: string }>()

  return useQuery<Prototype>({
    queryKey: ['prototype', prototypeId],
    queryFn: () => fetchPrototypeById(prototypeId!),
    enabled: !!prototypeId,
  })
}

export default useCurrentPrototype
