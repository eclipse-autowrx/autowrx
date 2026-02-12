// Copyright (c) 2025 Eclipse Foundation.
// SPDX-License-Identifier: MIT

import React, { useState, useRef, useEffect } from 'react'
import {
  TbArrowLeft,
  TbArrowRight,
  TbArrowsLeftRight,
  TbCornerDownLeft,
  TbCornerDownRight,
  TbArrowsRightLeft,
  TbChevronDown,
} from 'react-icons/tb'
import type { Direction } from '../types/flow.type'

interface FlowDirectionSelectorProps {
  value: Direction
  onChange: (value: Direction) => void
}

const directions: { value: Direction; icon: React.ReactElement }[] = [
  { value: 'left', icon: <TbArrowLeft className="size-5" /> },
  { value: 'right', icon: <TbArrowRight className="size-5" /> },
  { value: 'bi-direction', icon: <TbArrowsRightLeft className="size-5" /> },
  { value: 'reverse-bi-direction', icon: <TbArrowsLeftRight className="size-5" /> },
  { value: 'down-left', icon: <TbCornerDownLeft className="size-5" /> },
  { value: 'down-right', icon: <TbCornerDownRight className="size-5" /> },
]

export default function FlowDirectionSelector({ value, onChange }: FlowDirectionSelectorProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const current = directions.find((d) => d.value === value) || directions[0]

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
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="h-9 rounded-md w-full text-xs font-medium border px-2 outline-none focus:ring-1 focus:ring-da-primary-500 flex items-center justify-center gap-2 bg-white"
      >
        <span className="text-da-primary-500">{current.icon}</span>
        <TbChevronDown className="size-4 text-da-gray-medium" />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-white border rounded-md shadow-lg py-1 min-w-full">
          {directions.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => {
                onChange(d.value)
                setOpen(false)
              }}
              className="w-full flex items-center justify-center py-2 hover:bg-da-primary-100 text-da-primary-500"
            >
              {d.icon}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
