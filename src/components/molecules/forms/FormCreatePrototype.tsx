import { DaButton } from '@/components/atoms/DaButton'
import { DaInput } from '@/components/atoms/DaInput'
import { DaText } from '@/components/atoms/DaText'
import { FormEvent, useState } from 'react'
import { TbCircleCheckFilled, TbLoader } from 'react-icons/tb'
import { createPrototypeService } from '@/services/prototype.service'
import { useToast } from '../toaster/use-toast'
import useListModelPrototypes from '@/hooks/useListModelPrototypes'
import useCurrentModel from '@/hooks/useCurrentModel'
import { isAxiosError } from 'axios'

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
  model_id: string
  onClose: () => void
}

const FormCreatePrototype = ({
  model_id,
  onClose,
}: FormCreatePrototypeProps) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [data, setData] = useState(initialState)
  const { data: model } = useCurrentModel()
  const { refetch } = useListModelPrototypes(model ? model.id : '')
  const { toast } = useToast()

  const handleChange = (name: keyof typeof data, value: string | number) => {
    setData((prev) => ({ ...prev, [name]: value }))
  }

  const createNewModel = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      setLoading(true)
      const body = {
        model_id: model_id,
        name: data.name,
        state: 'development',
        apis: { VSC: [], VSS: [] },
        code: `from vehicle import Vehicle
import time
import asyncio
import signal

vehicle = Vehicle("EV Car")

async def main():
    print("Hello")

    for i in range(3):
        time.sleep(1)
        speed = (await vehicle.AverageSpeed.get()).value
        print(f"{i} Speed: {speed}")

    print("Goodbye")


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
        image_file: 'https://placehold.co/600x400',
        skeleton: '{}',
        tags: [],
        widget_config: '[]',
        autorun: true,
      }
      await createPrototypeService(body)
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
      setData(initialState)
      onClose()
    } catch (error) {
      if (isAxiosError(error)) {
        setError(error.response?.data?.message || 'Something went wrong')
        return
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={createNewModel}
      className="flex flex-col w-[400px] min-w-[400px] px-2 md:px-6 py-4 bg-da-white"
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

      {error && (
        <DaText variant="small" className="mt-4 text-da-accent-500">
          {error}
        </DaText>
      )}

      <DaButton
        disabled={loading}
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
