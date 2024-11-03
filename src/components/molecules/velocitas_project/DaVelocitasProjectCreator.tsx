import React, { useState, useEffect } from 'react'
import { DaButton } from '@/components/atoms/DaButton'
import { DaInput } from '@/components/atoms/DaInput'
import { initializeGitHubLogin } from '@/lib/githubAuth' // Import the new GitHub login function
import publishToGithub from '@/lib/publicToGithub'

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
    const token = sessionStorage.getItem('githubAccessToken')
    const user = sessionStorage.getItem('githubUser')

    if (token && user) {
      setAccessToken(token)
      setUserLogin(JSON.parse(user).login)
    } else {
      // Initiate GitHub login if no token is available
      initializeGitHubLogin()
    }
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
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">
        Create Velocitas Project Repository
      </h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <DaInput
        label="Repository Name"
        value={repoName}
        onChange={(e) => setRepoName(e.target.value)}
      />
      <div className="flex justify-end mt-4">
        <DaButton onClick={handleCreateRepo} disabled={loading || !repoName}>
          {loading ? 'Creating...' : 'Create Repository'}
        </DaButton>
        <DaButton
          onClick={onClose}
          className="ml-2 bg-gray-500 hover:bg-gray-600"
        >
          Cancel
        </DaButton>
      </div>
      {repoUrl && (
        <p className="mt-4 text-green-600">
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
