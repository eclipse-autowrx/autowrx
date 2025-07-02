// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useParams } from 'react-router-dom'
import useGetPrototype from './useGetPrototype'

const useCurrentPrototype = () => {
  const { prototype_id } = useParams()
  return useGetPrototype(prototype_id || '')
}

export default useCurrentPrototype
