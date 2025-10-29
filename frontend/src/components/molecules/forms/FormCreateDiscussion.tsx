// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { DaButton } from '@/components/atoms/DaButton'
import { DaText } from '@/components/atoms/DaText'
import { DaTextarea } from '@/components/atoms/DaTextarea'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import {
  createDiscussionService,
  updateDiscussionService,
} from '@/services/discussion.service'
import { addLog } from '@/services/log.service'
import {
  DISCUSSION_REF_TYPE,
  Discussion,
  DiscussionCreate,
} from '@/types/discussion.type'
import { isAxiosError } from 'axios'
import { FormEvent, useEffect, useState } from 'react'
import { TbLoader, TbX } from 'react-icons/tb'

const initialState = {
  content: '',
}

interface FormCreateDiscussionProps {
  refId: string
  refType: DISCUSSION_REF_TYPE
  refetch: () => Promise<unknown>
  replyingId?: string
  onCancel?: () => void
  updatingData?: Discussion
}

const FormCreateDiscussion = ({
  refId,
  refType,
  refetch,
  replyingId,
  updatingData,
  onCancel,
}: FormCreateDiscussionProps) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [data, setData] = useState(initialState)

  const { data: user } = useSelfProfileQuery()

  const handleChange = (name: keyof typeof data, value: string) => {
    setData((prev) => ({ ...prev, [name]: value }))
  }

  const createNewDiscussion = async () => {
    try {
      const body: DiscussionCreate = {
        content: data.content,
        ref: refId,
        ref_type: refType,
      }
      if (replyingId) {
        body.parent = replyingId
      }
      const discussion = await createDiscussionService(body)
      await refetch()
      addLog({
        name: `User ${user?.id} created discussion`,
        description: `User ${user?.id} created discussion with id ${discussion.id}}, ref ${refId} and ref_type ${refType}`,
        type: 'create-dicussion',
        create_by: user?.id!,
        parent_id: refId,
        ref_id: discussion?.id,
        ref_type: refType,
      })

      setData(initialState)
      setError('')
    } catch (error) {
      if (isAxiosError(error)) {
        setError(error.response?.data?.message || 'Something went wrong')
        return
      }
      setError('Something went wrong')
    }
  }

  const updateDiscussion = async () => {
    try {
      if (!updatingData) return
      await updateDiscussionService(updatingData.id, {
        content: data.content,
      })
      setData(initialState)
      setError('')
      await refetch()
      addLog({
        name: `User ${user?.id} updated discussion`,
        description: `User ${user?.id} updated discussion with id ${updatingData.id}`,
        type: 'update-discussion',
        create_by: user?.id!,
        parent_id: updatingData?.ref,
        ref_id: updatingData?.id,
        ref_type: 'discussion',
      })
      onCancel && onCancel()
    } catch (error) {
      if (isAxiosError(error)) {
        setError(error.response?.data?.message || 'Something went wrong')
        return
      }
      setError('Something went wrong')
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    if (!updatingData) {
      await createNewDiscussion()
    } else {
      await updateDiscussion()
    }
    setLoading(false)
  }

  useEffect(() => {
    if (updatingData) setData(updatingData)
  }, [updatingData])

  return (
    <form onSubmit={handleSubmit} className="flex flex-col bg-da-white">
      {/* Content */}
      <DaTextarea
        value={data.content}
        onChange={(e) => handleChange('content', e.target.value)}
        placeholder={replyingId ? 'Replying...' : 'Start a discussion'}
      />

      {/* Error */}
      {error && (
        <DaText variant="small" className="mt-2 text-da-accent-500">
          {error}
        </DaText>
      )}

      {/* Action */}
      <div className="flex mt-3 ml-auto gap-2">
        {(replyingId || updatingData) && (
          <DaButton
            onClick={onCancel}
            disabled={loading}
            variant="plain"
            type="button"
            className="w-fit !px-4"
            size="sm"
          >
            Cancel
          </DaButton>
        )}
        <DaButton
          disabled={loading}
          type="submit"
          className="w-fit !px-4"
          size="sm"
        >
          {loading && <TbLoader className="animate-spin text-lg mr-2" />}
          Submit
        </DaButton>
      </div>
    </form>
  )
}

export default FormCreateDiscussion
