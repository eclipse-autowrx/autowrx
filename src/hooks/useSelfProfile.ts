import { useQuery } from '@tanstack/react-query'
import { getSelfService } from '@/services/user.service'

const useSelfProfileQuery = () => {
  return useQuery({ queryKey: ['getSelf'], queryFn: getSelfService })
}

export default useSelfProfileQuery
