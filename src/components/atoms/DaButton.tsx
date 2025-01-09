import React, { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface DaButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode
  className?: string | undefined
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
  ({ className, variant = 'solid', size = 'md', ...props }, ref) => {
    return (
      <button
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
