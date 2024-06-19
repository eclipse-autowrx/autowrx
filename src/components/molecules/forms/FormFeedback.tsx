import { DaButton } from '@/components/atoms/DaButton'
import { DaInput } from '@/components/atoms/DaInput'
import { DaText } from '@/components/atoms/DaText'
import DaStarsRating from '@/components/atoms/DaStarsRating'
import { FormEvent, useState } from 'react'
import { TbLoader } from 'react-icons/tb'
import { createFeedback } from '@/services/feedback.service'
import { FeedbackCreate } from '@/types/model.type'
import useCurrentModel from '@/hooks/useCurrentModel'
import useCurrentPrototype from '@/hooks/useCurrentPrototype'
import useListPrototypeFeedback from '@/hooks/useListPrototypeFeedback'

const initialState = {
  interviewee: '',
  organization: '',
  needsAddressed: 0,
  relevance: 0,
  easeOfUse: 0,
  questions: '',
  recommendations: '',
}

const FeedbackForm = () => {
  const { data: prototype } = useCurrentPrototype()
  const { data: model } = useCurrentModel()
  const { refetch } = useListPrototypeFeedback(prototype?.id || '')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [data, setData] = useState(initialState)

  const handleChange = (name: keyof typeof data, value: string | number) => {
    setData((prev) => ({ ...prev, [name]: value }))
  }

  const submitFeedback = async (e: FormEvent<HTMLFormElement>) => {
    if (!prototype || !prototype.id || !model) return
    e.preventDefault()
    try {
      setLoading(true)
      const payload: FeedbackCreate = {
        interviewee: {
          name: data.interviewee,
          organization: data.organization,
        },
        recommendation: data.recommendations,
        question: data.questions,
        model_id: model.id,
        score: {
          easy_to_use: data.easeOfUse,
          need_address: data.needsAddressed,
          relevance: data.relevance,
        },
        ref: prototype.id,
        ref_type: 'prototype',
      }

      await createFeedback(payload)
      await refetch()
      setData(initialState)
    } catch (error) {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={submitFeedback}
      className="flex flex-col w-[400px] min-w-[400px] px-2 md:px-6 py-4 bg-da-white"
    >
      <DaText variant="title" className="text-da-primary-500">
        End User Give Feedback
      </DaText>

      <DaInput
        name="interviewee"
        value={data.interviewee}
        onChange={(e) => handleChange('interviewee', e.target.value)}
        placeholder="Interviewee?"
        label="Interviewee?"
        className="mt-4"
      />

      <DaInput
        name="organization"
        value={data.organization}
        onChange={(e) => handleChange('organization', e.target.value)}
        placeholder="From organization"
        label="From organization"
        className="mt-4"
      />

      {/* Star ratings for Needs Addressed, Relevance, and Ease of Use */}
      <div className="mt-4 flex items-center">
        <DaText variant="regular-bold">Needs addressed?</DaText>
        <DaStarsRating
          initialRating={data.needsAddressed}
          onChange={(value) => handleChange('needsAddressed', value)}
        />
      </div>

      <div className="mt-4 flex items-center">
        <DaText variant="regular-bold">Relevance?</DaText>
        <DaStarsRating
          initialRating={data.relevance}
          onChange={(value) => handleChange('relevance', value)}
        />
      </div>

      <div className="mt-4 flex items-center">
        <DaText variant="regular-bold">Ease of use</DaText>
        <DaStarsRating
          initialRating={data.easeOfUse}
          onChange={(value) => handleChange('easeOfUse', value)}
        />
      </div>

      <DaInput
        name="questions"
        value={data.questions}
        onChange={(e) => handleChange('questions', e.target.value)}
        placeholder="Write your questions..."
        label="Questions"
        className="mt-4"
      />

      <DaInput
        name="recommendations"
        value={data.recommendations}
        onChange={(e) => handleChange('recommendations', e.target.value)}
        placeholder="Write your recommendations..."
        label="Recommendations"
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
        Submit
      </DaButton>
    </form>
  )
}

export default FeedbackForm
