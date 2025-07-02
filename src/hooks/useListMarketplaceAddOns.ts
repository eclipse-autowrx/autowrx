// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useQuery } from '@tanstack/react-query'
import { fetchMarketAddOns } from '@/services/widget.service'

const useListMarketplaceAddOns = (type: string) => {
  return useQuery({
    queryKey: ['listMarketplaceAddOns', type],
    queryFn: () => fetchMarketAddOns(type),
  })
}

export default useListMarketplaceAddOns
