// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import * as React from 'react'

import { cn } from '@/lib/utils'

interface DaTextProps {
  children?: React.ReactNode
  className?: string
  variant?:
    | 'regular'
    | 'regular-medium'
    | 'regular-bold'
    | 'small'
    | 'small-bold'
    | 'small-medium'
    | 'sub-title'
    | 'title'
    | 'huge'
    | 'huge-bold'
}

const variantClasses = {
  'regular': 'text-base font-normal',
  'regular-medium': 'text-base font-medium',
  'regular-bold': 'text-base font-semibold',
  'small': 'text-sm font-normal',
  'small-bold': 'text-sm font-semibold',
  'small-medium': 'text-sm font-medium',
  'sub-title': 'text-lg font-semibold',
  'title': 'text-xl font-semibold',
  'huge': 'text-2xl font-normal',
  'huge-bold': 'text-2xl font-semibold',
}

const DaText = React.forwardRef<HTMLLabelElement, DaTextProps>(
  ({ className, variant = 'regular', ...props }, ref) => {
    return (
      <label
        className={cn(variantClasses[variant], className)}
        ref={ref}
        style={{ cursor: 'inherit' }}
        {...props}
      />
    )
  },
)

export { DaText }
export default DaText
