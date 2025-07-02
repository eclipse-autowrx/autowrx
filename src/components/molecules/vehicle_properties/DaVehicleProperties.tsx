// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useEffect, useState } from 'react'
import DaText from '@/components/atoms/DaText'
import { DaTableProperty } from '../DaTableProperty'
import { DaButton } from '@/components/atoms/DaButton'
import { TbChevronDown, TbChevronRight } from 'react-icons/tb'
import { cn } from '@/lib/utils'
import { Property } from '@/types/property.type'
import DaPopup from '@/components/atoms/DaPopup'
import FormUpdateVehicleProperties from '../forms/FormUpdateVehicleProperties'
import { CustomPropertyType } from '@/types/property.type'
import { updateModelService } from '@/services/model.service'
import useCurrentModel from '@/hooks/useCurrentModel'

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
  const { data: model, refetch } = useCurrentModel()
  const [vehicleProperties, setVehicleProperties] = useState<
    CustomPropertyType[]
  >([])
  const [vehicleCategory, setVehicleCategory] =
    useState<string>('Passenger cars')

  const toggleVisibility = () => {
    setIsVisible(!isVisible)
  }

  const handleSave = async () => {
    if (!model) return
    try {
      await updateModelService(model.id, {
        property: JSON.stringify(vehicleProperties),
        vehicle_category: vehicleCategory,
      })
      await refetch()
    } catch (error) {
      console.error('Error updating model properties', error)
    }
  }

  useEffect(() => {
    if (model) {
      setVehicleProperties(JSON.parse(model.property ?? '[]'))
      setVehicleCategory(model.vehicle_category)
    }
  }, [model, isOpenUpdateForm])

  return (
    <div className={cn('border rounded-md p-2', className)}>
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
        <div className="flex flex-col mt-4 border-t pt-2">
          <DaText variant="small-bold" className="font-semibold mr-2">
            Category: {category}
          </DaText>

          {vehicleProperties.length > 0 ? (
            <div className="space-y-1 mt-2">
              {vehicleProperties.map((item, index) => (
                <div className="flex space-x-2 text-sm" key={index}>
                  <div>{item.name}: </div>
                  <div>{item.value}</div>
                </div>
              ))}
            </div>
          ) : (
            <DaText>No properties available.</DaText>
          )}
        </div>
      )}
      <DaPopup
        state={[isOpenUpdateForm, setIsOpenUpdateForm]}
        trigger={<></>}
        onClose={() => setIsOpenUpdateForm(false)}
        closeBtnClassName="top-8 right-8 size-6"
      >
        <div className="flex flex-col h-fit max-h-[90vh] min-w-[600px] lg:min-w-[800px] max-w-[70vw] md:max-w-[55vw] 2xl:max-w-[45vw] p-2">
          <DaText variant="title" className="text-da-primary-500">
            Update vehicle properties
          </DaText>
          <div className="rounded-lgtext-sm flex h-full w-full flex-col bg-white">
            <FormUpdateVehicleProperties
              onSaveProperties={() => {
                // console.log('Properties will be saved: ', vehicleProperties)
                // console.log('Vehicle category will be save: ', vehicleCategory)
                handleSave()
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
