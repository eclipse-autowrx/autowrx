// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/atoms/select'
import { Button } from '@/components/atoms/button'
import DaCustomPropertyItem from '../vehicle_properties/DaCustomPropertyItem'
import { CustomPropertyType } from '@/types/property.type'
import * as lodash from 'lodash'
import { vehicleClasses } from '@/data/vehicle_classification'
import { TbPlus } from 'react-icons/tb'

interface FormUpdateVehiclePropertiesProps {
  customProperties: CustomPropertyType[]
  setCustomProperties: React.Dispatch<
    React.SetStateAction<CustomPropertyType[]>
  >
  vehicleCategory: string
  setVehicleCategory: React.Dispatch<React.SetStateAction<string>>
  onSaveProperties: () => void
}

const isPropertyEmpty = (property: CustomPropertyType) => {
  const isValueEmpty =
    typeof property.value === 'string'
      ? property.value.trim() === ''
      : property.value === null || property.value === undefined

  const isNameEmpty =
    typeof property.name === 'string'
      ? property.name.trim() === ''
      : !property.name // If it's not a string, consider it empty

  return isNameEmpty && isValueEmpty
}

const FormUpdateVehicleProperties = ({
  customProperties,
  setCustomProperties,
  onSaveProperties,
  setVehicleCategory,
  vehicleCategory,
}: FormUpdateVehiclePropertiesProps) => {
  // Initialize the initial values once when the component mounts
  const [initialCustomProperties, setInitialCustomProperties] = useState<
    CustomPropertyType[]
  >(lodash.cloneDeep(customProperties))

  const [initialVehicleType, setInitialVehicleType] =
    useState<string>(vehicleCategory)

  // Reset initial values when new props are received (optional)
  useEffect(() => {
    setInitialCustomProperties(lodash.cloneDeep(customProperties))
    setInitialVehicleType(vehicleCategory)
  }, [])

  const addCustomProperty = () => {
    setCustomProperties([
      ...customProperties,
      { name: '', type: 'string', value: '' },
    ])
  }

  const updateCustomProperty = (
    index: number,
    updatedProperty: CustomPropertyType,
  ) => {
    setCustomProperties(
      customProperties.map((property, i) =>
        i === index ? updatedProperty : property,
      ),
    )
  }

  const deleteCustomProperty = (index: number) => {
    setCustomProperties(customProperties.filter((_, i) => i !== index))
  }

  // Filter out empty properties for accurate change detection
  const filteredCurrentProperties = (customProperties ?? []).filter(
    (property) => !isPropertyEmpty(property),
  )

  const filteredInitialProperties = initialCustomProperties.filter(
    (property) => !isPropertyEmpty(property),
  )

  const hasChanges =
    initialVehicleType !== vehicleCategory || // Compare the initial and current vehicle categories
    !lodash.isEqual(filteredInitialProperties, filteredCurrentProperties) // Compare initial and current custom properties

  // Reset to initial values when "Cancel" is clicked
  const handleCancelChanges = () => {
    setCustomProperties(lodash.cloneDeep(initialCustomProperties))
    setVehicleCategory(initialVehicleType)
  }

  // Save changes and reset the initial state variables
  const handleSaveProperties = () => {
    onSaveProperties()
    setInitialCustomProperties(lodash.cloneDeep(customProperties))
    setInitialVehicleType(vehicleCategory)
  }

  const vehicleTypes = vehicleClasses.map((vehicleClass) => vehicleClass.name)

  return (
    <div className="flex flex-col mt-4">
      <p className="text-base font-semibold">Category</p>
      <Select
        value={vehicleCategory}
        onValueChange={setVehicleCategory}
      >
        <SelectTrigger className="bg-background rounded-lg mt-1 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {vehicleTypes.map((type) => (
            <SelectItem className="text-sm" key={type} value={type}>
              {type}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <p className="text-base font-semibold mt-6">
        Custom Properties
      </p>

      <div className="flex flex-col space-y-2 max-h-[40vh] overflow-auto">
        {customProperties && customProperties.length > 0 ? (
          customProperties.map((property, index) => (
            <DaCustomPropertyItem
              key={index}
              property={property}
              onUpdate={(updatedProperty) =>
                updateCustomProperty(index, updatedProperty)
              }
              onDelete={() => deleteCustomProperty(index)}
            />
          ))
        ) : (
          <div className="flex text-sm h-10 w-full mt-1 px-4 py-2 items-center bg-background border rounded-md">
            There's no custom properties yet.
          </div>
        )}
      </div>

      <Button
        variant="outline"
        onClick={addCustomProperty}
        className="w-full mt-2"
        size="sm"
      >
        <TbPlus className="size-4 mr-1" />
        Add Property
      </Button>

      <div className="flex mt-6 w-full items-center justify-between">
        <div className="flex w-full justify-end items-center space-x-2">
          <Button
            variant="outline"
            onClick={handleCancelChanges}
            disabled={!hasChanges}
            size="sm"
          >
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleSaveProperties}
            disabled={!hasChanges}
            className="w-20"
            size="sm"
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}

export default FormUpdateVehicleProperties
