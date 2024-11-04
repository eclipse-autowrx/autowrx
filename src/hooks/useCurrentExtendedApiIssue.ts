import { useQuery } from '@tanstack/react-query'
import useCurrentExtendedApi from './useCurrentExtendedApi'
import { getIssueByApiService } from '@/services/issue.service'

const useCurrentExtendedApiIssue = () => {
  const { data } = useCurrentExtendedApi()
  return useQuery({
    queryKey: ['current-extended-api-issue', data?.id],
    queryFn: () => getIssueByApiService(data?.id!),
    enabled: !!data?.id,
    retry: false,
  })
}

export default useCurrentExtendedApiIssue
