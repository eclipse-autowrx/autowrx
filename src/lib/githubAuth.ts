// githubAuth.ts
import axios from 'axios'

export const initializeGitHubLogin = () => {
  // Store the current path so we can return to it after authentication
  sessionStorage.setItem(
    'postAuthRedirect',
    window.location.pathname + window.location.search,
  )

  // Define the static callback URI
  const url = new URLSearchParams({
    client_id: import.meta.env.VITE_GITHUB_CLIENT_ID || '',
    scope: 'user public_repo repo notifications gist read:org',
    redirect_uri: `${window.location.origin}/auth/callback`, // Static callback URI
  })

  // Redirect to GitHub's OAuth page
  window.location.href = `https://github.com/login/oauth/authorize?${url.toString()}`
}

export const handleGitHubCallback = async (code: string) => {
  try {
    console.log('Exchanging code for access token through backend...')

    const response = await axios.post(
      'http://localhost:5000/api/github-oauth',
      { code },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )

    const accessToken = response.data.accessToken
    console.log('Access token received from backend:', accessToken)

    const user = await axios.get(`https://api.github.com/user`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    console.log('User data retrieved:', user.data)

    // Store access token and user data as needed
    sessionStorage.setItem('githubAccessToken', accessToken)
    sessionStorage.setItem('githubUser', JSON.stringify(user.data))

    return { user: user.data, accessToken }
  } catch (error) {
    console.error('Error retrieving GitHub access token:', error)
    throw new Error('Failed to retrieve GitHub access token.')
  }
}
