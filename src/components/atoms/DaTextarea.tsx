import clsx from 'clsx'
import * as React from 'react'

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  textareaClassName?: string
  label?: string
}

const DaTextarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, textareaClassName, label, ...props }, ref) => {
    return (
      <div className={clsx('flex flex-col-reverse', className)}>
        {/* Put textarea before label to enable peer-focus */}
        <textarea
          className={clsx(
            'da-textarea flex rounded-lg px-3 py-2 border h-full peer',
            textareaClassName,
            label && 'mt-1',
          )}
          ref={ref}
          {...props}
        />
        <div className="peer-focus:text-da-primary-500 font-medium">
          {label}
        </div>
      </div>
    )
  },
)

DaTextarea.displayName = 'Textarea'

export { DaTextarea }
