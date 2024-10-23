import React, { useState } from 'react'
import DaText from '@/components/atoms/DaText'
import { DaTableProperty } from '../DaTableProperty'
import { DaButton } from '@/components/atoms/DaButton'
import { TbChevronDown, TbChevronRight } from 'react-icons/tb'
import { cn } from '@/lib/utils'
import { Property } from '@/types/property.type'
import DaPopup from '@/components/atoms/DaPopup'
import FormUpdateVehicleProperties from '../forms/FormUpdateVehicleProperties'
import { CustomPropertyType } from '@/types/property.type'

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
  const [isOpenUpdateForm, setIsOpenUpdateForm] = useState(false)
  const [vehicleProperties, setVehicleProperties] = useState<
    CustomPropertyType[]
  >([])
  const [vehicleCategory, setVehicleCategory] =
    useState<string>('Passenger cars')

  const toggleVisibility = () => {
    setIsVisible(!isVisible)
  }

  return (
    <div className={cn('border rounded-md py-2 px-4', className)}>
      <div className="flex justify-between items-center">
        <DaText variant="sub-title" className="text-lg font-medium">
          Vehicle Properties
        </DaText>
        <div>
          <DaButton
            className="text-da-primary-500 mr-2"
            variant="outline-nocolor"
            size="sm"
            onClick={() => setIsOpenUpdateForm(true)}
          >
            Update property
          </DaButton>
          <DaButton
            variant="outline-nocolor"
            size="sm"
            onClick={toggleVisibility}
          >
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
      <DaPopup state={[isOpenUpdateForm, setIsOpenUpdateForm]} trigger={<></>}>
        <div className="flex flex-col h-fit max-h-[90vh] min-w-[600px] lg:min-w-[800px] max-w-[70vw] md:max-w-[55vw] 2xl:max-w-[45vw] p-4">
          <DaText variant="title" className="text-da-primary-500">
            Update vehicle properties
          </DaText>
          <div className="rounded-lgtext-sm flex h-full w-full flex-col bg-white">
            <FormUpdateVehicleProperties
              onSaveRequirements={() => {
                console.log('Properties will be saved: ', vehicleProperties)
                console.log('Vehicle category will be save: ', vehicleCategory)
              }}
              customProperties={vehicleProperties}
              setCustomProperties={setVehicleProperties}
              vehicleCategory={vehicleCategory}
              setVehicleCategory={setVehicleCategory}
            />
          </div>
        </div>
      </DaPopup>
    </div>
  )
}

export default DaVehicleProperties
