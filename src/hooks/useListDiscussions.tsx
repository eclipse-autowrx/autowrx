import { listDiscussionsService } from '@/services/discussion.service'
import { DISCUSSION_REF_TYPE } from '@/types/discussion.type'
import { useQuery } from '@tanstack/react-query'

const useListDiscussions = (
  ref: string,
  ref_type: DISCUSSION_REF_TYPE,
  populate?: string,
) => {
  return useQuery({
    queryKey: ['discussions', ref, ref_type],
    queryFn: async () => await listDiscussionsService(ref, ref_type, populate),
  })
}

export default useListDiscussions
