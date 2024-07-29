import { listVSSGithubReleasesService } from '@/services/model.service'
import { useQuery } from '@tanstack/react-query'

const useListGithubVSSReleases = () => {
  return useQuery({
    queryKey: ['listVSSReleases'],
    queryFn: listVSSGithubReleasesService,
  })
}

export default useListGithubVSSReleases
