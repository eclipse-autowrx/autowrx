import { useQuery } from '@tanstack/react-query'
import { listPrototypeFeedback } from '@/services/feedback.service'

const useListPrototypeFeedback = (prototypeId: string, page: number = 1) => {
  return useQuery({
    queryKey: ['listPrototypeFeedback', prototypeId, page],
    queryFn: () => listPrototypeFeedback(prototypeId, page),
    enabled: !!prototypeId,
  })
}

export { useListPrototypeFeedback }
export default useListPrototypeFeedback
