// Copyright (c) 2025 Eclipse Foundation.
// SPDX-License-Identifier: MIT

import React, { useState, useRef, useEffect } from 'react'
import { TbChevronDown, TbCheck } from 'react-icons/tb'
import { ASILBadge } from './ASILBadge'
import type { ASILLevel } from '../types/flow.type'
import { cn } from '../lib/utils'

interface ASILSelectProps {
  value: ASILLevel
  onChange: (value: ASILLevel) => void
  className?: string
  /** 'left' = dropdown aligns to left edge, 'right' = aligns to right edge (for Post-Mitigation to avoid clipping) */
  dropdownAlign?: 'left' | 'right'
}

const asilOptions: { value: ASILLevel; description: string }[] = [
  { value: 'QM', description: 'Quality management, no safety impact' },
  { value: 'A', description: 'Lowest safety risk, minor injuries possible' },
  { value: 'B', description: 'Moderate risk, severe injuries unlikely' },
  { value: 'C', description: 'High risk, life-threatening injuries possible' },
  { value: 'D', description: 'Highest risk, potentially fatal accidents' },
]

export default function ASILSelect({ value, onChange, className, dropdownAlign = 'left' }: ASILSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const current = asilOptions.find((opt) => opt.value === value) || asilOptions[0]

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="h-[33px] w-full min-w-[100px] rounded-md border border-transparent bg-transparent shadow-none px-3 outline-none focus:ring-1 focus:ring-da-primary-500 flex items-center justify-between gap-2 text-xs"
      >
        <ASILBadge
          preAsilLevel={value}
          showBadge={true}
          showFullText={true}
          className="w-fit text-xs"
          preItemClassName="p-0 justify-center items-center h-6 w-12"
        />
        <TbChevronDown className={cn('size-4 text-da-gray-medium shrink-0', open && 'rotate-180')} />
      </button>
      {open && (
        <div
          className={cn(
            'absolute top-full mt-1 z-50 bg-white border rounded-md shadow-lg py-1 min-w-[280px] max-h-[280px] overflow-y-auto',
            dropdownAlign === 'right' ? 'right-0 left-auto' : 'left-0',
          )}
        >
          {asilOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value)
                setOpen(false)
              }}
              className={cn(
                'w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-gray-100 text-xs relative',
                opt.value === value && 'bg-da-primary-100',
              )}
            >
              <ASILBadge
                preAsilLevel={opt.value}
                showBadge={true}
                showFullText={true}
                className="w-fit shrink-0"
                preItemClassName="p-0 justify-center items-center h-6 w-12"
              />
              <span className="text-da-gray-dark flex-1">{opt.description}</span>
              {opt.value === value && (
                <TbCheck className="size-4 text-da-primary-500 shrink-0 absolute right-3" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
