import React, { useEffect, useState } from 'react'
import { DaButton } from '@/components/atoms/DaButton'
import { DaInput } from '@/components/atoms/DaInput'
import publishToGithub from '@/lib/publicToGithub'
import DaText from '@/components/atoms/DaText'
import { loginToGithub } from '@/lib/githubAuth'

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
  const [userLogin, setUserLogin] = useState('')
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [repoUrl, setRepoUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const authenticate = async () => {
      try {
        // Initiates GitHub login flow if no token is available
        const { user, accessToken } = await loginToGithub()
        setAccessToken(accessToken)
        setUserLogin(user.login)
      } catch (error) {
        setError('Authentication failed. Please try again.')
        console.log('error', error)
      }
    }

    authenticate() // Trigger GitHub login if no session data is found
  }, [])

  const handleCreateRepo = async () => {
    setLoading(true)
    setError(null)

    console.log('repoName', repoName)
    console.log('accessToken', accessToken)
    console.log('userLogin', userLogin)

    if (!repoName || !accessToken || !userLogin) {
      setError('Please provide all required inputs.')
      setLoading(false)
      return
    }

    try {
      await publishToGithub({
        accessToken,
        user_login: userLogin,
        code,
        repo: repoName,
        vss_payload: vssPayload,
      })
      setRepoUrl(`https://github.com/${userLogin}/${repoName}`)
    } catch (error) {
      setError(
        'Failed to create repository. Please check your inputs and try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl min-w-[400px] lg:min-w-[550px] mx-auto">
      <DaText variant="sub-title" className="text-da-primary-500">
        Create Velocitas Project Repository
      </DaText>
      <DaInput
        label="Repository Name"
        value={repoName}
        onChange={(e) => setRepoName(e.target.value)}
        className="my-4"
      />
      {error && <p className="text-red-500 my-4">{error}</p>}
      <div className="flex justify-end mt-4 space-x-2">
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
          disabled={loading || !repoName}
        >
          {loading ? 'Creating...' : 'Create Repository'}
        </DaButton>
      </div>
      {repoUrl && (
        <p className="mt-4 text-da-primary-500 underline">
          Repository created:{' '}
          <a href={repoUrl} target="_blank" rel="noopener noreferrer">
            {repoUrl}
          </a>
        </p>
      )}
    </div>
  )
}

export default DaVelocitasProjectCreator
