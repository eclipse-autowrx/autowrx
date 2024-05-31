import { DaButton } from '@/components/atoms/DaButton'
import { DaText } from '@/components/atoms/DaText'
import { DaTextarea } from '@/components/atoms/DaTextarea'
import { CVI } from '@/data/CVI'
import { isAxiosError } from 'axios'
import { FormEvent, useState } from 'react'
import { TbLoader } from 'react-icons/tb'
import { useNavigate } from 'react-router-dom'

const initialState = {
  content: '',
}
const FormCreateDiscussion = () => {
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
      // const body: ModelCreate = {
      //   cvi: data.cvi,
      //   main_api: data.mainApi,
      //   name: data.name,
      // }
      // const modelId = await createModelService(body)
      // navigate(`/model/${modelId}`)
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
    <form onSubmit={createNewModel} className="flex flex-col bg-da-white">
      {/* Content */}
      <DaTextarea
        value={data.content}
        onChange={(e) => handleChange('content', e.target.value)}
        placeholder="Share your thought"
      />

      <div className="grow"></div>

      {/* Error */}
      {error && (
        <DaText variant="small" className="mt-2 text-da-accent-500">
          {error}
        </DaText>
      )}

      {/* Action */}
      <DaButton disabled={loading} type="submit" className="w-fit ml-auto mt-5">
        {loading && <TbLoader className="animate-spin text-lg mr-2" />}
        Submit
      </DaButton>
    </form>
  )
}

export default FormCreateDiscussion
