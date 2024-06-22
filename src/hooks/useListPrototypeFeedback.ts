import { useQuery } from '@tanstack/react-query'
import { listPrototypeFeedback } from '@/services/feedback.service'

const useListPrototypeFeedback = (prototypeId: string, page: number) => {
  return useQuery({
    queryKey: ['listPrototypeFeedback', prototypeId],
    queryFn: () => listPrototypeFeedback(prototypeId, page),
  })
}

export default useListPrototypeFeedback
