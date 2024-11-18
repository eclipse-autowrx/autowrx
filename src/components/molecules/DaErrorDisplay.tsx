import { DaButton } from '@/components/atoms/DaButton'
import { getWithExpiry, setWithExpiry } from '@/lib/storage'
import { cn } from '@/lib/utils'
import { useEffect } from 'react'
import { TbExclamationCircle } from 'react-icons/tb'

type DaErrorDisplay = {
  error: string
  className?: string
}

const DaErrorDisplay = ({ error, className }: DaErrorDisplay) => {
  return (
    <div className={cn('flex w-full h-full', className)}>
      <div className="m-auto flex h-full flex-col items-center justify-center">
        <TbExclamationCircle className="text-3xl text-da-primary-500" />
        <p className="da-label-title mt-3">Oops! Something went wrong.</p>

        <p className="mt-1 da-label-small max-w-[min(800px,calc(100vw-80px))] max-h-[min(600px,calc(100vh-200px))] overflow-y-auto">
          {error}
        </p>

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

export default DaErrorDisplay
