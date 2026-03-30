// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { listVSSVersionsService } from '@/services/api.service'
import { useSiteConfig } from '@/utils/siteConfig'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

const ETAS_VSS_VERSIONS = ['v3.0', 'v3.1', 'v3.1.1', 'v4.0', 'v4.1', 'v4.1rc0', 'v4.2', 'v4.2rc0', 'v5.0', 'v5.0rc0']

const useListVSSVersions = () => {
  const query = useQuery({
    queryKey: ['listVSSVersions'],
    queryFn: listVSSVersionsService,
  })
  const predefinedOnly = useSiteConfig('PREDEFINED_VSS_ONLY', true)

  const filteredData = useMemo(() => {
    if (!query.data) return query.data
    if (!predefinedOnly) return query.data
    return (query.data as any[]).filter((v: any) => ETAS_VSS_VERSIONS.includes(v.name))
  }, [query.data, predefinedOnly])

  return { ...query, data: filteredData }
}

export default useListVSSVersions
