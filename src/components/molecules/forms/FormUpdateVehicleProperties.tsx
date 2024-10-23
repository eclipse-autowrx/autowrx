import React, { useState, useEffect } from 'react'
import { DaSelect, DaSelectItem } from '@/components/atoms/DaSelect'
import { DaButton } from '@/components/atoms/DaButton'
import DaCustomPropertyItem from '../vehicle_properties/DaCustomPropertyItem'
import { CustomPropertyType } from '@/types/property.type'
import DaText from '@/components/atoms/DaText'
import * as lodash from 'lodash'
import { vehicleClasses } from '@/data/vehicle_classification'

interface FormUpdateVehiclePropertiesProps {
  customProperties: CustomPropertyType[]
  setCustomProperties: React.Dispatch<
    React.SetStateAction<CustomPropertyType[]>
  >
  vehicleCategory: string
  setVehicleCategory: React.Dispatch<React.SetStateAction<string>>
  onSaveRequirements: () => void
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
  onSaveRequirements,
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

  // Reset to initial values when "Discard Changes" is clicked
  const handleCancelChanges = () => {
    setCustomProperties(lodash.cloneDeep(initialCustomProperties))
    setVehicleCategory(initialVehicleType)
  }

  // Save changes and reset the initial state variables
  const handleSaveRequirements = () => {
    onSaveRequirements()
    setInitialCustomProperties(lodash.cloneDeep(customProperties))
    setInitialVehicleType(vehicleCategory)
  }

  const vehicleTypes = vehicleClasses.map((vehicleClass) => vehicleClass.name)

  return (
    <div className="flex flex-col mt-4">
      <DaText variant="regular-bold">Category</DaText>
      <DaSelect
        value={vehicleCategory}
        onValueChange={setVehicleCategory}
        wrapperClassName="bg-gray-100 rounded-lg mt-1"
      >
        {vehicleTypes.map((type) => (
          <DaSelectItem key={type} value={type}>
            {type}
          </DaSelectItem>
        ))}
      </DaSelect>

      <DaText variant="regular-bold" className="mt-6">
        Custom Properties
      </DaText>

      <div className="flex flex-col space-y-2">
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
          <div className="flex h-10 w-full mt-1 px-4 py-2 items-center bg-gray-100 border rounded-md">
            There's no custom properties yet.
          </div>
        )}
      </div>

      <div className="flex mt-4 w-full items-center justify-between">
        <DaButton
          variant="outline-nocolor"
          onClick={addCustomProperty}
          className=" w-fit"
        >
          Add Property
        </DaButton>
        <div className="flex items-center space-x-2">
          <DaButton
            variant="outline-nocolor"
            onClick={handleCancelChanges}
            disabled={!hasChanges} // Disable if there are no changes to discard
          >
            Discard Changes
          </DaButton>
          <DaButton
            variant="solid"
            onClick={handleSaveRequirements}
            disabled={!hasChanges} // Disable the save button when no changes are detected
          >
            Save
          </DaButton>
        </div>
      </div>
    </div>
  )
}

export default FormUpdateVehicleProperties
