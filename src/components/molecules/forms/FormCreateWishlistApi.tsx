import { DaButton } from '@/components/atoms/DaButton'
import { DaInput } from '@/components/atoms/DaInput'
import { DaSelect, DaSelectItem } from '@/components/atoms/DaSelect'
import { DaText } from '@/components/atoms/DaText'
import { useState, useEffect } from 'react'
import { TbLoader } from 'react-icons/tb'
import { isAxiosError } from 'axios'
import { updateModelService } from '@/services/model.service'
import { log } from 'console'

interface FormCreateWishlistApiProps {
  onClose: () => void
  modelId: string
  existingCustomApis: { name: string }[]
}

const initialData = {
  name: '',
  description: '',
  type: '',
  datatype: '',
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

const FormCreateWishlistApi = ({
  onClose,
  modelId,
  existingCustomApis,
}: FormCreateWishlistApiProps) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [data, setData] = useState(initialData)

  useEffect(() => {
    if (data.name && !data.name.startsWith('Vehicle.')) {
      setError('API name must start with "Vehicle."')
    } else {
      setError('')
    }
  }, [data.name])

  useEffect(() => {
    // Check whether the API name already exists
    console.log('existingCustomApis', existingCustomApis)
  }, [data.name, existingCustomApis])

  const createWishlistApi = async (data: any) => {
    try {
      if (existingCustomApis.some((api) => api.name === data.name)) {
        setError('API with this name already exists')
        return
      }

      const customApi = {
        name: data.name,
        description: data.description,
        type: data.type,
        ...(data.type !== 'branch' && { datatype: data.datatype }),
      }
      const updatedCustomApis = [...existingCustomApis, customApi]
      const customApisJson = JSON.stringify(updatedCustomApis)

      await updateModelService(modelId, {
        custom_apis: customApisJson as any,
      })
      setError('')
      setData(initialData)
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
      type: value,
      ...(value === 'branch' ? { datatype: '' } : {}),
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
    await createWishlistApi(data)
    setLoading(false)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col w-[400px] min-w-[400px] min-h-[400px] px-2 md:px-6 py-4 bg-da-white"
    >
      {/* Title */}
      <DaText variant="title" className="text-da-primary-500">
        New Wishlist API
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
          value={data.datatype}
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
      <div className="space-x-2 ml-auto">
        <DaButton
          onClick={onClose}
          disabled={loading}
          type="button"
          className="w-fit mt-8"
          variant="plain"
        >
          Cancel
        </DaButton>
        <DaButton disabled={loading} type="submit" className="w-fit mt-8">
          {loading && (
            <TbLoader className="animate-spin da-label-regular mr-2" />
          )}
          Create
        </DaButton>
      </div>
    </form>
  )
}

export default FormCreateWishlistApi
