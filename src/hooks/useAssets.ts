import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listAssetsService,
  createAssetService,
  deleteAssetService,
  updateAssetService,
  shareMyAsset,
  removeUserFromShareList,
  getAssetById
} from '@/services/assset.service'
import { Asset } from '@/types/asset.type'

export const ASSET_QUERY_KEY = {
  assets: ['assets'],
}

export const useAssets = () => {
  const queryClient = useQueryClient()

  // Fetch assets
  const useFetchAssets = () =>
    useQuery<Asset[]>({
      queryKey: ASSET_QUERY_KEY.assets,
      queryFn: listAssetsService,
    })


  // Create a new asset
  const createAsset = useMutation({
    mutationFn: (newAsset: { name: string; type: string; data: string }) =>
      createAssetService(newAsset),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSET_QUERY_KEY.assets })
    },
  })

  // Delete an asset
  const deleteAsset = useMutation({
    mutationFn: (id: string) => deleteAssetService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSET_QUERY_KEY.assets })
    },
  })

  // Update an asset
  const updateAsset = useMutation({
    mutationFn: (updatedAsset: {
      id: string
      payload: Partial<{ name: string; type: string; data: string }>
    }) => updateAssetService(updatedAsset.id, updatedAsset.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSET_QUERY_KEY.assets })
    },
  })

  return {
    useFetchAssets,
    createAsset,
    deleteAsset,
    updateAsset,
    shareMyAsset,
    removeUserFromShareList,
    getAssetById,
  }
}
