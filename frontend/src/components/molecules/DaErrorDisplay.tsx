// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { Button } from '@/components/atoms/button'
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
        <TbExclamationCircle className="text-3xl text-primary" />
        <p className="text-xl font-semibold mt-3">Oops! Something went wrong.</p>

        <p className="mt-1 text-sm max-w-[min(800px,calc(100vw-80px))] max-h-[min(600px,calc(100vh-200px))] overflow-y-auto">
          {error}
        </p>

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

export default DaErrorDisplay
