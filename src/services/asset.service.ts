import { serverAxios } from './base'
import { Asset, QueryAssetsParams } from '@/types/asset.type'

// Type for asset creation/update payload
interface AssetPayload {
  name: string
  type: string
  data: string
}

// List all assets
export const listAssetsService = async (
  params?: QueryAssetsParams,
): Promise<Asset[]> => {
  if (params?.type) {
    params.type = Array.isArray(params.type)
      ? params.type.join(',')
      : params.type
  }
  const response = await serverAxios.get('/assets', {
    params,
  })
  return response.data.results
}

// Create a new asset
export const createAssetService = async (
  payload: AssetPayload,
): Promise<Asset> => {
  const response = await serverAxios.post('/assets', payload)
  return response.data
}

// Delete an asset by ID
export const deleteAssetService = async (assetId: string): Promise<void> => {
  await serverAxios.delete(`/assets/${assetId}`)
}

// Update an asset by ID
export const updateAssetService = async (
  assetId: string,
  payload: Partial<AssetPayload>,
): Promise<Asset> => {
  const response = await serverAxios.patch(`/assets/${assetId}`, payload)
  return response.data
}

export const shareMyAsset = async (
  assetId: string,
  payload: any,
): Promise<any> => {
  const response = await serverAxios.post(
    `/assets/${assetId}/permissions`,
    payload,
  )
  return response.data
}

export const removeUserFromShareList = async (
  assetId: string,
  userId: string,
  role: string,
): Promise<any> => {
  const response = await serverAxios.delete(
    `/assets/${assetId}/permissions?userId=${userId}&role=${role}`,
  )
  return response.data
}

export const getAssetById = async (assetId: string): Promise<any> => {
  const response = await serverAxios.get(`/assets/${assetId}`)
  return response.data
}
