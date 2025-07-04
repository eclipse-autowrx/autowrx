// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { ASILBadge } from './ASILBadge'
import { DaSelect, DaSelectItem } from '@/components/atoms/DaSelect'
import { cn } from '@/lib/utils'
import { ASILLevel } from '@/types/flow.type'

interface ASILSelectProps {
  value: ASILLevel
  onChange: (value: ASILLevel) => void
  className?: string
}

const ASILSelect = ({ value, onChange, className }: ASILSelectProps) => {
  const asilOptions = [
    { value: 'QM', description: 'Quality management, no safety impact' },
    { value: 'A', description: 'Lowest safety risk, minor injuries possible' },
    { value: 'B', description: 'Moderate risk, severe injuries unlikely' },
    {
      value: 'C',
      description: 'High risk, life-threatening injuries possible',
    },
    { value: 'D', description: 'Highest risk, potentially fatal accidents' },
  ] as const

  const handleValueChange = (newValue: string) => {
    onChange(newValue as ASILLevel)
  }

  return (
    <DaSelect
      className={cn(
        'h-[33px] w-fit rounded-md !border-transparent !shadow-none',
        className,
      )}
      value={value}
      onValueChange={handleValueChange}
      placeholderClassName="flex items-center px-1 "
      wrapperClassName="w-fit items-center justify-center border-transparent !shadow-none"
    >
      {asilOptions.map((asil) => (
        <DaSelectItem
          className="flex w-fit items-center px-4"
          value={asil.value}
          key={asil.value}
          helperText={asil.description}
          helperClassName="!text-xs"
        >
          <div
            className={cn(
              asil.value === 'QM' ? 'flex w-12 justify-center' : 'w-fit',
            )}
          >
            <ASILBadge
              preAsilLevel={asil.value}
              showBadge={true}
              showFullText={true}
              className="w-fit !text-xs"
              preItemClassName="p-0 justify-center items-center h-6 w-12"
            />
          </div>
        </DaSelectItem>
      ))}
    </DaSelect>
  )
}

export default ASILSelect
