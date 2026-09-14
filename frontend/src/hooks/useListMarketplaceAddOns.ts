// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { getConfig } from '@/utils/siteConfig'
import { AddOn } from '@/types/addon.type'

const fetchMarketAddOns = async (type: string): Promise<AddOn[]> => {
  try {
    const marketplaceUrl = await getConfig(
      'GENAI_MARKETPLACE_URL',
      'site',
      undefined,
      'https://store-be.digitalauto.tech'
    )

    // If marketplace URL is empty, return empty array (marketplace is hidden)
    if (!marketplaceUrl || marketplaceUrl.trim() === '') {
      return []
    }

    const response = await axios.get(
      `${marketplaceUrl}/package?type=${type}&exposeCredentials=true`,
    )

    if (response.status === 200 && response.data && response.data.data) {
      const parsedAddOns: AddOn[] = response.data.data.reduce(
        (addons: AddOn[], addon: any) => {
          if (addon.version && typeof addon.version === 'object') {
            const parsedAddon: AddOn = {
              id: addon.version._id,
              type: addon.type as AddOn['type'],
              name: addon.name,
              image_file: addon.thumbnail,
              description: addon.shortDesc,
              apiKey: addon.team?.accessKey
                ? `${addon.team?.accessKey}@${addon.team?.secretKey}`
                : addon.version.apiKey,
              endpointUrl: addon.version.endpointUrl,
              samples: addon.version.samples,
              rating: addon.rating,
              team: addon.team ? addon.team.name : null,
              method: addon.version.method || 'POST',
              requestField: addon.version.requestField || 'prompt',
              responseField: addon.version.responseField || 'data',
              customPayload: (prompt: string) => ({ prompt }),
            }
            if (parsedAddon.type === type) {
              addons.push(parsedAddon)
            }
          }
          return addons
        },
        [],
      )

      return parsedAddOns
    }
    return []
  } catch (err) {
    console.error('Error in fetchMarketAddOns:', err)
    return []
  }
}

const useListMarketplaceAddOns = (type: string) => {
  return useQuery({
    queryKey: ['listMarketplaceAddOns', type],
    queryFn: () => fetchMarketAddOns(type),
  })
}

export default useListMarketplaceAddOns
