// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { Button } from '@/components/atoms/button'
import { getWithExpiry, setWithExpiry } from '@/lib/storage.ts'
import { useEffect } from 'react'
import { FallbackProps } from 'react-error-boundary'
import { TbExclamationCircle } from 'react-icons/tb'

const ErrorFallback = ({ error }: FallbackProps) => {
  const errorMessage = error instanceof Error ? error.message : String(error)

  useEffect(() => {
    const chunkFailedMessage = /Loading chunk [\d]+ failed/
    if (
      errorMessage &&
      (chunkFailedMessage.test(errorMessage) ||
        errorMessage.includes('Failed to fetch dynamically imported module') ||
        errorMessage.includes('Importing a module script failed'))
    ) {
      if (!getWithExpiry('chunk_failed')) {
        setWithExpiry('chunk_failed', true, 3000)
        window.location.href = window.location.href
      }
    }
  }, [errorMessage])

  return (
    <div className="h-screen w-screen flex">
      <div className="m-auto flex h-full flex-col items-center justify-center">
        <TbExclamationCircle className="text-3xl text-primary" />
        <p className="text-xl font-semibold mt-3">Oops! Something went wrong.</p>
        {(!import.meta?.env?.MODE ||
          import.meta?.env?.MODE === 'development') && (
            <p className="mt-1 text-sm max-w-[min(800px,calc(100vw-80px))] max-h-[min(600px,calc(100vh-200px))] overflow-y-auto">
              {errorMessage}
            </p>
          )}
        <Button
          size="sm"
          className="mt-3"
          onClick={() => (window.location.href = window.location.href)}
        >
          Reload page
        </Button>
      </div>
    </div>
  )
}

export default ErrorFallback
