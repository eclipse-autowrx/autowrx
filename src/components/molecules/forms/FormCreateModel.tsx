import { DaButton } from '@/components/atoms/DaButton'
import { DaInput } from '@/components/atoms/DaInput'
import { DaSelect, DaSelectItem } from '@/components/atoms/DaSelect'
import { DaText } from '@/components/atoms/DaText'
import { CVI } from '@/data/CVI'
import { createModelService } from '@/services/model.service'
import { ModelCreate } from '@/types/model.type'
import axios, { isAxiosError } from 'axios'
import { FormEvent, useEffect, useState } from 'react'
import { TbCircleCheckFilled, TbLoader } from 'react-icons/tb'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../toaster/use-toast'
import useListModelLite from '@/hooks/useListModelLite'
import { addLog } from '@/services/log.service'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import useListVSSVersions from '@/hooks/useListVSSVersions'
import { repeatService } from '@/services/utils.service'

const initialState = {
  cvi: '{}',
  name: '',
  mainApi: 'Vehicle',
  vssVersion: 'v4.2',
}

const FormCreateModel = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [data, setData] = useState(initialState)
  const { refetch: refetchModelLite } = useListModelLite()
  const { toast } = useToast()
  const { data: vssVersions } = useListVSSVersions()
  const { data: currentUser } = useSelfProfileQuery()

  const navigate = useNavigate()

  const handleChange = (name: keyof typeof data, value: string) => {
    setData((prev) => ({ ...prev, [name]: value }))
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
        cvi: '{}',
        main_api: data.mainApi,
        name: data.name,
      }
      if (data.vssVersion !== 'from-scratch') {
        const vssVersion = vssVersions?.find(
          (version) => version.tag_name === data.vssVersion,
        )
        if (!vssVersion) {
          setError('VSS version not found')
          return
        }
        const jsonData = await repeatService(vssVersion.json_asset_url!, 'GET')
        body.cvi = JSON.stringify(jsonData)
      }

      const modelId = await createModelService(body)
      await refetchModelLite()

      addLog({
        name: `New model '${body.name}' with visibility: ${body.visibility}`,
        description: `New model '${body.name}' was created by ${currentUser.email || currentUser.name || currentUser.id}`,
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

      <DaSelect
        defaultValue={
          vssVersions && vssVersions.length > 0
            ? vssVersions[0].tag_name
            : 'v4.2'
        }
        label="Covesa VSS version *"
        wrapperClassName="mt-4"
      >
        {vssVersions?.map((version, index) => (
          <DaSelectItem
            onClick={() => handleChange('vssVersion', version.tag_name)}
            key={index}
            value={version.tag_name}
          >
            {version.tag_name}
          </DaSelectItem>
        ))}
        {/* <DaSelectItem value="vss-api">COVESA VSS API v3.1</DaSelectItem>
        <DaSelectItem value="vss-api-4.0">COVESA VSS API v4.0</DaSelectItem>
        <DaSelectItem value="vss-api-4.1">COVESA VSS API v4.1</DaSelectItem>
        <DaSelectItem value="v2c-s2s">
          Start with V2C and S2S(COVESA) API
        </DaSelectItem> */}
        <DaSelectItem
          onClick={() => handleChange('vssVersion', 'from-scratch')}
          value="from-scratch"
        >
          Start from scratch
        </DaSelectItem>
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
        className="mt-8 w-full"
      >
        {loading && <TbLoader className="mr-2 animate-spin text-lg" />}
        Create Model
      </DaButton>
    </form>
  )
}

export default FormCreateModel
