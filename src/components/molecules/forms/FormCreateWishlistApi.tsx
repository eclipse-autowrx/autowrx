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
import shallow from 'zustand/shallow'

interface FormCreateWishlistApiProps {
  onClose: () => void
  onApiCreate: (api: CustomApi) => void
  modelId: string
  existingCustomApis: CustomApi[]
  prefix?: string
}

// 1) Extend the interface with a new unit property (optional).
interface CreateWishlistAPI {
  name: string
  description: string
  type: 'branch' | 'sensor' | 'actuator' | 'attribute'
  datatype: string
  unit?: string
}

// 2) Include `unit` in your initialData
const initialData: CreateWishlistAPI = {
  name: '',
  description: '',
  type: 'branch',
  datatype: 'boolean',
  unit: '', // default empty
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
  onApiCreate,
  modelId,
  existingCustomApis,
  prefix,
}: FormCreateWishlistApiProps) => {
  // ------------------------------------------------------------
  // Process prefix
  // ------------------------------------------------------------
  const sanitizedPrefix = prefix ? prefix.replace(/!/g, '') : ''

  let branchPrefix = ''
  let defaultSuffix = 'NewSignal'
  if (sanitizedPrefix) {
    if (sanitizedPrefix.endsWith('.')) {
      branchPrefix = sanitizedPrefix
    } else if (sanitizedPrefix.includes('.')) {
      branchPrefix = sanitizedPrefix.substring(
        0,
        sanitizedPrefix.lastIndexOf('.') + 1,
      )
      defaultSuffix =
        sanitizedPrefix.substring(sanitizedPrefix.lastIndexOf('.') + 1) ||
        defaultSuffix
    } else {
      branchPrefix = sanitizedPrefix + '.'
    }
  }

  // ------------------------------------------------------------
  // State
  // ------------------------------------------------------------
  const [data, setData] = useState<CreateWishlistAPI>({
    ...initialData,
    name: branchPrefix ? branchPrefix + defaultSuffix : initialData.name,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const { refetch, data: currentModel } = useCurrentModel()
  const { data: currentUser } = useSelfProfileQuery()
  const refreshModel = useModelStore((state) => state.refreshModel)
  const [activeModelApis] = useModelStore(
    (state) => [state.activeModelApis],
    shallow,
  )

  // Use branchPrefix if provided; otherwise default to currentModel main API notation.
  const ROOT_API_NOTATION =
    branchPrefix || (currentModel?.main_api || 'Vehicle') + '.'

  const allExistingNames = useMemo(() => {
    const customNames = existingCustomApis?.map((x) => x.name) ?? []
    const modelNames = (activeModelApis ?? []).map((x: any) => x.name)
    return [...customNames, ...modelNames]
  }, [existingCustomApis, activeModelApis])

  // ------------------------------------------------------------
  // Validation
  // ------------------------------------------------------------
  const validate = useCallback(
    (formData: CreateWishlistAPI): string | null => {
      if (formData.name) {
        if (!formData.name.startsWith(ROOT_API_NOTATION)) {
          return `Signal name must start with "${ROOT_API_NOTATION}"`
        }
        const actualName = formData.name.slice(ROOT_API_NOTATION.length)
        if (actualName.length === 0) {
          return `Signal name must have at least 1 character after "${ROOT_API_NOTATION}"`
        }
        if (!/^[a-zA-Z][a-zA-Z0-9.]*$/.test(actualName)) {
          return 'API name must only contain letters, numbers, and periods, and must not start with a number'
        }
        if (/\.\./.test(actualName)) {
          return 'API name must not contain consecutive periods'
        }
        if (actualName.endsWith('.')) {
          return 'API name must not end with a period'
        }
        if (formData.name.length > 255) {
          return 'Signal name must not exceed 255 characters'
        }
      }
      if (formData.description.length > 4096) {
        return 'Signal description must not exceed 4096 characters'
      }
      if (formData.type !== 'branch' && !formData.datatype) {
        return 'Data type is required for sensor, actuator, and attribute'
      }
      if (allExistingNames.includes(formData.name)) {
        return 'Signal with this name already exists'
      }
      return null
    },
    [ROOT_API_NOTATION, allExistingNames],
  )

  useEffect(() => {
    const result = validate(data)
    setError(result || '')
  }, [data, validate])

  // ------------------------------------------------------------
  // Creating wishlist APIs
  // ------------------------------------------------------------
  const createWishlistApi = async (apiData: CreateWishlistAPI) => {
    try {
      // 4) Pass `unit` as well
      const customApi = {
        name: apiData.name,
        description: apiData.description,
        type: apiData.type,
        ...(apiData.type !== 'branch' && { datatype: apiData.datatype }),
        ...(apiData.type !== 'branch' && { unit: apiData.unit }),
      }
      const updatedCustomApis = [...(existingCustomApis ?? []), customApi]
      const customApisJson = JSON.stringify(updatedCustomApis)

      await updateModelService(modelId, {
        custom_apis: customApisJson as any,
      })

      addLog({
        name: `Create wishlist Signal ${customApi.name}`,
        description: `User ${currentUser?.email} created wishlist Signal ${customApi.name} in model ${modelId}`,
        type: 'create-wishlist',
        create_by: currentUser?.id!,
        ref_id: modelId,
        ref_type: 'model',
      })

      setData({
        ...initialData,
        name: branchPrefix ? branchPrefix + defaultSuffix : initialData.name,
      })
      setError('')
      await refetch()
      onApiCreate(customApi)
      onClose()
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message ?? 'Something went wrong')
        return
      }
      setError('Something went wrong')
    }
  }

  const createWishlistApiAlt = async (apiData: CreateWishlistAPI) => {
    try {
      // 4) Pass `unit` here as well
      const customApi = await createExtendedApi({
        apiName: apiData.name,
        model: modelId,
        skeleton: '{}',
        description: apiData.description,
        type: apiData.type,
        datatype: apiData.datatype,
        isWishlist: true,
        unit: apiData.unit,
      })

      addLog({
        name: `Create wishlist Signal ${customApi.name}`,
        description: `User ${currentUser?.email} created wishlist Signal ${customApi.name} in model ${modelId}`,
        type: 'create-wishlist',
        create_by: currentUser?.id!,
        ref_id: modelId,
        ref_type: 'model',
      })

      await refreshModel()
      setData({
        ...initialData,
        name: branchPrefix ? branchPrefix + defaultSuffix : initialData.name,
      })
      setError('')
      onApiCreate(customApi)
      onClose()
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message ?? 'Something went wrong')
        return
      }
      setError('Something went wrong')
    }
  }

  const handleChange =
    (key: keyof CreateWishlistAPI) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setData((prev) => ({ ...prev, [key]: e.target.value }))
      if (key === 'name') {
        setShowSuggestions(true)
      }
    }

  const handleSuggestionSelect = (selectedName: string) => {
    setData((prev) => ({ ...prev, name: selectedName }))
    setShowSuggestions(false)
  }

  const handleTypeChange = (value: CreateWishlistAPI['type']) => {
    setData((prev) => ({
      ...prev,
      type: value,
      ...(value === 'branch' ? { datatype: 'boolean', unit: '' } : {}),
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
    if (error) return
    setLoading(true)
    await createWishlistApiAlt(data)
    setLoading(false)
  }

  const isButtonDisabled = useMemo(() => {
    return loading || !data.name || !!error
  }, [loading, data.name, error])

  const filteredSuggestions = useMemo(() => {
    if (!data.name) return []
    const normalized = data.name.toLowerCase()
    return (activeModelApis ?? [])
      .filter((apiObj: any) => apiObj?.name?.toLowerCase().includes(normalized))
      .slice(0, 20)
  }, [activeModelApis, data.name])

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

  return (
    <form
      onSubmit={handleSubmit}
      className="relative flex h-[540px] w-[30vw] min-w-[700px] max-w-[500px] flex-col bg-da-white p-4 text-sm lg:w-[25vw] overflow-y-auto"
    >
      <DaText variant="title" className="text-da-primary-500">
        New Wishlist Signal
      </DaText>

      {/* Name Input */}
      <div className="mt-6">
        <div className="!text-sm font-medium"> Name</div>
        <DaInput
          value={data.name}
          onChange={handleChange('name')}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setShowSuggestions(false)}
          name="name"
          placeholder="Name"
          className="relative mt-2"
          inputClassName="text-sm"
          onPaste={(e) => {
            e.stopPropagation()
            e.preventDefault()
            const pastedValue = e.clipboardData.getData('Text')
            setData((prev) => ({ ...prev, name: pastedValue }))
            setShowSuggestions(true)
          }}
        />
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute z-50 mt-1 w-[calc(100%-2rem)] max-h-[18vh] overflow-y-auto rounded-md border border-gray-200 bg-white p-1 shadow-lg">
            {filteredSuggestions.map((apiObj: any) => (
              <div
                key={apiObj.name}
                className="cursor-pointer px-2 py-1 hover:bg-gray-100"
                onMouseDown={() => handleSuggestionSelect(apiObj.name)}
              >
                {apiObj.name}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Description */}
      <div className="mt-4 !text-sm font-medium">Description</div>
      <DaInput
        value={data.description}
        onChange={handleChange('description')}
        name="description"
        placeholder="Description"
        className="mt-2"
        inputClassName="text-sm"
      />

      {/* Type */}
      <div className="mt-4 !text-sm font-medium">Type</div>
      <div className="mt-2 grid grid-cols-4 gap-2">
        {typeOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() =>
              handleTypeChange(option.value as CreateWishlistAPI['type'])
            }
            className={`p-1.5 text-sm font-medium rounded-lg w-full
              ${
                data.type === option.value
                  ? `${option.bg} ${option.text}`
                  : 'bg-gray-100'
              }
            `}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Data Type + Unit for non-branch */}
      {(data.type === 'sensor' ||
        data.type === 'actuator' ||
        data.type === 'attribute') && (
        <div>
          <div className="mt-4 !text-sm font-medium">Data Type</div>
          <DaSelect
            value={data.datatype ?? 'uint8'}
            onValueChange={handleDatatypeChange}
            wrapperClassName="mt-2"
          >
            {dataTypes.map((dt) => (
              <DaSelectItem className="text-sm" key={dt} value={dt}>
                {dt}
              </DaSelectItem>
            ))}
          </DaSelect>

          {/* Unit Input */}
          <div className="mt-4 !text-sm font-medium">Unit</div>
          <DaInput
            value={data.unit || ''}
            onChange={handleChange('unit')}
            name="unit"
            placeholder="e.g. km/h, psi, etc."
            className="mt-2"
            inputClassName="text-sm"
          />
        </div>
      )}

      {/* Error */}
      <div className="mt-2 min-h-5">
        {error && (
          <DaText variant="small" className="mt-4 text-red-500">
            {error}
          </DaText>
        )}
      </div>

      {/* Action Buttons */}
      <div className="ml-auto mt-auto flex space-x-2">
        <DaButton
          onClick={onClose}
          disabled={loading}
          type="button"
          className="w-20 rounded-lg"
          size="sm"
          variant="outline-nocolor"
        >
          Cancel
        </DaButton>
        <DaButton
          disabled={isButtonDisabled}
          type="submit"
          size="sm"
          className="flex w-20 rounded-lg"
        >
          {loading && <TbLoader className="mr-1 h-4 w-4 animate-spin" />}
          Create
        </DaButton>
      </div>
    </form>
  )
}

export default FormCreateWishlistApi
