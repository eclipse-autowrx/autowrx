import { useMemo } from 'react'
import useListGithubVSSReleases from './useListGithubVSSReleases'

const useListVSSVersions = () => {
  const { data: releases, isLoading } = useListGithubVSSReleases()
  const data = useMemo(() => {
    return releases?.map((release) => ({
      name: release.name,
      tag_name: release.tag_name,
      json_asset_url: release.assets.find((asset) =>
        /.*\d+\.json$/.test(asset.name),
      )?.browser_download_url,
    }))
  }, [releases])
  return { data, isLoading }
}

export default useListVSSVersions
