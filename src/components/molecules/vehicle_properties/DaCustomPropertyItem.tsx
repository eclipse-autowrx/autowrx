// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useState } from 'react'
import { DaSelect, DaSelectItem } from '@/components/atoms/DaSelect'
import { DaInput } from '@/components/atoms/DaInput'
import { CustomPropertyType } from '@/types/property.type'
import { PropertyType } from '@/types/property.type'
import { TbTrash } from 'react-icons/tb'
import { cn } from '@/lib/utils'

interface CustomPropertyProps {
  property: CustomPropertyType
  onUpdate: (updatedProperty: CustomPropertyType) => void
  onDelete: () => void
}

const handleChange = (
  name: keyof CustomPropertyType,
  value: string,
  property: CustomPropertyType,
  onUpdate: (updatedProperty: CustomPropertyType) => void,
) => {
  let updatedValue: string | number | boolean | null = value

  if (name === 'type') {
    // When type changes, reset the value appropriately
    if (value === 'boolean') {
      updatedValue = false
    } else if (value === 'number') {
      updatedValue = 0
    } else if (value === 'null') {
      updatedValue = null
    } else {
      updatedValue = ''
    }
    // Update the property with the new type and reset value
    onUpdate({ ...property, type: value as PropertyType, value: updatedValue })
  } else if (name === 'value') {
    // Handle other changes like name or value based on the current type
    if (property.type === 'boolean') {
      updatedValue = value === 'true'
    } else if (property.type === 'number') {
      updatedValue = Number(value)
    } else if (property.type === 'null') {
      updatedValue = null
    }
    onUpdate({ ...property, value: updatedValue })
  } else {
    onUpdate({ ...property, [name]: value })
  }
}

const DaCustomPropertyItem = ({
  property,
  onUpdate,
  onDelete,
}: CustomPropertyProps) => {
  const [showTrashButton, setShowTrashButton] = useState(false)
  return (
    <div
      className="grid grid-cols-12 space-x-2 items-center mt-1"
      onMouseEnter={() => setShowTrashButton(true)}
      onMouseLeave={() => setShowTrashButton(false)}
    >
      <DaInput
        value={property.name}
        onChange={(e) =>
          handleChange('name', e.target.value, property, onUpdate)
        }
        placeholder="Property Name"
        wrapperClassName="!bg-white"
        inputClassName="!bg-white text-sm"
        className="col-span-5"
      />
      <DaSelect
        value={property.type}
        onValueChange={(type) => {
          // console.log('selected type', type)
          handleChange('type', type as PropertyType, property, onUpdate)
        }}
        wrapperClassName="col-span-2 bg-white  text-sm"
      >
        <DaSelectItem className="text-sm" value="string">
          String
        </DaSelectItem>
        <DaSelectItem className="text-sm" value="number">
          Number
        </DaSelectItem>
        <DaSelectItem className="text-sm" value="boolean">
          Boolean
        </DaSelectItem>
        <DaSelectItem className="text-sm" value="null">
          Null
        </DaSelectItem>
      </DaSelect>

      <div className="flex col-span-5 items-center">
        {property.type === 'boolean' ? (
          <DaSelect
            value={String(property.value)}
            onValueChange={(val) =>
              handleChange('value', val, property, onUpdate)
            }
            wrapperClassName="w-full bg-white text-sm"
          >
            <DaSelectItem className="text-sm" value="true">
              True
            </DaSelectItem>
            <DaSelectItem className="text-sm" value="false">
              False
            </DaSelectItem>
          </DaSelect>
        ) : property.type === 'null' ? (
          <DaInput
            disabled
            value="null"
            placeholder="null"
            wrapperClassName="!bg-white"
            inputClassName="!bg-white w-full text-sm"
            className="col-span-5 w-full"
          />
        ) : (
          <DaInput
            type={property.type === 'number' ? 'number' : 'text'}
            value={String(property.value)}
            onChange={(e) =>
              handleChange('value', e.target.value, property, onUpdate)
            }
            placeholder="Value"
            wrapperClassName="!bg-white"
            inputClassName="!bg-white w-full text-sm"
            className="col-span-5 w-full"
          />
        )}

        <div
          onClick={onDelete}
          className={cn(
            'ml-2 text-da-gray-medium hover:text-red-500 transition-opacity ease-in-out duration-200 cursor-pointer',
            showTrashButton ? 'opacity-100' : 'opacity-100',
          )}
        >
          <TbTrash className="size-6" />
        </div>
      </div>
    </div>
  )
}

export default DaCustomPropertyItem
