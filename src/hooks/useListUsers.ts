import { listUsersService } from '@/services/user.service'
import { useQuery } from '@tanstack/react-query'

export const useListUsers = () => {
  return useQuery({
    queryKey: ['listUsers'],
    queryFn: listUsersService,
  })
}
