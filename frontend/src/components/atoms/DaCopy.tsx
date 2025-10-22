// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { TbCopy } from 'react-icons/tb'
import { useToast } from '../molecules/toaster/use-toast'
import { Suspense, lazy } from 'react'
import { cn } from '@/lib/utils'

interface DaCopyProps {
  textToCopy: string
  children?: React.ReactNode
  showIcon?: boolean
  label?: string
  className?: string
  onCopied?: () => void
}

const DaCopy = ({
  textToCopy,
  children,
  showIcon = true,
  label,
  className,
  onCopied,
}: DaCopyProps) => {
  const { toast } = useToast()

  const handleCopyClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation() // Ensure the event does not propagate
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        toast({
          title: ``,
          description: (
            <div className="flex flex-col space-y-2">
              <span className="text-sm font-semibold text-primary">
                {textToCopy}
              </span>
              <span className="text-sm font-medium ">
                Copied to clipboard
              </span>
            </div>
          ),
          duration: 2000,
        })
      })
      .catch((err) => {
        console.error('Failed to copy!', err)
      })
    if(onCopied) {
      onCopied()
    }
  }

  return (
    <Suspense>
      <div
        className={cn(
          'flex w-full items-center cursor-pointer truncate',
          className,
        )}
        onClick={handleCopyClick}
      >
        {children}
        <div className="flex items-center">
          {label && (
            <span
              
              className="ml-1 text-primary cursor-pointer"
            >
              {label}
            </span>
          )}
          {showIcon && (
            <TbCopy className="text-muted-foreground hover:text-primary ml-1" />
          )}
        </div>
      </div>
    </Suspense>
  )
}

export { DaCopy }
