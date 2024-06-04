import { DaButton } from '@/components/atoms/DaButton'
import { DaInput } from '@/components/atoms/DaInput'
import { DaSelect, DaSelectItem } from '@/components/atoms/DaSelect'
import { DaText } from '@/components/atoms/DaText'
import { CVI } from '@/data/CVI'
import { createModelService } from '@/services/model.service'
import { ModelCreate } from '@/types/model.type'
import { isAxiosError } from 'axios'
import { FormEvent, useState } from 'react'
import { TbLoader } from 'react-icons/tb'
import { useNavigate } from 'react-router-dom'

const initialState = {
  cvi: JSON.stringify(CVI),
  name: '',
  mainApi: 'Vehicle',
}

const FormCreateModel = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [data, setData] = useState(initialState)

  const navigate = useNavigate()

  const handleChange = (name: keyof typeof data, value: string) => {
    setData((prev) => ({ ...prev, [name]: value }))
  }

  const createNewModel = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      setLoading(true)
      const body: ModelCreate = {
        cvi: data.cvi,
        main_api: data.mainApi,
        name: data.name,
      }
      const modelId = await createModelService(body)
      navigate(`/model/${modelId}`)
      setData(initialState)
    } catch (error) {
      if (isAxiosError(error)) {
        setError(error.response?.data?.message || 'Something went wrong')
        return
      }
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={createNewModel}
      className="flex flex-col w-[400px] min-w-[400px] min-h-[300px] px-2 md:px-6 py-4 bg-da-white"
    >
      {/* Title */}
      <DaText variant="title" className="text-da-primary-500">
        Create New Model
      </DaText>

      {/* Content */}
      <DaInput
        name="name"
        value={data.name}
        onChange={(e) => handleChange('name', e.target.value)}
        placeholder="Model Name"
        label="Model Name *"
        className="mt-4"
      />
      <DaSelect
        defaultValue="vss-api"
        label="VSS API *"
        wrapperClassName="mt-4"
      >
        <DaSelectItem value="vss-api">COVESA VSS API v3.1</DaSelectItem>
        <DaSelectItem value="vss-api-4.0">COVESA VSS API v4.0</DaSelectItem>
        <DaSelectItem value="vss-api-4.1">COVESA VSS API v4.1</DaSelectItem>
        <DaSelectItem value="v2c-s2s">
          Start with V2C and S2S(COVESA) API
        </DaSelectItem>
        <DaSelectItem value="from-scratch">Start from scratch</DaSelectItem>
      </DaSelect>

      <div className="grow"></div>

      {/* Error */}
      {error && (
        <DaText variant="small" className="mt-2 text-da-accent-500">
          {error}
        </DaText>
      )}
      {/* Action */}
      <DaButton
        disabled={loading}
        type="submit"
        variant="gradient"
        className="w-full mt-8"
      >
        {loading && <TbLoader className="animate-spin text-lg mr-2" />}
        Create Model
      </DaButton>
    </form>
  )
}

export default FormCreateModel
