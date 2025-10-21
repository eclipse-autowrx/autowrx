// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

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
            'flex min-h-[60px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:opacity-50 peer',
            textareaClassName,
            label && 'mt-1',
          )}
          ref={ref}
          {...props}
        />
        <div className="peer-focus:text-primary font-medium">
          {label}
        </div>
      </div>
    )
  },
)

DaTextarea.displayName = 'Textarea'

export { DaTextarea }
