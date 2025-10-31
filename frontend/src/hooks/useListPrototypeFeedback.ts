// useListPrototypeFeedback hook stub
import { useQuery } from '@tanstack/react-query'

export const useListPrototypeFeedback = (prototypeId: string) => {
  return useQuery({
    queryKey: ['prototype-feedback', prototypeId],
    queryFn: async () => {
      return []
    },
    enabled: !!prototypeId, // Only run query when prototypeId is truthy
  })
}
