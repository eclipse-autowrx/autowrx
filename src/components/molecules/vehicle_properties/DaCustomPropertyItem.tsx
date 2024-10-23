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
  } else {
    // Handle other changes like name or value based on the current type
    if (property.type === 'boolean') {
      updatedValue = value === 'true'
    } else if (property.type === 'number') {
      updatedValue = Number(value)
    } else if (property.type === 'null') {
      updatedValue = null
    }
    onUpdate({ ...property, [name]: updatedValue })
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
        wrapperClassName="!bg-gray-100"
        inputClassName="!bg-gray-100"
        className="col-span-5"
      />
      <DaSelect
        value={property.type}
        onValueChange={(type) => {
          // console.log('selected type', type)
          handleChange('type', type as PropertyType, property, onUpdate)
        }}
        wrapperClassName="col-span-2 bg-gray-100"
      >
        <DaSelectItem value="string">String</DaSelectItem>
        <DaSelectItem value="number">Number</DaSelectItem>
        <DaSelectItem value="boolean">Boolean</DaSelectItem>
        <DaSelectItem value="null">Null</DaSelectItem>
      </DaSelect>

      <div className="flex col-span-5 items-center">
        {property.type === 'boolean' ? (
          <DaSelect
            value={String(property.value)}
            onValueChange={(val) =>
              handleChange('value', val, property, onUpdate)
            }
            wrapperClassName="w-full bg-gray-100"
          >
            <DaSelectItem value="true">True</DaSelectItem>
            <DaSelectItem value="false">False</DaSelectItem>
          </DaSelect>
        ) : property.type === 'null' ? (
          <DaInput
            disabled
            value="null"
            placeholder="null"
            wrapperClassName="!bg-gray-100"
            inputClassName="!bg-gray-100 w-full"
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
            wrapperClassName="!bg-gray-100"
            inputClassName="!bg-gray-100 w-full"
            className="col-span-5 w-full"
          />
        )}

        <div
          onClick={onDelete}
          className={cn(
            'ml-2 text-red-500 transition-opacity ease-in-out duration-200 cursor-pointer',
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
