import { useEffect } from 'react'

const PageAuthSuccess = () => {
  useEffect(() => {
    window.close()
  }, [])

  return <div>Authentication succeeded.</div>
}

export default PageAuthSuccess
