// useInstanceCfg hook stub
import { useQuery } from '@tanstack/react-query'

export const usePolicy = () => {
  return ''
}

export const useInstanceCfg = () => {
  return useQuery({
    queryKey: ['instance-cfg'],
    queryFn: async () => {
      return {}
    },
  })
}
