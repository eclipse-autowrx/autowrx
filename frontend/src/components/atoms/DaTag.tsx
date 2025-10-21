// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  ` inline-flex items-center justify-center rounded-md border px-2.5 py-0.5 transition-colors
    text-sm
    focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 pointer-events-none select-none`,
  {
    variants: {
      variant: {
        default:
          'text-muted-foreground border-muted-foreground  hover:bg-muted-foreground/10',
        secondary:
          'border-transparent bg-muted-foreground/10 text-muted-foreground ',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function DaTag({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { DaTag, badgeVariants }
