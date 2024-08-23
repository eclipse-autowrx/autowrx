import { searchUserByEmailService } from '@/services/search.service'
import { useQuery } from '@tanstack/react-query'

const useSearchUserByEmail = (email?: string) => {
  return useQuery({
    queryKey: ['searchUserByEmail', email],
    queryFn: async () => await searchUserByEmailService(email || ''),
    retry: 0,
  })
}

export default useSearchUserByEmail
