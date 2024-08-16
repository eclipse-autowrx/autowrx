import { DaButton } from '@/components/atoms/DaButton'
import { DaInput } from '@/components/atoms/DaInput'
import { DaText } from '@/components/atoms/DaText'
import { FormEvent, useEffect, useState } from 'react'
import { TbCircleCheckFilled, TbLoader } from 'react-icons/tb'
import { createPrototypeService } from '@/services/prototype.service'
import { useToast } from '../toaster/use-toast'
import useListModelPrototypes from '@/hooks/useListModelPrototypes'
import useCurrentModel from '@/hooks/useCurrentModel'
import { isAxiosError } from 'axios'
import { addLog } from '@/services/log.service'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { useNavigate, useLocation } from 'react-router-dom'
import useListModelContribution from '@/hooks/useListModelContribution'
import { DaSelect, DaSelectItem } from '@/components/atoms/DaSelect'
import { zipToPrototype } from '@/lib/zipUtils'
import { Prototype } from '@/types/model.type'
import { ModelLite } from '@/types/model.type'
import DaImportFile from '@/components/atoms/DaImportFile'

const FormImportPrototype = () => {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const [error, setError] = useState<string>('')
  const {
    data: contributionModels,
    isLoading: isFetchingModelContribution,
    refetch,
  } = useListModelContribution()
  const { data: currentUser } = useSelfProfileQuery()
  const [localModel, setLocalModel] = useState<ModelLite>()

  const handleImportPrototypeZip = async (file: File) => {
    if (!file) return
    if (!localModel) {
      setError('Please select a model')
      return
    }
    setIsLoading(true)
    const prototype = await zipToPrototype(localModel.id, file)
    try {
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
          model_id: localModel.id,
          name: prototype.name,
          complexity_level: prototype.complexity_level || '3',
          customer_journey: prototype.customer_journey || '{}',
          portfolio: prototype.portfolio || {},
        }
        const data = await createPrototypeService(prototypePayload)
        await addLog({
          name: `New prototype '${data.name}' under model '${localModel.name}'`,
          description: `Prototype '${data.name}' was created by ${currentUser?.email || currentUser?.name || currentUser?.id}`,
          type: 'new-prototype',
          create_by: currentUser?.id!,
          ref_id: data.id,
          ref_type: 'prototype',
          parent_id: localModel.id,
        })
        await refetch()
        navigate(`/model/${localModel.id}/library/list/${data.id}`)
        setIsLoading(false)
      }
    } catch (error) {
      setIsLoading(false)
      console.error('Failed to import prototype:', error)
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
          label="Select vehicle model *"
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
      ) : isLoading ? (
        <DaText variant="small" className="mt-4 text-da-accent-500">
          Loading...
        </DaText>
      ) : (
        <DaText variant="small" className="mt-4 text-da-accent-500">
          No contribution model found.
        </DaText>
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
          disabled={isLoading || !localModel}
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
