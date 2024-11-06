import React, { useEffect, useState } from 'react'
import { DaButton } from '@/components/atoms/DaButton'
import { DaInput } from '@/components/atoms/DaInput'
import publishToGithub from '@/lib/publicToGithub'
import DaText from '@/components/atoms/DaText'
import useGithubAuth from '@/hooks/useGithubAuth'
import { TbBrandGithub, TbExternalLink, TbLink } from 'react-icons/tb'
import { set } from 'lodash'

interface DaVelocitasProjectCreatorProps {
  code: string
  vssPayload: any
  onClose: () => void
}

const DaVelocitasProjectCreator: React.FC<DaVelocitasProjectCreatorProps> = ({
  code,
  vssPayload,
  onClose,
}) => {
  const [repoName, setRepoName] = useState('')
  const [repoUrl, setRepoUrl] = useState<string | null>(null)
  const { onTriggerAuth, loading, user, access, error } = useGithubAuth()
  const [isCreatingRepo, setIsCreatingRepo] = useState(false)

  useEffect(() => {
    onTriggerAuth()
  }, [])

  const handleCreateRepo = async () => {
    setIsCreatingRepo(true)
    setRepoUrl(null)

    if (!repoName || !access || !user) {
      return
    }

    try {
      await publishToGithub({
        accessToken: access.token,
        user_login: user.login,
        code,
        repo: repoName,
        vss_payload: vssPayload,
      })
      setRepoUrl(`https://github.com/${user.login}/${repoName}`)
    } catch (error) {
      console.error('Failed to create repository:', error)
    } finally {
      setIsCreatingRepo(false)
    }
  }

  return (
    <div className="max-w-xl min-w-[400px] lg:min-w-[550px] mx-auto">
      <DaText variant="sub-title" className="text-da-primary-500 items-center">
        Create Velocitas Project Repository
      </DaText>
      <DaInput
        label="Repository Name"
        value={repoName}
        onChange={(e) => setRepoName(e.target.value)}
        className="my-4"
      />
      {error && <p className="text-red-500 my-4">{error}</p>}
      <div className="flex mt-4 justify-between w-full items-center">
        {repoUrl && (
          <button
            onClick={() => window.open(repoUrl, '_blank')}
            className="flex items-center !text-blue-500 hover:bg-blue-50 px-2 py-1 rounded-lg !text-sm"
          >
            <TbExternalLink className="size-4 mr-1" />
            Open Repository
          </button>
        )}
        <div className="grow"></div>
        <div className="flex space-x-2">
          <DaButton
            onClick={onClose}
            size="sm"
            variant="outline-nocolor"
            className="ml-2"
          >
            Cancel
          </DaButton>
          <DaButton
            size="sm"
            onClick={handleCreateRepo}
            disabled={isCreatingRepo || !repoName}
          >
            {isCreatingRepo ? 'Creating...' : 'Create Repository'}
          </DaButton>
        </div>
      </div>
    </div>
  )
}

export default DaVelocitasProjectCreator
