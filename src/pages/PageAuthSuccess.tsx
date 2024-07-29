import { useEffect } from 'react'

const PageAuthSuccess = () => {
  useEffect(() => {
    window.close()
  }, [])

  return <div>Authentication succeeded. You can close this tab now.</div>
}

export default PageAuthSuccess
