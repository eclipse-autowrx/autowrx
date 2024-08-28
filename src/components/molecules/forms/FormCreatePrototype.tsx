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
import { Model, ModelLite, ModelCreate } from '@/types/model.type'
import DaLoader from '@/components/atoms/DaLoader'
import { CVI } from '@/data/CVI'
import { createModelService } from '@/services/model.service'
import clsx from 'clsx'
import default_journey from '@/data/default_journey'

const initialState = {
  prototypeName: '',
  modelName: '',
  cvi: JSON.stringify(CVI),
  mainApi: 'Vehicle',
}

interface FormCreatePrototypeProps {
  onClose?: () => void
  onPrototypeChange?: (data: {
    prototypeName: string
    modelName?: string
    modelId?: string
  }) => void
  disabledState?: [boolean, (disabled: boolean) => void]
  hideCreateButton?: boolean
}

const FormCreatePrototype = ({
  onClose,
  onPrototypeChange,
  disabledState,
  hideCreateButton,
}: FormCreatePrototypeProps) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [data, setData] = useState(initialState)
  const [disabled, setDisabled] = disabledState ?? useState(false)

  const { data: currentModel } = useCurrentModel()
  const { data: contributionModels, isLoading: isFetchingModelContribution } =
    useListModelContribution()
  const [localModel, setLocalModel] = useState<ModelLite>()
  const { refetch } = useListModelPrototypes(
    currentModel ? currentModel.id : '',
  )
  const navigate = useNavigate()
  const { toast } = useToast()

  const { data: currentUser } = useSelfProfileQuery()

  const handleChange = (name: keyof typeof data, value: string | number) => {
    setData((prev) => ({ ...prev, [name]: value }))
  }

  const createNewPrototype = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault() // Prevent the form from submitting

    try {
      setLoading(true)

      // Initialize variables to hold the model ID and response from prototype creation
      let modelId: string
      let response

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

      const body = {
        model_id: modelId,
        name: data.prototypeName,
        state: 'development',
        apis: { VSC: [], VSS: [] },
        code: `from vehicle import Vehicle
import time
import asyncio
import signal

from sdv.vdb.reply import DataPointReply
from sdv.vehicle_app import VehicleApp
from vehicle import Vehicle, vehicle

class TestApp(VehicleApp):

    def __init__(self, vehicle_client: Vehicle):
        super().__init__()
        self.Vehicle = vehicle_client

    async def on_start(self):
        for i in range(10):
            await asyncio.sleep(1)
            speed = (await self.Vehicle.AverageSpeed.get()).value
            print(f"[{i}] speed {speed}")

async def main():
    vehicle_app = TestApp(vehicle)
    await vehicle_app.run()


LOOP = asyncio.get_event_loop()
LOOP.add_signal_handler(signal.SIGTERM, LOOP.stop)
LOOP.run_until_complete(main())
LOOP.close()`,
        complexity_level: 3,
        customer_journey: default_journey,
        description: {
          problem: '',
          says_who: '',
          solution: '',
          status: '',
        },
        image_file: '/imgs/default_prototype_cover.jpg',
        skeleton: '{}',
        tags: [],
        widget_config: '[]',
        autorun: true,
      }

      // Create the prototype using the model ID

      response = await createPrototypeService(body)

      // Log the prototype creation
      await addLog({
        name: `New prototype '${data.prototypeName}' under model '${localModel?.name || data.modelName}'`,
        description: `Prototype '${data.prototypeName}' was created by ${currentUser?.email || currentUser?.name || currentUser?.id}`,
        type: 'new-prototype',
        create_by: currentUser?.id!,
        ref_id: response.id,
        ref_type: 'prototype',
        parent_id: modelId,
      })

      toast({
        title: ``,
        description: (
          <DaText variant="small" className="flex items-center">
            <TbCircleCheckFilled className="mr-2 h-4 w-4 text-green-500" />
            Prototype "{data.prototypeName}" created successfully
          </DaText>
        ),
        duration: 3000,
      })

      // Navigate to the new prototype's page
      navigate(`/model/${modelId}/library/list/${response.id}`)

      // Optionally close the form/modal
      if (onClose) onClose()

      // Reset form data
      setData(initialState)

      // Refetch data
      await refetch()
    } catch (error) {
      if (isAxiosError(error)) {
        setError(error.response?.data?.message || 'Something went wrong')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (currentModel) {
      const modelLite = {
        id: currentModel.id,
        name: currentModel.name,
        visibility: currentModel.visibility,
        model_home_image_file: currentModel.model_home_image_file || '',
        created_at: currentModel.created_at,
        created_by: currentModel.created_by,
        tags: currentModel.tags,
      }
      setLocalModel({
        ...modelLite,
        created_by: modelLite.created_by?.id || '',
      })
    } else if (
      contributionModels &&
      !isFetchingModelContribution &&
      contributionModels.results.length > 0
    ) {
      setLocalModel(contributionModels.results[0])
    }
  }, [contributionModels, isFetchingModelContribution, currentModel])

  useEffect(() => {
    if (loading || (!localModel && !data.modelName) || !data.prototypeName) {
      setDisabled(true)
    } else setDisabled(false)
    if (onPrototypeChange) {
      if (localModel) {
        onPrototypeChange({
          prototypeName: data.prototypeName,
          modelId: localModel.id,
          modelName: undefined,
        })
      } else {
        onPrototypeChange({
          prototypeName: data.prototypeName,
          modelName: data.modelName,
          modelId: undefined,
        })
      }
    }
  }, [loading, localModel, data.modelName, data.prototypeName])

  return (
    <form
      onSubmit={createNewPrototype}
      className="flex max-h-[80vh] w-[40vw] min-w-[400px] flex-col bg-da-white p-4 lg:w-[25vw]"
    >
      <DaText variant="title" className="text-da-primary-500">
        New Prototype
      </DaText>

      {!currentModel &&
        (contributionModels && !isFetchingModelContribution && localModel ? (
          <DaSelect
            defaultValue={localModel.id}
            label="Model Name *"
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
            <DaLoader className="mr-1 h-4 w-4" />
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
            inputClassName="bg-da-gray-light"
          />
        ))}

      <DaInput
        name="name"
        value={data.prototypeName}
        onChange={(e) => handleChange('prototypeName', e.target.value)}
        placeholder="Name"
        label="Prototype Name *"
        className="mt-4"
      />

      {error && (
        <DaText variant="small" className="mt-4 text-da-accent-500">
          {error}
        </DaText>
      )}

      <DaButton
        disabled={disabled}
        type="submit"
        variant="gradient"
        className={clsx('mt-8 w-full', hideCreateButton && '!hidden')}
      >
        {loading && <TbLoader className="mr-2 animate-spin text-lg" />}
        Create
      </DaButton>
    </form>
  )
}

export default FormCreatePrototype
