// useListUsers hook stub
import { useQuery } from '@tanstack/react-query'

export const useListUsers = (options: any = {}) => {
  return useQuery({
    queryKey: ['users', options],
    queryFn: async () => {
      return []
    },
  })
}
