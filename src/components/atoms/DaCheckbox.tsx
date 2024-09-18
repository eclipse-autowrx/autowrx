import React from 'react'
import { cn } from '@/lib/utils'

interface DaCheckboxProps {
  checked: boolean
  onChange: () => void
  label: string
  className?: string
}

const DaCheckbox = ({
  checked,
  onChange,
  label,
  className,
}: DaCheckboxProps) => {
  return (
    <label className={cn('flex items-center p-2 cursor-pointer', className)}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 relative peer shrink-0
        appearance-none border-2 rounded-sm bg-white
        checked:bg-da-primary-500 checked:border-0  cursor-pointer"
      />
      <svg
        className="absolute w-4 h-4 hidden peer-checked:block"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <span className="ml-2 cursor-pointer">{label}</span>
    </label>
  )
}

export default DaCheckbox
