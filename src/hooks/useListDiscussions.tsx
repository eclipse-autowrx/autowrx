import { listDiscussionsService } from '@/services/discussion.service'
import { useQuery } from '@tanstack/react-query'

const useListDiscussions = (ref: string, ref_type: string) => {
  return useQuery({
    queryKey: ['discussions'],
    queryFn: async () => await listDiscussionsService(ref, ref_type),
  })
}

export default useListDiscussions
