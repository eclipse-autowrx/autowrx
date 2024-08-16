import { DaButton } from '@/components/atoms/DaButton'
import { DaText } from '@/components/atoms/DaText'
import { FormEvent, useEffect, useState } from 'react'
import { TbLoader, TbCircleCheckFilled } from 'react-icons/tb'
import { createPrototypeService } from '@/services/prototype.service'
import { addLog } from '@/services/log.service'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { useNavigate, useLocation } from 'react-router-dom'
import useListModelContribution from '@/hooks/useListModelContribution'
import { DaSelect, DaSelectItem } from '@/components/atoms/DaSelect'
import { zipToPrototype } from '@/lib/zipUtils'
import { Prototype } from '@/types/model.type'
import { ModelLite } from '@/types/model.type'
import DaImportFile from '@/components/atoms/DaImportFile'
import DaLoader from '@/components/atoms/DaLoader'
import { CVI } from '@/data/CVI'
import { DaInput } from '@/components/atoms/DaInput'
import { ModelCreate } from '@/types/model.type'
import { createModelService } from '@/services/model.service'
import { useToast } from '../toaster/use-toast'

const initialState = {
  modelName: '',
  cvi: JSON.stringify(CVI),
  mainApi: 'Vehicle',
}

const FormImportPrototype = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState(initialState)
  const navigate = useNavigate()
  const [error, setError] = useState<string>('')
  const {
    data: contributionModels,
    isLoading: isFetchingModelContribution,
    refetch,
  } = useListModelContribution()
  const { data: currentUser } = useSelfProfileQuery()
  const [localModel, setLocalModel] = useState<ModelLite>()
  const { toast } = useToast()

  const handleChange = (name: keyof typeof data, value: string | number) => {
    setData((prev) => ({ ...prev, [name]: value }))
  }

  const handleImportPrototypeZip = async (file: File) => {
    if (!file) return
    if (!data.modelName) return

    let modelId: string

    try {
      // Determine the model ID based on whether a local model exists or a new one needs to be created
      if (localModel) {
        // Scenario 1: `localModel` exists, use its ID
        modelId = localModel.id
      } else if (data.modelName) {
        // Scenario 2: `localModel` does not exist, create a new model
        const modelBody: ModelCreate = {
          cvi: data.cvi,
          main_api: data.mainApi,
          name: data.modelName,
        }

        const newModelId = await createModelService(modelBody)
        modelId = newModelId
      } else {
        throw new Error('Model data is missing')
      }

      setIsLoading(true)

      // Import the prototype from the ZIP file
      const prototype = await zipToPrototype(modelId, file)

      if (prototype) {
        const prototypePayload: Partial<Prototype> = {
          state: prototype.state || 'development',
          apis: {
            VSS: [],
            VSC: [],
          },
          code: prototype.code || '',
          widget_config: prototype.widget_config || '{}',
          description: prototype.description,
          tags: prototype.tags || [],
          image_file: prototype.image_file,
          model_id: modelId,
          name: prototype.name,
          complexity_level: prototype.complexity_level || '3',
          customer_journey: prototype.customer_journey || '{}',
          portfolio: prototype.portfolio || {},
        }

        const response = await createPrototypeService(prototypePayload)

        // Log the prototype creation
        await addLog({
          name: `New prototype '${response.name}' under model '${localModel?.name || data.modelName}'`,
          description: `Prototype '${response.name}' was created by ${currentUser?.email || currentUser?.name || currentUser?.id}`,
          type: 'new-prototype',
          create_by: currentUser?.id!,
          ref_id: response.id,
          ref_type: 'prototype',
          parent_id: modelId,
        })

        toast({
          title: ``,
          description: (
            <DaText variant="small" className=" flex items-center">
              <TbCircleCheckFilled className="text-green-500 w-4 h-4 mr-2" />
              Import prototype successfully
            </DaText>
          ),
          duration: 3000,
        })

        // Refetch data and navigate to the new prototype's page
        await refetch()
        navigate(`/model/${modelId}/library/list/${response.id}`)
      } else {
        throw new Error('Failed to extract prototype from the ZIP file')
      }
    } catch (error) {
      setError('Failed to import prototype')
      console.error('Failed to import prototype:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (
      contributionModels &&
      !isFetchingModelContribution &&
      contributionModels.results.length > 0
    ) {
      setLocalModel(contributionModels.results[0])
    }
  }, [contributionModels, isFetchingModelContribution])

  return (
    <div className="flex flex-col w-[30vw] lg:w-[25vw] max-h-[80vh] p-4 bg-da-white">
      <DaText variant="title" className="text-da-primary-500">
        Import Prototype
      </DaText>

      {contributionModels && !isFetchingModelContribution && localModel ? (
        <DaSelect
          defaultValue={localModel.id}
          label="Model name *"
          wrapperClassName="mt-4"
          onValueChange={(e) => {
            const selectedModel = contributionModels.results.find(
              (model) => model.id === e,
            )
            selectedModel && setLocalModel(selectedModel)
          }}
        >
          {contributionModels.results.map((model, index) => (
            <DaSelectItem key={index} value={model.id}>
              {model.name}
            </DaSelectItem>
          ))}
        </DaSelect>
      ) : isFetchingModelContribution ? (
        <DaText variant="regular" className="mt-4 flex items-center">
          <DaLoader className="w-4 h-4 mr-1" />
          Loading vehicle model...
        </DaText>
      ) : (
        <DaInput
          name="name"
          value={data.modelName}
          onChange={(e) => handleChange('modelName', e.target.value)}
          placeholder="Model name"
          label="Model Name *"
          className="mt-4"
        />
      )}

      {error && (
        <DaText variant="small" className="mt-4 text-da-accent-500">
          {error}
        </DaText>
      )}

      <DaImportFile
        accept=".zip"
        onFileChange={handleImportPrototypeZip}
        className="flex w-full"
      >
        <DaButton
          disabled={isLoading || (!localModel && !data.modelName)}
          type="submit"
          variant="gradient"
          className="w-full mt-8"
        >
          {isLoading && <TbLoader className="animate-spin text-lg mr-2" />}
          Select file and import
        </DaButton>
      </DaImportFile>
    </div>
  )
}

export default FormImportPrototype
