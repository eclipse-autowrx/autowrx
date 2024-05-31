import { DaButton } from '@/components/atoms/DaButton'
import { DaText } from '@/components/atoms/DaText'
import { DaTextarea } from '@/components/atoms/DaTextarea'
import { createDiscussionService } from '@/services/discussion.service'
import {
  DISCUSSION_REF_TYPE,
  Discussion,
  DiscussionCreate,
} from '@/types/discussion.type'
import { isAxiosError } from 'axios'
import { FormEvent, useState } from 'react'
import { TbLoader, TbX } from 'react-icons/tb'

const initialState = {
  content: '',
}

interface FormCreateDiscussionProps {
  refId: string
  refType: DISCUSSION_REF_TYPE
  refetch: () => Promise<unknown>
  replying?: {
    id: string
    onCancel: () => void
  }
  updating?: Discussion
}

const FormCreateDiscussion = ({
  refId,
  refType,
  refetch,
  replying,
  updating,
}: FormCreateDiscussionProps) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [data, setData] = useState(initialState)

  const handleChange = (name: keyof typeof data, value: string) => {
    setData((prev) => ({ ...prev, [name]: value }))
  }

  const createNewModel = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      setLoading(true)
      const body: DiscussionCreate = {
        content: data.content,
        ref: refId,
        ref_type: refType,
      }
      if (replying) {
        body.parent = replying.id
      }
      await createDiscussionService(body)
      await refetch()

      setData(initialState)
      setError('')
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
        placeholder={replying ? 'Replying...' : 'Start a discussion'}
      />

      <div className="grow"></div>

      {/* Error */}
      {error && (
        <DaText variant="small" className="mt-2 text-da-accent-500">
          {error}
        </DaText>
      )}

      {/* Action */}
      <div className="flex mt-3 ml-auto gap-2">
        {replying && (
          <DaButton
            onClick={replying?.onCancel}
            disabled={loading}
            variant="plain"
            type="button"
            className="w-fit"
          >
            Cancel
          </DaButton>
        )}
        <DaButton disabled={loading} type="submit" className="w-fit">
          {loading && <TbLoader className="animate-spin text-lg mr-2" />}
          Submit
        </DaButton>
      </div>
    </form>
  )
}

export default FormCreateDiscussion
