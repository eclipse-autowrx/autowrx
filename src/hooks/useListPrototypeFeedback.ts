import { useQuery } from '@tanstack/react-query'
import { listPrototypeFeedback } from '@/services/feedback.service'

const useListPrototypeFeedback = (prototypeId: string) => {
  return useQuery({
    queryKey: ['listPrototypeFeedback', prototypeId],
    queryFn: () => listPrototypeFeedback(prototypeId),
  })
}

export default useListPrototypeFeedback
