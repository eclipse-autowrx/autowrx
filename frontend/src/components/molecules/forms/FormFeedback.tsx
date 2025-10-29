// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

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
import { isAxiosError } from 'axios'
import { DaTextarea } from '@/components/atoms/DaTextarea'
import { addLog } from '@/services/log.service'
import useSelfProfileQuery from '@/hooks/useSelfProfile'

const initialState = {
  interviewee: '',
  organization: '',
  needsAddressed: 0,
  relevance: 0,
  easeOfUse: 0,
  questions: '',
  recommendations: '',
}

interface FeedbackFormProps {
  onClose: () => void
}

const FeedbackForm = ({ onClose }: FeedbackFormProps) => {
  const { data: prototype } = useCurrentPrototype()
  const { data: model } = useCurrentModel()
  const { refetch } = useListPrototypeFeedback(prototype?.id || '', 1)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [data, setData] = useState(initialState)

  const handleChange = (name: keyof typeof data, value: string | number) => {
    setData((prev) => ({ ...prev, [name]: value }))
  }

  const { data: user } = useSelfProfileQuery()

  const validateForm = () => {
    if (
      !data.interviewee ||
      !data.organization ||
      // !data.questions ||
      // !data.recommendations ||
      !data.needsAddressed ||
      !data.relevance ||
      !data.easeOfUse
    ) {
      setError('Please fill in all the required fields.')
      return false
    }
    setError('')
    return true
  }

  const submitFeedback = async (e: FormEvent<HTMLFormElement>) => {
    if (!prototype || !prototype.id || !model) return
    e.preventDefault()
    if (!validateForm()) return

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

      const feedback = await createFeedback(payload)
      await refetch()
      addLog({
        name: `User ${user?.name} gave feedback`,
        description: `User ${user?.name} with id ${user?.id} as interviewee ${data.interviewee} gave feedback to prototype ${prototype?.name} within model ${model?.name}`,
        type: 'create-feedback',
        create_by: user?.id!,
        ref_id: feedback.id,
        ref_type: 'feedback',
        parent_id: prototype.id,
      })
      setData(initialState)
    } catch (error) {
      if (isAxiosError(error)) {
        setError(error.response?.data?.message ?? 'Something went wrong')
        return
      }
      setError('Something went wrong')
    } finally {
      setLoading(false)
      onClose()
    }
  }

  return (
    <form
      onSubmit={submitFeedback}
      className="flex flex-col w-[40vw] max-h-[80vh] bg-da-white py-4"
    >
      <div className="flex flex-col overflow-y-auto px-4">
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
          <DaText variant="regular-medium">Needs addressed?</DaText>
          <DaStarsRating
            initialRating={data.needsAddressed}
            onChange={(value) => handleChange('needsAddressed', value)}
          />
        </div>

        <div className="mt-4 flex items-center">
          <DaText variant="regular-medium">Relevance?</DaText>
          <DaStarsRating
            initialRating={data.relevance}
            onChange={(value) => handleChange('relevance', value)}
          />
        </div>

        <div className="mt-4 flex items-center">
          <DaText variant="regular-medium">Ease of use?</DaText>
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

        <DaTextarea
          rows={5}
          name="recommendations"
          value={data.recommendations}
          onChange={(e) => handleChange('recommendations', e.target.value)}
          placeholder="Write your recommendations..."
          label="Recommendations"
          className="mt-4 mb-2"
        />

        {error && (
          <DaText variant="small" className="mt-4 text-da-accent-500">
            {error}
          </DaText>
        )}
      </div>

      <div className="px-4">
        <DaButton
          disabled={loading}
          type="submit"
          variant="gradient"
          className="w-full mt-8"
        >
          {loading && <TbLoader className="animate-spin text-lg mr-2" />}
          Submit
        </DaButton>
      </div>
    </form>
  )
}

export default FeedbackForm
