import React, { useEffect, useState } from 'react'
import { DaButton } from '@/components/atoms/DaButton'
import { DaInput } from '@/components/atoms/DaInput'
import publishToGithub from '@/lib/publicToGithub'
import DaText from '@/components/atoms/DaText'

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
    // Listen for the GitHub OAuth code message
    const handleMessage = (event: MessageEvent) => {
      // Check if the message is from the expected origin
      if (event.origin !== 'https://digitalauto-dev.netlify.app') return

      // Ensure the message contains the GitHub auth code
      if (event.data && event.data.type === 'github-auth-code') {
        const { code } = event.data
        console.log(
          'Received GitHub auth code in DaVelocitasProjectCreator:',
          code,
        )

        // Store the code as accessToken or proceed with further actions
        if (code) {
          setAccessToken(code) // Replace with actual token exchange logic if needed
        }
      }
    }

    // Add the event listener for messages
    window.addEventListener('message', handleMessage)

    // Cleanup the event listener on component unmount
    return () => {
      window.removeEventListener('message', handleMessage)
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
    <div className="max-w-xl min-w-[400px] mx-auto">
      <DaText variant="sub-title" className="text-da-primary-500">
        Create Velocitas Project Repository
      </DaText>
      {error && <p className="text-red-500 my-4">{error}</p>}
      <DaInput
        label="Repository Name"
        value={repoName}
        onChange={(e) => setRepoName(e.target.value)}
        className="my-4"
      />
      <div className="flex justify-end mt-4 space-x-2">
        <DaButton
          onClick={onClose}
          size="sm"
          variant="outline-nocolor"
          className="ml-2 bg-gray-500 hover:bg-gray-600"
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
