import React, { useState, useRef, useEffect } from 'react'
import { DaSelect, DaSelectItem } from '@/components/atoms/DaSelect'
import { DaButton } from '@/components/atoms/DaButton'
import DaCustomPropertyItem from '../vehicle_properties/DaCustomPropertyItem'
import { CustomPropertyType } from '@/types/property.type'
import DaText from '@/components/atoms/DaText'
import * as lodash from 'lodash'

interface FormUpdateVehiclePropertiesProps {
  customProperties: CustomPropertyType[]
  setCustomProperties: React.Dispatch<
    React.SetStateAction<CustomPropertyType[]>
  >
  onSaveRequirements: () => void
}

const isPropertyEmpty = (property: CustomPropertyType) => {
  const isValueEmpty =
    typeof property.value === 'string'
      ? property.value.trim() === ''
      : property.value === null || property.value === undefined

  return (property.name?.trim() === '' || !property.name) && isValueEmpty
}

const FormUpdateVehicleProperties = ({
  customProperties,
  setCustomProperties,
  onSaveRequirements,
}: FormUpdateVehiclePropertiesProps) => {
  const [vehicleType, setVehicleType] = useState('Passenger cars')

  // Initial refs to store initial values of vehicleType and customProperties
  const initialCustomPropertiesRef = useRef<CustomPropertyType[] | null>(null)
  const initialVehicleTypeRef = useRef<string | null>(null)

  // Populate the refs on the first render
  useEffect(() => {
    if (
      initialCustomPropertiesRef.current === null &&
      Array.isArray(customProperties) && // Ensure it's an array
      customProperties.length > 0
    ) {
      initialCustomPropertiesRef.current = lodash.cloneDeep(customProperties)
      initialVehicleTypeRef.current = vehicleType
    }
  }, [customProperties, vehicleType])

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

  const filteredInitialProperties = initialCustomPropertiesRef.current
    ? initialCustomPropertiesRef.current.filter(
        (property) => !isPropertyEmpty(property),
      )
    : []

  const hasChanges =
    initialCustomPropertiesRef.current !== null &&
    (initialVehicleTypeRef.current !== vehicleType ||
      !lodash.isEqual(filteredInitialProperties, filteredCurrentProperties))

  // Reset to initial values when "Discard Changes" is clicked
  const handleCancelChanges = () => {
    if (initialCustomPropertiesRef.current) {
      setCustomProperties(lodash.cloneDeep(initialCustomPropertiesRef.current))
      setVehicleType(initialVehicleTypeRef.current!)
    }
  }

  // Save changes and reset the initial references
  const handleSaveRequirements = () => {
    onSaveRequirements()
    initialCustomPropertiesRef.current = lodash.cloneDeep(customProperties)
    initialVehicleTypeRef.current = vehicleType
  }

  const vehicleTypes = ['Passenger cars', 'Trucks', 'Buses', 'Motorcycles']

  return (
    <div className="flex flex-col mt-4">
      <DaText variant="regular-bold">Category</DaText>
      <DaSelect
        value={vehicleType}
        onValueChange={setVehicleType}
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
