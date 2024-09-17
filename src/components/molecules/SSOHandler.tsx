import { loginRequest } from '@/services/sso.service'
import { useIsAuthenticated, useMsal } from '@azure/msal-react'
import { ssoService } from '@/services/auth.service'
import { toast } from 'react-toastify'
import { isAxiosError } from 'axios'

interface SSOHandlerProps {
  children: React.ReactNode
  setSSOLoading: (loading: boolean) => void
}

const SSOHandler = ({ children, setSSOLoading }: SSOHandlerProps) => {
  const { instance, accounts } = useMsal()
  const isAuthenticated = useIsAuthenticated()

  const handleSSOAuth = async () => {
    try {
      // Attempt to acquire token silently
      if (accounts.length > 0) {
        const response = await instance.acquireTokenSilent({
          ...loginRequest,
          account: accounts[0],
        })
        handleSSOAuthSuccess(response.accessToken)
      } else {
        throw new Error('No accounts found')
      }
    } catch (e) {
      // console.log(
      //   'Silent token acquisition failed, falling back to loginPopup: ',
      //   e,
      // )
      // Fall back to interactive login if silent token acquisition fails
      await instance
        .loginPopup(loginRequest)
        .then((response) => {
          handleSSOAuthSuccess(response.accessToken)
        })
        .catch((error) => {
          if (isAxiosError(error)) {
            toast.error(
              error.response?.data.message || 'SSO authentication failed',
            )
            return
          }
          toast.error(error?.errorMessage || 'SSO authentication failed')
        })
        .finally(() => setSSOLoading(false))
    }
  }

  const handleSSOAuthSuccess = async (accessToken: string) => {
    try {
      await ssoService(accessToken)
      window.location.href = window.location.href
    } catch (error) {
      console.log(error)
      if (isAxiosError(error)) {
        toast.error(error.response?.data.message || 'SSO authentication failed')
        return
      }
      toast.error('SSO authentication failed')
    }
  }

  return <div onClick={handleSSOAuth}>{children}</div>
}

export default SSOHandler
