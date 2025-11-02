// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useQuery } from '@tanstack/react-query'
import { loadMarketWidgets } from '@/services/widget.service'

const useListMarketplaceWidgets = () => {
  return useQuery({
    queryKey: ['listMarketplaceAddOns'],
    queryFn: () => loadMarketWidgets(),
  })
}

export default useListMarketplaceWidgets

