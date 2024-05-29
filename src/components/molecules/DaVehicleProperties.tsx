import React, { useState } from 'react'
import { DaText } from '../atoms/DaText'
import { DaTableProperty } from './DaTableProperty'
import { DaButton } from '../atoms/DaButton'
import { TbChevronDown, TbChevronRight, TbChevronUp } from 'react-icons/tb'
import { cn } from '@/lib/utils'

interface VehiclePropertiesProps {
  category: string
  properties: {
    [key: string]: string | number | undefined
  }
  className?: string
}

const DaVehicleProperties = ({
  category,
  properties,
  className,
}: VehiclePropertiesProps) => {
  const [isVisible, setIsVisible] = useState(true)

  const toggleVisibility = () => {
    setIsVisible(!isVisible)
  }

  // Convert properties object to array format for DaTableProperty
  const propertiesArray = Object.entries(properties).map(([key, value]) => ({
    property: key,
    value: value ? String(value) : '',
  }))

  return (
    <div className={cn('border rounded-md py-2 px-4 shadow-sm', className)}>
      <div className="flex justify-between items-center">
        <DaText variant="sub-title" className="text-lg font-medium">
          Vehicle Properties
        </DaText>
        <div>
          <button
            className="text-da-primary-500 mr-4"
            onClick={() => alert('Update property clicked')}
          >
            Update property
          </button>
          <DaButton size={'sm'} onClick={toggleVisibility}>
            <div className="pr-1">{isVisible ? 'Hide' : 'Show'} </div>
            {isVisible ? <TbChevronRight /> : <TbChevronDown />}
          </DaButton>
        </div>
      </div>
      {isVisible && (
        <div className="mt-2">
          <DaText className="font-semibold">Category: {category}</DaText>
          <DaTableProperty properties={propertiesArray} />
        </div>
      )}
    </div>
  )
}

export default DaVehicleProperties
