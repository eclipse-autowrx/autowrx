import { Suspense } from 'react'

type SuspenseProps = {
  children?: React.ReactNode
}

const SuspenseProvider = ({ children }: SuspenseProps) => {
  return <Suspense>{children}</Suspense>
}

export default SuspenseProvider
