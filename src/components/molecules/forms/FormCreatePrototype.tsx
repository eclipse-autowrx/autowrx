import { DaButton } from '@/components/atoms/DaButton'
import { DaInput } from '@/components/atoms/DaInput'
import { DaSelect, DaSelectItem } from '@/components/atoms/DaSelect'
import { DaText } from '@/components/atoms/DaText'
import { FormEvent, useState } from 'react'
import { TbLoader } from 'react-icons/tb'

const initialState = {
  name: '',
  problem: '',
  saysWho: '',
  solution: '',
  complexity: 3,
}

const complexityLevels = ['Lowest', 'Low', 'Medium', 'High', 'Highest']

const FormCreatePrototype = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [data, setData] = useState(initialState)

  const handleChange = (name: keyof typeof data, value: string | number) => {
    setData((prev) => ({ ...prev, [name]: value }))
  }

  const createNewModel = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      setLoading(true)
      const body = {
        name: data.name,
        problem: data.problem,
        saysWho: data.saysWho,
        solution: data.solution,
        complexity: data.complexity,
      }
      // Create new prototype logic
      setData(initialState)
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
