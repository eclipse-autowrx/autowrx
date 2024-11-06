import axios from 'axios'

const getLoginCode = () => {
  return new Promise<string>((resolve, reject) => {
    const url = new URLSearchParams({
      client_id: import.meta.env.VITE_GITHUB_CLIENT_ID || '',
      scope: 'user public_repo repo notifications gist read:org',
    })

    // Open the authentication tab
    let authTab = window.open(
      `https://github.com/login/oauth/authorize?${url.toString()}`,
      '_blank',
    )

    // Ensure the tab opened successfully
    if (!authTab) {
      console.error(
        'Failed to open authentication tab or tab already be closed',
      )
      return
    }

    // Poll every 500ms to check for 'code' in the URL, handling cross-origin errors
    const intervalId = setInterval(() => {
      try {
        // Ensure authTab is defined and still open
        if (!authTab || authTab.closed) {
          clearInterval(intervalId)
          reject(
            new Error(
              'Authentication was canceled or the tab was closed before login.',
            ),
          )
          return
        }

        // Attempt to access authTab's location
        const params = new URLSearchParams(authTab.location.search || '')

        // Check if the URL has the 'code' parameter
        if (params.has('code')) {
          const code = params.get('code')
          clearInterval(intervalId) // Stop polling
          authTab.close() // Close the tab
          authTab = null // Set to null to avoid future access
          resolve(code as string) // Resolve with the authorization code
        }

        // If there's an error parameter in the URL
        if (params.has('error')) {
          const error = params.get('error')
          clearInterval(intervalId)
          authTab?.close()
          authTab = null // Set authTab to null to avoid further access
          reject(new Error(`GitHub OAuth error: ${error}`))
        }
      } catch (error) {
        // Log the cross-origin access error and keep polling until redirect completes
        console.log('Waiting for redirect to accessible URL...', error)
      }
    }, 500)

    // Separate interval to detect manual closure of the tab
    const tabClosedCheck = setInterval(() => {
      if (authTab && authTab.closed) {
        console.log('Auth tab closed manually by the user.')
        clearInterval(intervalId)
        clearInterval(tabClosedCheck)
        authTab = null // Set to null to avoid future access
        reject(
          new Error(
            'The authentication tab was closed manually before login completed.',
          ),
        )
      }
    }, 500)
  })
}

export const loginToGithub = async () => {
  try {
    const code = await getLoginCode()

    // Use the new backend server for token exchange
    const response = await axios.post(
      'http://localhost:5000/api/github-oauth',
      { code },
    )
    const accessToken = response.data.accessToken

    if (!accessToken) {
      throw new Error('Failed to retrieve access token.')
    }

    const user = await axios
      .get(`https://api.github.com/user`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      .then((res) => res.data)

    // sessionStorage.setItem('githubAccessToken', accessToken)
    // sessionStorage.setItem('githubUser', JSON.stringify(user))

    return { user, accessToken }
  } catch (error) {
    throw new Error(`GitHub authentication failed: ${error}`)
  }
}
