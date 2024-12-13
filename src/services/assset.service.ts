import { serverAxios } from './base'
import { Asset } from '@/types/asset.type'

// Type for asset creation/update payload
interface AssetPayload {
  name: string
  type: string
  data: string
}

// List all assets
export const listAssetsService = async (): Promise<Asset[]> => {
  const response = await serverAxios.get('/assets')
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

export const shareMyAsset = async (assetId: string, payload: any): Promise<any> => {
  const response = await serverAxios.post(`/assets/${assetId}/permissions`, payload)
  return response.data
}

export const getAssetById = async (assetId: string): Promise<any> => {
  const response = await serverAxios.get(`/assets/${assetId}`)
  return response.data
}


