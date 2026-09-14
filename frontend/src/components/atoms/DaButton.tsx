// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface DaButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode
  className?: string | undefined,
  dataId?: string,
  variant?:
    | 'solid'
    | 'outline'
    | 'outline-nocolor'
    | 'text'
    | 'plain'
    | 'link'
    | 'gradient'
    | 'secondary'
    | 'destructive'
    | 'dash'
    | 'editor'
  size?: 'sm' | 'md' | 'lg'
}

const DaButton = React.forwardRef<HTMLButtonElement, DaButtonProps>(
  ({ className, variant = 'solid', size = 'md', dataId, ...props }, ref) => {
    return (
      <button
        data-id={dataId}
        className={cn(
          `da-btn`,
          `da-btn-${variant}`,
          `da-btn-${size}`,
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
DaButton.displayName = 'DaButton'

export { DaButton }
