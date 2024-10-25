import { CVI_v4_1 } from '@/data/CVI_v4.1'
import { getComputedAPIs } from '@/services/model.service'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useParams } from 'react-router-dom'

const useCurrentModelApi = () => {
  const { model_id } = useParams()
  const { data, ...rest } = useQuery({
    queryKey: ['currentModelApi', model_id],
    queryFn: () => getComputedAPIs(model_id!),
    enabled: !!model_id,
    retry: false,
  })

  const defaultCVI = useMemo(() => JSON.parse(CVI_v4_1), [])

  return { data: data ?? defaultCVI, ...rest }
}

export default useCurrentModelApi
