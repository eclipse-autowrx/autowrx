import { DaButton } from '@/components/atoms/DaButton'
import { getWithExpiry, setWithExpiry } from '@/lib/storage'
import { useEffect } from 'react'
import { TbExclamationCircle } from 'react-icons/tb'

type ErrorFallbackProps = {
  error: Error
}

const ErrorFallback = ({ error }: ErrorFallbackProps) => {
  useEffect(() => {
    const chunkFailedMessage = /Loading chunk [\d]+ failed/
    if (
      error?.message &&
      (chunkFailedMessage.test(error.message) ||
        error.message.includes('Failed to fetch dynamically imported module') ||
        error.message.includes('Importing a module script failed'))
    ) {
      if (!getWithExpiry('chunk_failed')) {
        setWithExpiry('chunk_failed', true, 3000)
        window.location.href = window.location.href
      }
    }
  }, [error])

  return (
    <div className="h-screen w-screen flex">
      <div className="m-auto flex h-full flex-col items-center justify-center">
        <TbExclamationCircle className="text-3xl text-da-primary-500" />
        <p className="da-label-title mt-3">Oops! Something went wrong.</p>
        {(!import.meta?.env?.MODE ||
          import.meta?.env?.MODE === 'development') && (
          <p className="mt-1 da-label-small max-w-[min(800px,calc(100vw-80px))] max-h-[min(600px,calc(100vh-200px))] overflow-y-auto">
            {error?.message}
          </p>
        )}
        <DaButton
          size="sm"
          className="mt-3"
          onClick={() => (window.location.href = window.location.href)}
        >
          Reload page
        </DaButton>
      </div>
    </div>
  )
}

export default ErrorFallback
