// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import clsx from 'clsx'
import DaText from '../atoms/DaText'
import { DaInput } from '../atoms/DaInput'
import { DaSelect, DaSelectItem } from '../atoms/DaSelect'
import { useEffect, useState } from 'react'
import { VehicleApi } from '@/types/model.type'
import { DaTextarea } from '../atoms/DaTextarea'
import DaCheckbox from '../atoms/DaCheckbox'
import { DaButton } from '../atoms/DaButton'
import _ from 'lodash'
import { TbLoader, TbPlus } from 'react-icons/tb'
import { isAxiosError } from 'axios'
import { updateExtendedApi } from '@/services/extendedApis.service'
import { ExtendedApi } from '@/types/api.type'
import useCurrentModel from '@/hooks/useCurrentModel'
import { updateModelService } from '@/services/model.service'
import DaCustomPropertyItem from './vehicle_properties/DaCustomPropertyItem'
import { CustomPropertyType } from '@/types/property.type'

type DaVehicleAPIEditorProps = {
  className?: string
  apiDetails?: Partial<ExtendedApi & VehicleApi>
  onCancel?: () => void
  onUpdate?: (data: Partial<ExtendedApi>) => void | Promise<void>
}

const typeOptions = [
  {
    value: 'branch',
    label: 'Branch',
    bg: 'bg-fuchsia-600',
    text: 'text-white',
  },
  {
    value: 'sensor',
    label: 'Sensor',
    bg: 'bg-emerald-500',
    text: 'text-white',
  },
  {
    value: 'actuator',
    label: 'Actuator',
    bg: 'bg-yellow-500',
    text: 'text-black',
  },
  {
    value: 'attribute',
    label: 'Attribute',
    bg: 'bg-blue-500',
    text: 'text-white',
  },
]

const dataTypes = [
  'uint8',
  'uint16',
  'uint32',
  'int8',
  'int16',
  'int32',
  'float',
  'double',
  'string',
  'boolean',
  'string[]',
  'uint8[]',
]

const defaultData: Partial<ExtendedApi> = {
  apiName: '',
  type: 'branch',
  description: '',
}

