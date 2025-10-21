// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import DaText from './DaText'
import { Input } from './input'
import { Textarea } from './textarea'
import { cn } from '@/lib/utils'

interface DaInputWithLabel {
  label: string
  value: string
  onChange: (value: string) => void
  className?: string
  isTextarea?: boolean
}

const DaInputWithLabel = ({
  label,
  value,
  onChange,
  className,
  isTextarea = false,
}: DaInputWithLabel) => (
  <div className={cn('flex w-full items-center mb-4', className)}>
    <DaText
      className="flex min-w-[150px] text-foreground"
      variant="small-bold"
    >
      {label}
    </DaText>
    {isTextarea ? (
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex w-full"
        textareaClassName="text-sm!"
      />
    ) : (
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex w-full"
        inputClassName="text-sm"
      />
    )}
  </div>
)

export default DaInputWithLabel
