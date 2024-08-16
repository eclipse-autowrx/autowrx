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
import { Model, ModelLite } from '@/types/model.type'

const initialState = {
  name: '',
}

const MockDefaultJourney = `
#Step 1
Who: Driver
What: Wipers turned on manually
Customer TouchPoints: Windshield wiper switch
#Step 2
Who: User
What: User opens the car door/trunk and the open status of door/trunk is set to true
Customer TouchPoints: Door/trunk handle
#Step 3
Who: System
What: The wiping is immediately turned off by the software and user is notified
Customer TouchPoints: Notification on car dashboard and mobile app
`

interface FormCreatePrototypeProps {
  onClose?: () => void
}

const FormCreatePrototype = ({ onClose }: FormCreatePrototypeProps) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [data, setData] = useState(initialState)
  const { data: model } = useCurrentModel()
  const { data: contributionModels, isLoading: isFetchingModelContribution } =
    useListModelContribution()
  const [localModel, setLocalModel] = useState<ModelLite>()
  const { refetch } = useListModelPrototypes(model ? model.id : '')
  const { toast } = useToast()
  const navigate = useNavigate()

  const { data: currentUser } = useSelfProfileQuery()

  const handleChange = (name: keyof typeof data, value: string | number) => {
    setData((prev) => ({ ...prev, [name]: value }))
  }

  const createNewModel = async (e: FormEvent<HTMLFormElement>) => {
    if (!localModel) return
    e.preventDefault()
    try {
      setLoading(true)
      const body = {
        model_id: localModel.id,
        name: data.name,
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
        customer_journey: MockDefaultJourney,
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
      const response = await createPrototypeService(body)
      await refetch()
      toast({
        title: ``,
        description: (
          <DaText variant="small" className=" flex items-center">
            <TbCircleCheckFilled className="text-green-500 w-4 h-4 mr-2" />
            Prototype "{data.name}" created successfully
          </DaText>
        ),
        duration: 3000,
      })
      await addLog({
        name: `New prototype '${data.name}' under model '${localModel.name}'`,
        description: `Prototype '${data.name}' was created by ${currentUser?.email || currentUser?.name || currentUser?.id}`,
        type: 'new-prototype',
        create_by: currentUser?.id!,
        ref_id: response.id,
        ref_type: 'prototype',
        parent_id: localModel.id,
      })

      setData(initialState)
      // Navigate to new created prototype
      navigate(`/model/${localModel.id}/library/list/${response.id}`)
      if (onClose) onClose()
    } catch (error) {
      if (isAxiosError(error)) {
        setError(error.response?.data?.message || 'Something went wrong')
        return
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (model) {
      const modelLite = {
        id: model.id,
        name: model.name,
        visibility: model.visibility,
        model_home_image_file: model.model_home_image_file || '',
        created_at: model.created_at,
        created_by: model.created_by,
        tags: model.tags,
      }
      setLocalModel(modelLite)
    }
  }, [model])

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
    <form
      onSubmit={createNewModel}
      className="flex flex-col w-[30vw] lg:w-[25vw] max-h-[80vh] p-4 bg-da-white"
    >
      <DaText variant="title" className="text-da-primary-500">
        Create New Prototype
      </DaText>

      <DaInput
        name="name"
        value={data.name}
        onChange={(e) => handleChange('name', e.target.value)}
        placeholder="Name"
        label="Name *"
        className="mt-4"
      />

      {!model &&
        (contributionModels && !isFetchingModelContribution && localModel ? (
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
        ) : isFetchingModelContribution ? (
          <DaText variant="small" className="mt-4 text-da-accent-500">
            Loading...
          </DaText>
        ) : (
          <DaText variant="small" className="mt-4 text-da-accent-500">
            No contribution model found.
          </DaText>
        ))}

      {error && (
        <DaText variant="small" className="mt-4 text-da-accent-500">
          {error}
        </DaText>
      )}

      <DaButton
        disabled={loading || !localModel}
        type="submit"
        variant="gradient"
        className="w-full mt-8"
      >
        {loading && <TbLoader className="animate-spin text-lg mr-2" />}
        Create
      </DaButton>
    </form>
  )
}

export default FormCreatePrototype