const DaVehicleAPIEditor = ({
  className,
  apiDetails,
  onCancel,
  onUpdate,
}: DaVehicleAPIEditorProps) => {
  const [data, setData] =
    useState<Partial<Omit<ExtendedApi, 'custom_properties'>>>(defaultData)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [customProperties, setCustomProperties] = useState<
    CustomPropertyType[]
  >([])

  const { data: model } = useCurrentModel()

  useEffect(() => {
    if (apiDetails) {
      setData({
        ...apiDetails,
        apiName: apiDetails?.name,
      })
      setCustomProperties(Object.values(apiDetails?.custom_properties || {}))
    } else {
      setData(defaultData)
    }
  }, [apiDetails])

  const validateData = (data: Partial<ExtendedApi>) => {
    if (data.type !== 'branch' && !data.datatype) {
      return 'Data Type is required'
    }

    // Validate custom properties
    const propertyNames = new Set<string>()

    for (const prop of customProperties) {
      if (!prop.name.trim()) {
        return 'Property name is required'
      }

      if (propertyNames.has(prop.name.trim())) {
        return 'Duplicate property name found'
      } else {
        propertyNames.add(prop.name.trim())
      }

      switch (prop.type) {
        case 'string':
          if (typeof prop.value !== 'string')
            return `Value for property ${prop.name} must be a string`
          break
        case 'number':
          if (isNaN(Number(prop.value)))
            return `Value for property ${prop.name} must be a number`
          break
        case 'boolean':
          if (typeof prop.value !== 'boolean')
            return `Value for property ${prop.name} must be a boolean`
          break
        case 'null':
          if (prop.value !== null) {
            return `Value for property ${prop.name} must be null`
          }
          break
      }
    }
  }

  const handleAddProperty = () => {
    setCustomProperties((prev) => [
      ...prev,
      {
        name: '',
        value: '',
        type: 'string',
      },
    ])
  }

  const handleUpdateProperty = (
    index: number,
    updatedProperty: CustomPropertyType,
  ) => {
    setCustomProperties((prev) => {
      const updatedProperties = [...prev]
      updatedProperties[index] = updatedProperty
      return updatedProperties
    })
  }

  const handleDeleteProperty = (index: number) => {
    const updatedProperties = [...customProperties]
    updatedProperties.splice(index, 1)
    setCustomProperties(updatedProperties)
  }

  const handleUpdate = async () => {
    try {
      const updateData = {
        type: data.type,
        datatype: data.datatype || null,
        description: data.description || '',
        isWishlist: !!data.isWishlist,
        unit: data.unit || null,
        custom_properties: customProperties.reduce<
          ExtendedApi['custom_properties']
        >(
          (prev, curr) => ({
            ...prev,
            [curr.name]: curr,
          }),
          {},
        ),
      }

      const error = validateData(data)
      if (error) {
        setError(error)
        return
      }
      setError(null)
      setLoading(true)

      if (apiDetails?.id) {
        await updateExtendedApi(updateData, apiDetails.id)
      } else if (model) {
        const custom_apis = [...(model?.custom_apis || [])]
        const index = custom_apis.findIndex((api) => api.name === data.apiName)
        if (index !== -1) {
          custom_apis[index] = {
            ...custom_apis[index],
            ...updateData,
          }
        }
        await updateModelService(model.id, {
          custom_apis,
        })
      }
      await onUpdate?.(updateData)
    } catch (error) {
      if (isAxiosError(error)) {
        setError(error.response?.data?.message || 'Something went wrong')
      } else {
        setError((error as Error).message || 'Something went wrong')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={clsx(
        'flex flex-col h-fit w-full gap-2 rounded-lg bg-da-white',
        className,
      )}
    >
      <div className="flex gap-4 items-center">
        <DaText
          variant="small-bold"
          className="!flex text-da-gray-dark w-[120px] min-w-[120px]"
        >
          Signal *
        </DaText>
        <DaInput
          disabled
          value={data?.apiName}
          //   onChange={(e) => setData({ ...data, name: e.target.value })}
          className="flex-1"
          wrapperClassName="h-8"
          inputClassName="h-6 text-sm"
        />
      </div>

      <div className="flex gap-4 items-center">
        <DaText
          variant="small-bold"
          className="!flex text-da-gray-dark w-[120px] min-w-[120px]"
        >
          Type *
        </DaText>
        <div className="flex-1 text-sm gap-2 flex items-center">
          {typeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setData({ ...data, type: option.value })}
              className={clsx(
                'w-[100px] p-1.5 font-medium rounded-lg',
                data?.type === option.value
                  ? `${option.bg} ${option.text}`
                  : 'bg-gray-100',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {data?.type && data.type !== 'branch' && (
        <>
          <div className="flex gap-4 items-center">
            <DaText
              variant="small-bold"
              className="!flex text-da-gray-dark w-[120px] min-w-[120px]"
            >
              Data Type *
            </DaText>
            <DaSelect
              value={data.datatype || undefined}
              onValueChange={(value) => setData({ ...data, datatype: value })}
              className="h-8 text-sm !w-[120px]"
            >
              {dataTypes.map((dt) => (
                <DaSelectItem className="text-sm" key={dt} value={dt}>
                  {dt}
                </DaSelectItem>
              ))}
            </DaSelect>
          </div>
          <div className="flex gap-4 items-center">
            <DaText
              variant="small-bold"
              className="!flex text-da-gray-dark w-[120px] min-w-[120px]"
            >
              Unit
            </DaText>
            <DaInput
              value={data.unit || undefined}
              onChange={(e) => setData({ ...data, unit: e.target.value })}
              wrapperClassName="h-8"
              inputClassName="h-6 text-sm"
            />
          </div>
        </>
      )}

      <div className="flex gap-4">
        <DaText
          variant="small-bold"
          className="text-da-gray-dark block mt-1 w-[120px] min-w-[120px]"
        >
          Description
        </DaText>
        <DaTextarea
          value={data?.description || ''}
          onChange={(e) => setData({ ...data, description: e.target.value })}
          textareaClassName="!text-sm !px-2 !py-1"
          className="flex-1"
        />
      </div>

      <div className="flex gap-4 items-center">
        <DaText
          variant="small-bold"
          className="text-da-gray-dark block w-[120px] min-w-[120px]"
        >
          Is Wishlist
        </DaText>
        <DaCheckbox
          className="p-0"
          label=""
          checked={data?.isWishlist || false}
          onChange={() => setData({ ...data, isWishlist: !data?.isWishlist })}
        />
      </div>

      <div className="flex flex-col gap-2 mt-2">
        <DaText variant="small-bold" className="text-da-gray-dark">
          Custom Properties
        </DaText>
        <div className="flex flex-col space-y-2 max-h-[40vh] overflow-auto">
          {Object.values(customProperties).length > 0 ? (
            Object.values(customProperties).map((property, index) => (
              <DaCustomPropertyItem
                key={index}
                property={property}
                onUpdate={(updatedProperty) =>
                  handleUpdateProperty(index, updatedProperty)
                }
                onDelete={() => handleDeleteProperty(index)}
              />
            ))
          ) : (
            <div className="flex h-10 w-full mt-1 px-4 py-2 items-center bg-white border rounded-md">
              There's no custom properties yet.
            </div>
          )}
        </div>
      </div>

      <DaButton
        variant="dash"
        onClick={handleAddProperty}
        className="w-full mt-2 mb-2"
        size="sm"
      >
        <TbPlus className="size-4 mr-1" />
        Add Property
      </DaButton>

      {error && (
        <DaText variant="small" className="text-red-500 block mt-2">
          {error}
        </DaText>
      )}

      <div className="flex ml-auto gap-2 mb-2">
        <DaButton
          onClick={onCancel}
          size="sm"
          variant="outline-nocolor"
          className="min-w-16"
          disabled={loading}
        >
          Cancel
        </DaButton>
        <DaButton
          disabled={
            loading ||
            (_.isEqual(data, apiDetails) &&
              _.isEqual(
                customProperties,
                Object.values(apiDetails?.custom_properties || {}),
              ))
          }
          onClick={handleUpdate}
          size="sm"
          className="min-w-16"
        >
          {loading && <TbLoader className="animate-spin w-4 h-4 mr-1" />}
          Update
        </DaButton>
      </div>
    </div>
  )
}

export default DaVehicleAPIEditor
