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
        <DaText
          variant="regular-medium"
          className="flex flex-col-reverse gap-y-1"
        >
          <textarea
            className={clsx('da-textarea peer', textareaClassName)}
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
