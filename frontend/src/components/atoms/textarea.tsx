import * as React from 'react'
import { cn } from '@/lib/utils'
import DaText from './DaText'

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  textareaClassName?: string
  label?: string
  labelClassName?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, textareaClassName, label, labelClassName, ...props }, ref) => {
    const [focused, setFocused] = React.useState(false)

    // If no label, render simple textarea
    if (!label) {
      return (
        <textarea
          data-slot="textarea"
          className={cn(
            'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
            className,
            textareaClassName,
          )}
          ref={ref}
          {...props}
        />
      )
    }

    // Render with label
    return (
      <div className={cn('flex flex-col', className)}>
        {label && (
          <DaText
            variant="regular-medium"
            className={cn(
              'mb-1',
              focused ? 'text-primary' : 'text-muted-foreground',
              labelClassName,
            )}
          >
            {label}
          </DaText>
        )}
        <textarea
          data-slot="textarea"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={cn(
            'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
            textareaClassName,
          )}
          ref={ref}
          {...props}
        />
      </div>
    )
  },
)

Textarea.displayName = 'Textarea'

export { Textarea }
