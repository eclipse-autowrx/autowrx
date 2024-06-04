import React, { useState } from 'react'
import { DaText } from '../atoms/DaText'
import { DaTableProperty } from './DaTableProperty'
import { DaButton } from '../atoms/DaButton'
import { TbChevronDown, TbChevronRight } from 'react-icons/tb'
import { cn } from '@/lib/utils'
import { Property } from '@/types/property.type'

interface VehiclePropertiesProps {
  category: string
  properties: Property[]
  className?: string
}

const DaVehicleProperties = ({
  category,
  properties,
  className,
}: VehiclePropertiesProps) => {
  const [isVisible, setIsVisible] = useState(false)

  const toggleVisibility = () => {
    setIsVisible(!isVisible)
  }

  return (
    <div className={cn('border rounded-md py-2 px-4 shadow-sm', className)}>
      <div className="flex justify-between items-center">
        <DaText variant="sub-title" className="text-lg font-medium">
          Vehicle Properties
        </DaText>
        <div>
          <DaButton
            className="text-da-primary-500 mr-2"
            variant="outline-nocolor"
            size="sm"
            onClick={() => alert('Update property clicked')}
          >
            Update property
          </DaButton>
          <DaButton size="sm" onClick={toggleVisibility}>
            <div className="pr-1 w-12">{isVisible ? 'Hide' : 'Show'}</div>
            {isVisible ? <TbChevronRight /> : <TbChevronDown />}
          </DaButton>
        </div>
      </div>
      {isVisible && (
        <div className="mt-2 flex flex-col">
          <DaText className="font-semibold">Category: {category}</DaText>
          {properties.length > 0 ? (
            <DaTableProperty properties={properties} />
          ) : (
            <DaText>No properties available.</DaText>
          )}
        </div>
      )}
    </div>
  )
}

export default DaVehicleProperties
