// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { cn } from '@/lib/utils'

interface DaDuplicateNameHintProps {
  message: string
  suggestedName: string | null
  onApplySuggestion: (name: string) => void
  className?: string
}

const DaDuplicateNameHint = ({
  message,
  suggestedName,
  onApplySuggestion,
  className,
}: DaDuplicateNameHintProps) => (
  <p className={cn('text-xs text-destructive mt-1', className)}>
    {message}
    {suggestedName && (
      <>. Please choose another name like:{' '}
        <button
          type="button"
          className="underline hover:opacity-75"
          onClick={() => onApplySuggestion(suggestedName)}
        >
          {suggestedName}
        </button>
      </>
    )}
  </p>
)

export default DaDuplicateNameHint
