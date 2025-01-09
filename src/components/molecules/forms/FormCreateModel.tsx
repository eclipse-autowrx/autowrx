import { DaButton } from '@/components/atoms/DaButton'
import { DaInput } from '@/components/atoms/DaInput'
import { DaSelect, DaSelectItem } from '@/components/atoms/DaSelect'
import { DaText } from '@/components/atoms/DaText'
import { CVI } from '@/data/CVI'
import { createModelService } from '@/services/model.service'
import { ModelCreate } from '@/types/model.type'
import { isAxiosError } from 'axios'
import { FormEvent, useState } from 'react'
import { TbCircleCheckFilled, TbLoader } from 'react-icons/tb'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../toaster/use-toast'
import useListModelLite from '@/hooks/useListModelLite'
import { addLog } from '@/services/log.service'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import useListVSSVersions from '@/hooks/useListVSSVersions'
import DaFileUpload from '@/components/atoms/DaFileUpload'

type ModelData = {
  cvi: string
  name: string
  mainApi: string
  api_version: string
  api_data_url?: string
}

const initialState: ModelData = {
  cvi: JSON.stringify(CVI),
  name: '',
  mainApi: 'Vehicle',
  api_version: 'v4.1',
}

const FormCreateModel = () => {
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [error, setError] = useState<string>('')
  const [data, setData] = useState(initialState)
  const { refetch: refetchModelLite } = useListModelLite()
  const { data: versions } = useListVSSVersions()
  const { toast } = useToast()

  const { data: currentUser } = useSelfProfileQuery()

  const navigate = useNavigate()

  const handleChange = (name: keyof typeof data, value: string) => {
    setData((prev) => ({ ...prev, [name]: value }))
  }

  const handleVSSChange = (version: string) => {
    setData((prev) => ({ ...prev, api_version: version }))
  }

  const createNewModel = async (e: FormEvent<HTMLFormElement>) => {
    if (!currentUser) {
      console.error('User not found')
      return
    }
    e.preventDefault()
    try {
      setLoading(true)
      const body: ModelCreate = {
        main_api: data.mainApi,
        name: data.name,
        api_version: data.api_version,
      }
      if (data.api_data_url) {
        body.api_data_url = data.api_data_url
      }
      const modelId = await createModelService(body)
      await refetchModelLite()
      addLog({
        name: `New model '${body.name}' with visibility: ${body.visibility}`,
        description: `New model '${body.name}' was created by ${currentUser.email || currentUser.name || currentUser.id} version ${'a'}`,
        type: 'new-model',
        create_by: currentUser.id,
        ref_id: modelId,
        ref_type: 'model',
      })

      toast({
        title: ``,
        description: (
          <DaText variant="regular-medium" className="flex items-center">
            <TbCircleCheckFilled className="mr-2 h-5 w-5 text-green-500" />
            Model "{data.name}" created successfully
          </DaText>
        ),
        duration: 3000,
      })
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
      className="flex min-h-[300px] w-[400px] min-w-[400px] flex-col bg-da-white p-4"
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
        placeholder="Model name"
        label="Model Name *"
        className="mt-4"
      />

      <div className="mt-4" />

      <DaText variant="regular-medium">VSS Signal *</DaText>
      <div className="border mt-1 rounded-lg px-2 pb-2 pt-1">
        <DaText variant="small">select version</DaText>
        <DaSelect
          wrapperClassName="mt-1"
          onValueChange={handleVSSChange}
          defaultValue="v4.1"
        >
          {versions ? (
            versions.map((version) => (
              <DaSelectItem key={version.name} value={version.name}>
                COVESA VSS {version.name}
              </DaSelectItem>
            ))
          ) : (
            <>
              <DaSelectItem value="v5.0">COVESA VSS v5.0</DaSelectItem>
              <DaSelectItem value="v4.1">COVESA VSS v4.1</DaSelectItem>
              <DaSelectItem value="v4.0">COVESA VSS v4.0</DaSelectItem>
              <DaSelectItem value="v3.1">COVESA VSS v3.1</DaSelectItem>
            </>
          )}
        </DaSelect>

        <DaText variant="small">or upload a file</DaText>

        <DaFileUpload
          onStartUpload={() => {
            setUploading(true)
          }}
          onFileUpload={(url) => {
            setData((prev) => ({ ...prev, api_data_url: url }))
            setUploading(false)
          }}
          className="mt-1"
          accept=".json"
        />
      </div>

      {/* <DaFileUpload /> */}

      <div className="grow"></div>

      {/* Error */}
      {error && (
        <DaText variant="small" className="mt-2 text-da-accent-500">
          {error}
        </DaText>
      )}
      {/* Action */}
      <DaButton
        disabled={loading || uploading}
        type="submit"
        variant="gradient"
        className="mt-8 w-full"
      >
        {loading && <TbLoader className="mr-2 animate-spin text-lg" />}
        Create Model
      </DaButton>
    </form>
  )
}

export default FormCreateModel
