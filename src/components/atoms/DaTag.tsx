import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  ` inline-flex items-center justify-center rounded-md border px-2.5 py-0.5 transition-colors
    da-txt-small
    focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 pointer-events-none select-none`,
  {
    variants: {
      variant: {
        default:
          'text-da-gray-medium border-da-gray-medium  hover:bg-da-gray-medium/10',
        secondary:
          'border-transparent bg-da-gray-medium/10 text-da-gray-medium ',
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
