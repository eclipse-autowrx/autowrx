import { DaButton } from '@/components/atoms/DaButton'
import { DaInput } from '@/components/atoms/DaInput'
import { DaSelect, DaSelectItem } from '@/components/atoms/DaSelect'
import { DaText } from '@/components/atoms/DaText'
import { FormEvent, useState } from 'react'
import { TbLoader } from 'react-icons/tb'
import { createPrototypeService } from '@/services/prototype.service'
import { useNavigate } from 'react-router-dom'

const initialState = {
  name: '',
  problem: '',
  saysWho: '',
  solution: '',
  complexity: 3,
}

const complexityLevels = ['Lowest', 'Low', 'Medium', 'High', 'Highest']

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
}

const FormCreatePrototype = ({ model_id }: FormCreatePrototypeProps) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [data, setData] = useState(initialState)
  const navigate = useNavigate()

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
        code: `from sdv_model import Vehicle
import plugins
from browser import aio

vehicle = Vehicle()`,
        complexity_level: data.complexity,
        customer_journey: MockDefaultJourney,
        description: {
          problem: data.problem,
          says_who: data.saysWho,
          solution: data.solution,
          status: '',
        },
        image_file: 'https://placehold.co/600x400',
        skeleton: '{}',
        tags: [],
        widget_config: '[]',
        autorun: true,
      }
      await createPrototypeService(body)
      setData(initialState)
      // navigate(`/model/${model_id}/library`)
      window.location.reload() // Reload the current page -> Fix reload later
    } catch (error) {
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
      <DaInput
        name="problem"
        value={data.problem}
        onChange={(e) => handleChange('problem', e.target.value)}
        placeholder="Problem"
        label="Problem"
        className="mt-4"
      />
      <DaInput
        name="saysWho"
        value={data.saysWho}
        onChange={(e) => handleChange('saysWho', e.target.value)}
        placeholder="Says who?"
        label="Says who?"
        className="mt-4"
      />
      <DaInput
        name="solution"
        value={data.solution}
        onChange={(e) => handleChange('solution', e.target.value)}
        placeholder="Solution"
        label="Solution"
        className="mt-4"
      />
      <DaSelect
        value={complexityLevels[data.complexity - 1]}
        label="Complexity"
        wrapperClassName="mt-4"
        onValueChange={(value) =>
          handleChange('complexity', complexityLevels.indexOf(value) + 1)
        }
      >
        {complexityLevels.map((level, index) => (
          <DaSelectItem key={index} value={level}>
            {level}
          </DaSelectItem>
        ))}
      </DaSelect>

      <div className="grow"></div>

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
