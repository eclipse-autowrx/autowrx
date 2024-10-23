import { DaButton } from '@/components/atoms/DaButton'
import { DaInput } from '@/components/atoms/DaInput'
import { DaSelect, DaSelectItem } from '@/components/atoms/DaSelect'
import { DaText } from '@/components/atoms/DaText'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { TbLoader } from 'react-icons/tb'
import { isAxiosError } from 'axios'
import { updateModelService } from '@/services/model.service'
import useCurrentModel from '@/hooks/useCurrentModel'
import { CustomApi } from '@/types/model.type'
import { addLog } from '@/services/log.service'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { createExtendedApi } from '@/services/extendedApis.service'
import useModelStore from '@/stores/modelStore'

interface FormCreateWishlistApiProps {
  onClose: () => void
  onApiCreate: (api: CustomApi) => void
  modelId: string
  existingCustomApis: CustomApi[]
}

interface CreateWishlistAPI {
  name: string
  description: string
  type: 'branch' | 'sensor' | 'actuator' | 'attribute'
  datatype: string
}

const initialData: CreateWishlistAPI = {
  name: '',
  description: '',
  type: 'branch',
  datatype: 'boolean',
}

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

const ROOT_API_NOTATION = 'Vehicle.'

const FormCreateWishlistApi = ({
  onClose,
  modelId,
  existingCustomApis,
  onApiCreate,
}: FormCreateWishlistApiProps) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState(initialData)
  const { refetch } = useCurrentModel()
  const refreshModel = useModelStore((state) => state.refreshModel)
  const { data: currentModel } = useCurrentModel()
  const { data: currentUser } = useSelfProfileQuery()

  const validate = useCallback((data: CreateWishlistAPI) => {
    if (data.name) {
      if (!data.name.startsWith(ROOT_API_NOTATION)) {
        return `Signal name must start with "${ROOT_API_NOTATION}"`
      }
      const actualName = data.name.slice(ROOT_API_NOTATION.length)
      if (actualName.length === 0) {
        return `Signal name must have at least 1 character after "${ROOT_API_NOTATION}"`
      }
      if (!/^[a-zA-Z][a-zA-Z0-9.]*$/.test(actualName)) {
        return 'API name must only contain letters, numbers, and periods, and must not start with a number'
      }
      if (/\.\./.test(actualName)) {
        return 'API name must not contain consecutive periods' // Prevent case like "Vehicle..Speed"
      }
      if (actualName.endsWith('.')) {
        return 'API name must not end with a period' // Prevent case like "Vehicle.Speed."
      }
      if (data.name.length > 255) {
        return 'Signal name must not exceed 255 characters'
      }
    }
    if (data.description.length > 4096) {
      return 'Signal description must not exceed 4096 characters'
    }
    if (data.type !== 'branch' && !data.datatype) {
      return 'Data type is required for sensor, actuator, and attribute'
    }
    return null
  }, [])

  useEffect(() => {
    const result = validate(data)
    if (result) {
      setError(result)
    } else {
      setError('')
    }
  }, [data])

  const createWishlistApi = async (data: any) => {
    try {
      const currentCustomApis = existingCustomApis ?? []
      if (currentCustomApis.some((name) => name.name === data.name)) {
        setError('Signal with this name already exists')
        return
      }

      const customApi = {
        name: data.name,
        description: data.description,
        type: data.type,
        ...(data.type !== 'branch' && { datatype: data.datatype }),
      }
      const updatedCustomApis = [...currentCustomApis, customApi]
      const customApisJson = JSON.stringify(updatedCustomApis)

      await updateModelService(modelId, {
        custom_apis: customApisJson as any,
      })
      setError('')
      setData(initialData)

      addLog({
        name: `Create wishlist Signal ${customApi.name}`,
        description: `User ${currentUser?.email} created wishlist Signal ${customApi.name} in model ${modelId}`,
        type: 'create-wishlist',
        create_by: currentUser?.id!,
        ref_id: modelId,
        ref_type: 'model',
      })

      await refetch()

      onApiCreate(customApi)
      onClose()
    } catch (error) {
      if (isAxiosError(error)) {
        setError(error.response?.data?.message ?? 'Something went wrong')
        return
      }
      setError('Something went wrong')
    }
  }

  const createWishlistApiAlt = async (data: any) => {
    try {
      const customApi = await createExtendedApi({
        apiName: data.name,
        model: modelId,
        skeleton: '{}',
        description: data.description,
        type: data.type,
        datatype: data.datatype,
      })

      await refreshModel()

      addLog({
        name: `Create wishlist Signal ${customApi.name}`,
        description: `User ${currentUser?.email} created wishlist Signal ${customApi.name} in model ${modelId}`,
        type: 'create-wishlist',
        create_by: currentUser?.id!,
        ref_id: modelId,
        ref_type: 'model',
      })

      onApiCreate(customApi)
      onClose()
    } catch (error) {
      if (isAxiosError(error)) {
        setError(error.response?.data?.message ?? 'Something went wrong')
        return
      }
      setError('Something went wrong')
    }
  }

  const handleChange =
    (key: keyof typeof data) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setData((prev) => ({ ...prev, [key]: e.target.value }))
    }

  const handleTypeChange = (value: string) => {
    setData((prev) => ({
      ...prev,
      type: value as CreateWishlistAPI['type'],
      ...(value === 'branch' ? { datatype: prev.datatype ?? 'boolean' } : {}),
    }))
  }

  const handleDatatypeChange = (value: string) => {
    setData((prev) => ({
      ...prev,
      datatype: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    if (currentModel?.api_version) {
      await createWishlistApiAlt(data)
    } else {
      await createWishlistApi(data)
    }
    setLoading(false)
  }

  const isButtonDisabled = useMemo(() => {
    if (loading) return true
    if (!data.name) {
      return true
    }
    if (error) return true
    return false
  }, [error, loading])

  return (
    <form
      onSubmit={handleSubmit}
      className="flex h-fit max-h-[550px] w-[30vw] min-w-[400px] max-w-[500px] flex-col bg-da-white p-4 lg:w-[25vw]"
    >
      {/* Title */}
      <DaText variant="title" className="text-da-primary-500">
        New Wishlist Signal
      </DaText>
      {/* Content */}
      <DaInput
        value={data.name}
        onChange={handleChange('name')}
        name="name"
        placeholder="Name"
        label="Name"
        className="mt-4"
      />
      <DaInput
        value={data.description}
        onChange={handleChange('description')}
        name="description"
        placeholder="Description"
        label="Description"
        className="mt-4"
      />
      <DaSelect
        label="Type"
        value={data.type}
        onValueChange={handleTypeChange}
        wrapperClassName="mt-4"
      >
        <DaSelectItem value="branch">Branch</DaSelectItem>
        <DaSelectItem value="sensor">Sensor</DaSelectItem>
        <DaSelectItem value="actuator">Actuator</DaSelectItem>
        <DaSelectItem value="attribute">Attribute</DaSelectItem>
      </DaSelect>
      {(data.type === 'sensor' ||
        data.type === 'actuator' ||
        data.type === 'attribute') && (
        <DaSelect
          label="Data Type"
          value={data.datatype ? data.datatype : 'uint8'}
          onValueChange={handleDatatypeChange}
          wrapperClassName="mt-4"
        >
          {dataTypes.map((type) => (
            <DaSelectItem key={type} value={type}>
              {type}
            </DaSelectItem>
          ))}
        </DaSelect>
      )}
      <div className="grow"></div>
      {/* Error */}
      {error && (
        <DaText variant="small" className="mt-2 text-da-accent-500">
          {error}
        </DaText>
      )}
      {/* Action */}
      <div className="ml-auto space-x-2">
        <DaButton
          onClick={onClose}
          disabled={loading}
          type="button"
          className="mt-8 w-fit"
          variant="plain"
        >
          Cancel
        </DaButton>
        <DaButton
          disabled={isButtonDisabled}
          type="submit"
          className="mt-8 w-fit"
        >
          {loading && (
            <TbLoader className="da-label-regular mr-2 animate-spin" />
          )}
          Create
        </DaButton>
      </div>
    </form>
  )
}

export default FormCreateWishlistApi
