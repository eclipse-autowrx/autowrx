// SSO Handler stub
import { ReactNode } from 'react'

interface SSOHandlerProps {
  setSSOLoading?: (loading: boolean) => void
  children: ReactNode
}

const SSOHandler = ({ setSSOLoading, children }: SSOHandlerProps) => {
  return <>{children}</>
}

export default SSOHandler
