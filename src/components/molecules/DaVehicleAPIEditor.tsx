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
import { TbLoader } from 'react-icons/tb'
import { isAxiosError } from 'axios'
import { updateExtendedApi } from '@/services/extendedApis.service'
import { ExtendedApi } from '@/types/api.type'
import useCurrentModel from '@/hooks/useCurrentModel'
import { updateModelService } from '@/services/model.service'

type DaVehicleAPIEditorProps = {
  className?: string
  apiDetails?: Partial<ExtendedApi & VehicleApi>
  onCancel?: () => void
  onUpdate?: (data: Partial<ExtendedApi>) => void
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
  const [data, setData] = useState<Partial<ExtendedApi>>(defaultData)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { data: model, refetch } = useCurrentModel()

  useEffect(() => {
    if (apiDetails) {
      setData({
        ...apiDetails,
        apiName: apiDetails?.name,
      })
    } else {
      setData(defaultData)
    }
  }, [apiDetails])

  const validateData = (data: Partial<ExtendedApi>) => {
    if (data.type !== 'branch' && !data.datatype) {
      return 'Data Type is required'
    }
  }

  const handleUpdate = async () => {
    try {
      const error = validateData(data)
      if (error) {
        setError(error)
        return
      }
      setError(null)
      onUpdate?.(data)
      setLoading(true)

      const updateData = {
        type: data.type,
        datatype: data.datatype || null,
        description: data.description || '',
        isWishlist: !!data.isWishlist,
        unit: data.unit || null,
      }

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
    } catch (error) {
      if (isAxiosError(error)) {
        setError(error.response?.data?.message || 'Something went wrong')
      } else {
        setError('Something went wrong')
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
          disabled={loading || _.isEqual(data, apiDetails)}
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
