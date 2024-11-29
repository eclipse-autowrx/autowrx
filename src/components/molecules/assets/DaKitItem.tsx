import { useState } from 'react'
import { DaSelect, DaSelectItem } from '@/components/atoms/DaSelect'
import { DaInput } from '@/components/atoms/DaInput'
import { TbTrash } from 'react-icons/tb'
import { cn } from '@/lib/utils'

export type DaKitItemType = {
  category: 'RunTime' | 'dreamKIT' | 'markerKIT'
  id: string
}

interface DaKitItemProps {
  item: DaKitItemType
  onUpdate: (updatedItem: DaKitItemType) => void
  onDelete: () => void
}

const DaKitItem = ({ item, onUpdate, onDelete }: DaKitItemProps) => {
  const handleChange = (
    name: keyof DaKitItemType,
    value: string,
    currentItem: DaKitItemType,
    onUpdate: (updatedItem: DaKitItemType) => void,
  ) => {
    const updatedItem = { ...currentItem, [name]: value }
    onUpdate(updatedItem)
  }

  return (
    <div className="flex w-full space-x-2 items-center mt-1">
      {/* Category Selector */}
      <DaSelect
        value={item.category}
        onValueChange={(category) =>
          handleChange('category', category, item, onUpdate)
        }
        wrapperClassName="flex bg-white text-sm relative min-w-[130px]"
      >
        <DaSelectItem className="text-sm" value="RunTime">
          RunTime
        </DaSelectItem>
        <DaSelectItem className="text-sm" value="dreamKIT">
          dreamKIT
        </DaSelectItem>
        <DaSelectItem className="text-sm" value="markerKIT">
          markerKIT
        </DaSelectItem>
      </DaSelect>

      {/* ID Input */}
      <DaInput
        value={item.id}
        onChange={(e) => handleChange('id', e.target.value, item, onUpdate)}
        placeholder="Input ID"
        wrapperClassName="!bg-white"
        inputClassName="!bg-white text-sm"
        className="w-full"
      />

      {/* Trash Icon */}
      <div
        onClick={onDelete}
        className={cn(
          'ml-2  transition-opacity ease-in-out duration-200 cursor-pointer',
          'hover:opacity-100 hover:text-red-500',
          'opacity-25 text-gray-500',
        )}
      >
        <TbTrash className="size-6" />
      </div>
    </div>
  )
}

export default DaKitItem
