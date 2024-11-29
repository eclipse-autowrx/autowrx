import React, { useState, useEffect } from 'react'
import { DaButton } from '@/components/atoms/DaButton'
import DaKitItem from './DaKitItem'
import { DaKitItemType } from './DaKitItem'
import * as lodash from 'lodash'
import { useAssets } from '@/hooks/useAssets'
import { Asset } from '@/types/asset.type'

const DaKitManager = () => {
  const validCategories = ['RunTime', 'dreamKIT', 'markerKIT'] as const

  const { useFetchAssets, createAsset, deleteAsset } = useAssets()
  const { data: assets, isLoading } = useFetchAssets() // Fetch assets using the updated useAssets hook

  const isValidCategory = (
    category: string,
  ): category is (typeof validCategories)[number] => {
    return validCategories.includes(category as any)
  }

  const isKitValid = (kit: DaKitItemType) => {
    return kit.id.trim() !== '' && isValidCategory(kit.category)
  }
  // Calculate kits from assets
  const calculatedKits = Array.isArray(assets)
    ? assets
        .filter((asset: Asset) => isValidCategory(asset.type))
        .map((asset: Asset) => ({
          id: asset.name.split('-')[1] || '',
          category: asset.type as 'RunTime' | 'dreamKIT' | 'markerKIT',
          assetId: asset.id,
        }))
    : []

  const [currentKits, setCurrentKits] =
    useState<DaKitItemType[]>(calculatedKits)

  const [initialKits, setInitialKits] =
    useState<DaKitItemType[]>(calculatedKits)

  useEffect(() => {
    if (!lodash.isEqual(initialKits, calculatedKits)) {
      setCurrentKits(calculatedKits)
      setInitialKits(calculatedKits)
    }
  }, [calculatedKits, initialKits])

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

    // Find newly added kits
    const newKits = validCurrentKits.filter(
      (kit) =>
        !initialKits.some(
          (initialKit) =>
            initialKit.id === kit.id && initialKit.category === kit.category,
        ),
    )

    // Find deleted kits
    const deletedKits = initialKits.filter(
      (initialKit) =>
        !validCurrentKits.some(
          (kit) =>
            kit.id === initialKit.id && kit.category === initialKit.category,
        ),
    )

    try {
      // Delete kits
      await Promise.all(
        deletedKits.map((kit) =>
          kit.assetId
            ? deleteAsset.mutateAsync(kit.assetId)
            : Promise.resolve(),
        ),
      )

      // Create new kits
      await Promise.all(
        newKits.map((kit) =>
          createAsset.mutateAsync({
            name: `${kit.category}-${kit.id}`,
            type: kit.category,
            data: '', // Add other necessary fields if required
          }),
        ),
      )

      // Update initialKits to reflect the new state
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
