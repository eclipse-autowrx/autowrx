import React, { useState, useEffect } from 'react'
import { DaButton } from '@/components/atoms/DaButton'
import DaKitItem from './DaKitItem'
import { DaKitItemType } from './DaKitItem'
import * as lodash from 'lodash'
import { useAssets } from '@/hooks/useAssets'

const DaKitManager = () => {
  const { useFetchAssets, createAsset, updateAsset } = useAssets()
  const { data: assets, isLoading } = useFetchAssets()

  const [currentKits, setCurrentKits] = useState<DaKitItemType[]>([])
  const [initialKits, setInitialKits] = useState<DaKitItemType[]>([])
  const [assetId, setAssetId] = useState<string | null>(null)

  useEffect(() => {
    if (Array.isArray(assets)) {
      const kitAsset = assets.find((asset) => asset.name === 'UserKits')
      if (kitAsset && kitAsset.id) {
        setAssetId(kitAsset.id)
      } else {
        setAssetId(null)
      }
      if (kitAsset) {
        const kits = JSON.parse(kitAsset.data || '[]')
        setCurrentKits(kits)
        setInitialKits(kits)
      }
    }
  }, [assets])

  const isValidCategory = (category: string) =>
    ['RunTime', 'dreamKIT', 'markerKIT'].includes(category)

  const isKitValid = (kit: DaKitItemType) => {
    return kit.id.trim() !== '' && isValidCategory(kit.category)
  }

  const hasValidChanges = () => {
    const validCurrentKits = currentKits.filter(isKitValid)
    const validInitialKits = initialKits.filter(isKitValid)
    return !lodash.isEqual(validCurrentKits, validInitialKits)
  }

  const addKit = () => {
    setCurrentKits([...currentKits, { category: 'RunTime', id: '' }])
  }

  const updateKit = (index: number, updatedKit: DaKitItemType) => {
    const updatedKits = currentKits.map((kit, i) =>
      i === index ? updatedKit : kit,
    )
    setCurrentKits(updatedKits)
  }

  const deleteKit = (index: number) => {
    setCurrentKits(currentKits.filter((_, i) => i !== index))
  }

  const handleCancelChanges = () => {
    setCurrentKits(lodash.cloneDeep(initialKits))
  }

  const handleSaveKits = async () => {
    const validCurrentKits = currentKits.filter(isKitValid)
    const payload = JSON.stringify(validCurrentKits)

    try {
      if (assetId) {
        // Update existing asset
        await updateAsset.mutateAsync({
          id: assetId,
          payload: { data: payload },
        })
      } else {
        // Create new asset
        await createAsset.mutateAsync({
          name: 'UserKits',
          type: 'KitManagement',
          data: payload,
        })
      }
      setInitialKits(validCurrentKits)
    } catch (error) {
      console.error('Failed to save kits:', error)
    }
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-col space-y-2 max-h-[40vh] overflow-auto pr-2">
        {currentKits.length > 0 ? (
          currentKits.map((kit, index) => (
            <DaKitItem
              key={index}
              item={kit}
              onUpdate={(updatedKit) => updateKit(index, updatedKit)}
              onDelete={() => deleteKit(index)}
            />
          ))
        ) : (
          <div className="flex h-10 w-full mt-1 px-4 py-2 text-sm items-center bg-white border rounded-md">
            There are no kits yet.
          </div>
        )}
      </div>
      <div className="flex mt-4 w-full items-center justify-between">
        <DaButton
          variant="outline-nocolor"
          onClick={addKit}
          className="w-20"
          size="sm"
        >
          Add Kit
        </DaButton>
        <div className="flex items-center space-x-2">
          <DaButton
            variant="outline-nocolor"
            onClick={handleCancelChanges}
            disabled={!hasValidChanges()}
            size="sm"
          >
            Discard Changes
          </DaButton>
          <DaButton
            variant="solid"
            onClick={handleSaveKits}
            disabled={!hasValidChanges()}
            className="w-20"
            size="sm"
          >
            Save
          </DaButton>
        </div>
      </div>
    </div>
  )
}

export default DaKitManager
