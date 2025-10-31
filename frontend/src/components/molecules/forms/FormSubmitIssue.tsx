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
import { FormEvent, useState, useEffect } from 'react'
import { TbLoader } from 'react-icons/tb'
import { createFeedback } from '@/services/feedback.service'
import useCurrentModel from '@/hooks/useCurrentModel'
import { isAxiosError } from 'axios'
import { Textarea } from '@/components/atoms/textarea'
import axios from 'axios'
import { GithubUser } from '@/types/github.type'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/atoms/avatar'
import { createIssueService } from '@/services/issue.service'
import { Token } from '@/types/token.type'

interface SummitIssueFormProps {
  api: any
  onClose: () => void
  user?: GithubUser
  access?: Token
  refetch?: () => Promise<any>
}

const SubmitIssueForm = ({
  api,
  onClose,
  user,
  access,
  refetch,
}: SummitIssueFormProps) => {
  const { data: model } = useCurrentModel()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  useEffect(() => {
    if (!api) {
      setTitle('')
      setContent('')
    }
    let title = `[digital.auto] Prosose new API: ${api.name}`
    setTitle(title)

    let des = `Description: ${api.description ?? 'nan'}\n`
    des += `Type:\t${api.type || 'nan'}\n`
    if (api.type !== 'branch') {
      des += `DataType:\t${api.datatype ?? 'nan'}\n`
    }
    setContent(des)
  }, [api])

  const submitIssue = async () => {
    // e.preventDefault()
    try {
      setLoading(true)
      if (!title || !content) {
        return
      }
      if (!access || !model?.id) {
        return
      }
      const res = await createIssueService({
        extendedApi: api.name,
        githubAccessToken: access.token,
        model: model?.id!,
        title: title,
        content: content,
      })
      window.open(res.link, '_blank')
      refetch && (await refetch())
      onClose()
    } catch (error) {
      if (isAxiosError(error)) {
        setError(error.response?.data?.message ?? 'Something went wrong')
        return
      }
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      //   onSubmit={submitIssue}
      className="flex flex-col bg-background"
    >
      <div className="flex flex-col overflow-y-auto px-4">
        <h2 className="text-lg font-semibold text-primary">
          Propose this Signal to COVESA
        </h2>

        <div className="flex flex-col mt-4">
          <Label className="mb-2">Title</Label>
          <Input
            name="title"
            value={title}
            onChange={(e: FormEvent<HTMLInputElement>) =>
              setTitle((e.target as HTMLInputElement).value)
            }
            placeholder="Title"
          />
        </div>

        <div className="flex flex-col mt-4">
          <Label className="mb-2">Content</Label>
          <Textarea
            rows={5}
            name="content"
            value={content}
            onChange={(e: FormEvent<HTMLTextAreaElement>) =>
              setContent((e.target as HTMLTextAreaElement).value)
            }
            placeholder="Write your proposal..."
          />
        </div>

        {user && (
          <div className="flex gap-2 mt-4 items-center">
            Submitting as: {user?.login}{' '}
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.avatar_url} />
              <AvatarFallback>{user?.login?.[0] || 'U'}</AvatarFallback>
            </Avatar>
          </div>
        )}
      </div>

      <div className="px-4">
        <Button
          disabled={loading}
          type="button"
          className="w-full mt-8"
          onClick={submitIssue}
        >
          {loading && <TbLoader className="animate-spin text-lg mr-2" />}
          Submit
        </Button>
      </div>
    </form>
  )
}

export default SubmitIssueForm
