// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useEffect, useState } from 'react'
import { DaTableProperty } from '../DaTableProperty'
import { Button } from '@/components/atoms/button'
import { TbChevronDown, TbChevronRight } from 'react-icons/tb'
import { cn } from '@/lib/utils'
import { Property } from '@/types/property.type'
import DaDialog from '@/components/molecules/DaDialog'
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
        <h3 className="text-lg font-medium text-primary">
          Vehicle Properties
        </h3>
        <div>
          <Button
            className="text-primary mr-2"
            variant="outline"
            size="sm"
            onClick={() => setIsOpenUpdateForm(true)}
          >
            Update property
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleVisibility}
          >
            <div className="pr-1 w-12">{isVisible ? 'Hide' : 'Show'}</div>
            {isVisible ? <TbChevronRight /> : <TbChevronDown />}
          </Button>
        </div>
      </div>
      {isVisible && (
        <div className="flex flex-col mt-4 border-t pt-2">
          <p className="text-sm font-semibold mr-2">
            Category: {category}
          </p>

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
            <p className="text-sm text-muted-foreground">No properties available.</p>
          )}
        </div>
      )}
      <DaDialog
        open={isOpenUpdateForm}
        onOpenChange={setIsOpenUpdateForm}
        trigger={<></>}
        dialogTitle="Update vehicle properties"
        className="max-w-[800px]"
      >
        <div className="flex flex-col h-fit max-h-[90vh] w-full">
          <div className="rounded-lg text-sm flex h-full w-full flex-col bg-background">
            <FormUpdateVehicleProperties
              onSaveProperties={() => {
                handleSave()
              }}
              customProperties={vehicleProperties}
              setCustomProperties={setVehicleProperties}
              vehicleCategory={vehicleCategory}
              setVehicleCategory={setVehicleCategory}
            />
          </div>
        </div>
      </DaDialog>
    </div>
  )
}

export default DaVehicleProperties
