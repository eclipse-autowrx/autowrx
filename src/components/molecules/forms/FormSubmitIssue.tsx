import { DaButton } from '@/components/atoms/DaButton'
import { DaInput } from '@/components/atoms/DaInput'
import { DaText } from '@/components/atoms/DaText'
import { FormEvent, useState, useEffect } from 'react'
import { TbLoader } from 'react-icons/tb'
import { createFeedback } from '@/services/feedback.service'
import useCurrentModel from '@/hooks/useCurrentModel'
import { isAxiosError } from 'axios'
import { DaTextarea } from '@/components/atoms/DaTextarea'
import axios from 'axios'
import { GithubUser } from '@/types/github.type'
import { DaAvatar } from '@/components/atoms/DaAvatar'
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
    console.log(`api`, api)
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
    console.log(`submitIssue`)
    console.log(`title`, title)
    console.log(`content`, content)
    // e.preventDefault()
    try {
      setLoading(true)
      if (!title || !content) {
        console.log('No title or content')
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
      console.log(error)
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
      className="flex flex-col w-[40vw] max-h-[80vh] bg-da-white py-4"
    >
      <div className="flex flex-col overflow-y-auto px-4">
        <DaText variant="title" className="text-da-primary-500">
          Propose this API to COVESA
        </DaText>

        <DaInput
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          label="Title"
          className="mt-4"
        />

        <DaTextarea
          rows={5}
          name="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your proposal..."
          label="Content"
          className="mt-4"
        />

        {user && (
          <div className="flex gap-2 mt-4 items-center">
            Submitting as: {user?.login}{' '}
            <DaAvatar className="h-8 w-8" src={user?.avatar_url} />
          </div>
        )}
      </div>

      <div className="px-4">
        <DaButton
          disabled={loading}
          type="button"
          variant="gradient"
          className="w-full mt-8"
          onClick={submitIssue}
        >
          {loading && <TbLoader className="animate-spin text-lg mr-2" />}
          Submit
        </DaButton>
      </div>
    </form>
  )
}

export default SubmitIssueForm
