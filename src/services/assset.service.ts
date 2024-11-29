import { serverAxios } from './base'
import { Asset } from '@/types/asset.type'

export const listAssetsService = async () => {
  return (await serverAxios.get('/assets')).data.results
}

export const createAssetService = async (
  name: string,
  type: string,
  data: string,
) => {
  return (await serverAxios.post('/assets', { name, type, data })).data
}

export const deleteAssetService = async (assetId: string) => {
  return (await serverAxios.delete(`/assets/${assetId}`)).data
}
