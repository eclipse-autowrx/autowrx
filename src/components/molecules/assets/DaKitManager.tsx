import React, { useState, useEffect } from 'react'
import { DaSelect, DaSelectItem } from '@/components/atoms/DaSelect'
import { DaButton } from '@/components/atoms/DaButton'
import DaKitItem from './DaKitItem'
import { DaKitItemType } from './DaKitItem'
import DaText from '@/components/atoms/DaText'
import * as lodash from 'lodash'
import { Asset } from '@/types/asset.type'

interface DaKitManagerProps {
  assets: Asset[]
  setAssets: React.Dispatch<React.SetStateAction<Asset[]>>
  onSave: (assets: Asset[]) => void
}

const DaKitManager = ({ assets, setAssets, onSave }: DaKitManagerProps) => {
  const validCategories = ['RunTime', 'dreamKIT', 'markerKIT'] as const

  const isValidCategory = (
    category: string,
  ): category is (typeof validCategories)[number] => {
    return validCategories.includes(category as any)
  }

  const isKitValid = (kit: DaKitItemType) => {
    return kit.id.trim() !== '' && isValidCategory(kit.category)
  }

  const kits = assets
    .filter((asset) => isValidCategory(asset.type)) // Filter assets with valid types
    .map((asset) => ({
      id: asset.name.split('-')[1] || '',
      category: asset.type as 'RunTime' | 'dreamKIT' | 'markerKIT', // Safe cast after filtering
    }))

  const [internalKits, setInternalKits] = useState<DaKitItemType[]>(kits)
  const [initialKits, setInitialKits] = useState<DaKitItemType[]>(
    lodash.cloneDeep(kits),
  )

  useEffect(() => {
    setInitialKits(lodash.cloneDeep(kits))
  }, [assets])

  const hasValidChanges = () => {
    // Filter valid kits from current and initial states
    const validCurrentKits = internalKits.filter(isKitValid)
    const validInitialKits = initialKits.filter(isKitValid)

    // Compare the valid kits for changes
    return !lodash.isEqual(validCurrentKits, validInitialKits)
  }

  const addKit = () => {
    setInternalKits([...internalKits, { category: 'RunTime', id: '' }])
  }

  const updateKit = (index: number, updatedKit: DaKitItemType) => {
    const updatedKits = internalKits.map((kit, i) =>
      i === index ? updatedKit : kit,
    )
    setInternalKits(updatedKits)
  }

  const deleteKit = (index: number) => {
    setInternalKits(internalKits.filter((_, i) => i !== index))
  }

  const handleCancelChanges = () => {
    setInternalKits(lodash.cloneDeep(initialKits))
  }

  const handleSaveKits = () => {
    const updatedAssets: Asset[] = internalKits
      .filter(isKitValid)
      .map((kit) => ({
        name: `${kit.category}-${kit.id}`,
        type: kit.category,
        data: '', // Add other fields as necessary
      }))

    setAssets(updatedAssets)
    onSave(updatedAssets)
    setInitialKits(lodash.cloneDeep(internalKits))
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-col space-y-2 max-h-[40vh] overflow-auto pr-2">
        {internalKits && internalKits.length > 0 ? (
          internalKits.map((kit, index) => (
            <DaKitItem
              key={index}
              item={kit}
              onUpdate={(updatedKit) => updateKit(index, updatedKit)}
              onDelete={() => deleteKit(index)}
            />
          ))
        ) : (
          <div className="flex h-10 w-full mt-1 px-4 py-2 items-center bg-white border rounded-md">
            There's no kits yet.
          </div>
        )}
      </div>
      <div className="flex mt-6 w-full items-center justify-between">
        <DaButton
          variant="outline-nocolor"
          onClick={addKit}
          className="w-fit"
          size="sm"
        >
          Add Kit
        </DaButton>
        <div className="flex items-center space-x-2">
          <DaButton
            variant="outline-nocolor"
            onClick={handleCancelChanges}
            disabled={!hasValidChanges()} // Disable if no valid changes
            size="sm"
          >
            Discard Changes
          </DaButton>
          <DaButton
            variant="solid"
            onClick={handleSaveKits}
            disabled={!hasValidChanges()} // Disable if no valid changes
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
