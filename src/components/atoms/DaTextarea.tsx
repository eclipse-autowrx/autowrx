import clsx from 'clsx'
import * as React from 'react'
import { DaText } from './DaText'

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  textareaClassName?: string
  label?: string
}

const DaTextarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, textareaClassName, label, ...props }, ref) => {
    return (
      <div className={clsx('flex flex-col', className)}>
        {/* Flex col reverse allow us to use peer className */}
        <DaText className="gap-y-1 flex flex-col-reverse">
          <textarea
            className={clsx(
              'flex min-h-[60px] peer w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-da-primary-500 disabled:cursor-not-allowed disabled:opacity-50',
              textareaClassName,
            )}
            ref={ref}
            {...props}
          />
          <span className="peer-focus:text-da-primary-500">{label}</span>
        </DaText>
      </div>
    )
  },
)
DaTextarea.displayName = 'Textarea'

export { DaTextarea }
