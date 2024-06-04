import React, { useCallback } from 'react'
import clsx from 'clsx'
import { Property } from '@/types/property.type'

type ViewVehiclePropertyProps = {
  vehicleCategory?: string
  customProperties?: Property[]
  textSize?: string
}

const DaViewVehicleProperty = ({
  vehicleCategory,
  customProperties,
  textSize = 'da-label-small',
}: ViewVehiclePropertyProps) => {
  const getDisplayValue = useCallback(
    (value: string, type: Property['type']) => {
      switch (type) {
        case 'string':
          return `"${value}"`
        case 'number':
          return value
        case 'boolean':
          return value
        default:
          return 'null'
      }
    },
    [],
  )

  if (!vehicleCategory) {
    return (
      <div
        className={clsx(
          'flex italic items-center justify-center py-6 text-da-gray-medium',
          textSize,
        )}
      >
        {'<'}Properties not set yet{'>'}
      </div>
    )
  }

  return (
    <div
      className={clsx('space-y-1 pb-1 h-full text-da-gray-medium', textSize)}
    >
      <p className="font-bold">
        Category: <span>{vehicleCategory}</span>
      </p>
      {customProperties &&
        customProperties.map((property, index) => (
          <p key={index}>
            {property.name}:{' '}
            <span>{getDisplayValue(property.value, property.type)}</span>
          </p>
        ))}
    </div>
  )
}

export default DaViewVehicleProperty
