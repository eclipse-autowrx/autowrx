// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { Label } from '@/components/atoms/label'
import DaStarsRating from '@/components/atoms/DaStarsRating'
import { FormEvent, useState } from 'react'
import { TbLoader } from 'react-icons/tb'
import { createFeedback } from '@/services/feedback.service'
import { FeedbackCreate } from '@/types/model.type'
import useCurrentModel from '@/hooks/useCurrentModel'
import useCurrentPrototype from '@/hooks/useCurrentPrototype'
import { useListPrototypeFeedback } from '@/hooks/useListPrototypeFeedback'
import { isAxiosError } from 'axios'
import { Textarea } from '@/components/atoms/textarea'
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
  const { refetch } = useListPrototypeFeedback(prototype?.id || '')

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
      className="flex flex-col w-[40vw] max-h-[80vh] bg-background py-4"
    >
      <div className="flex flex-col overflow-y-auto px-4">
        <h2 className="text-lg font-semibold text-primary">
          End User Give Feedback
        </h2>

        <div className="flex flex-col mt-4">
          <Label className="mb-2">Interviewee?</Label>
          <Input
            name="interviewee"
            value={data.interviewee}
            onChange={(e: FormEvent<HTMLInputElement>) =>
              handleChange('interviewee', (e.target as HTMLInputElement).value)
            }
            placeholder="Interviewee?"
          />
        </div>

        <div className="flex flex-col mt-4">
          <Label className="mb-2">From organization</Label>
          <Input
            name="organization"
            value={data.organization}
            onChange={(e: FormEvent<HTMLInputElement>) =>
              handleChange('organization', (e.target as HTMLInputElement).value)
            }
            placeholder="From organization"
          />
        </div>

        {/* Star ratings for Needs Addressed, Relevance, and Ease of Use */}
        <div className="mt-4 flex items-center">
          <p className="text-base font-medium mr-2">Needs addressed?</p>
          <DaStarsRating
            initialRating={data.needsAddressed}
            onChange={(value) => handleChange('needsAddressed', value)}
          />
        </div>

        <div className="mt-4 flex items-center">
          <p className="text-base font-medium mr-2">Relevance?</p>
          <DaStarsRating
            initialRating={data.relevance}
            onChange={(value) => handleChange('relevance', value)}
          />
        </div>

        <div className="mt-4 flex items-center">
          <p className="text-base font-medium mr-2">Ease of use?</p>
          <DaStarsRating
            initialRating={data.easeOfUse}
            onChange={(value) => handleChange('easeOfUse', value)}
          />
        </div>

        <div className="flex flex-col mt-4">
          <Label className="mb-2">Questions</Label>
          <Input
            name="questions"
            value={data.questions}
            onChange={(e: FormEvent<HTMLInputElement>) =>
              handleChange('questions', (e.target as HTMLInputElement).value)
            }
            placeholder="Write your questions..."
          />
        </div>

        <div className="flex flex-col mt-4 mb-2">
          <Label className="mb-2">Recommendations</Label>
          <Textarea
            rows={5}
            name="recommendations"
            value={data.recommendations}
            onChange={(e: FormEvent<HTMLTextAreaElement>) =>
              handleChange(
                'recommendations',
                (e.target as HTMLTextAreaElement).value,
              )
            }
            placeholder="Write your recommendations..."
          />
        </div>

        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
      </div>

      <div className="px-4">
        <Button disabled={loading} type="submit" className="w-full mt-8">
          {loading && <TbLoader className="animate-spin text-lg mr-2" />}
          Submit
        </Button>
      </div>
    </form>
  )
}

export default FeedbackForm
