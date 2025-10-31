// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/atoms/button'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/atoms/checkbox'
import { TbSortDescending } from 'react-icons/tb'

interface DaFilterProps {
  categories: { [key: string]: string[] }
  onChange: (selectedOptions: string[]) => void
  className?: string
  showCategory?: boolean
  singleSelect?: boolean
  defaultValue?: string[]
  label?: string
}

const DaFilter = ({
  categories,
  onChange,
  className,
  showCategory = true,
  singleSelect = false,
  defaultValue,
  label,
}: DaFilterProps) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [isDropdownVisible, setIsDropdownVisible] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const allOptions = Object.values(categories).flat()
    // console.log('Default value receive: ', defaultValue)
    if (singleSelect) {
      setSelectedOptions(defaultValue || [])
    } else {
      setSelectedOptions(defaultValue?.length ? defaultValue : allOptions)
    }
  }, [defaultValue])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownVisible(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleOptionChange = (option: string) => {
    if (singleSelect) {
      if (!selectedOptions.includes(option)) {
        const updatedOptions = [option]
        setSelectedOptions(updatedOptions)
        onChange(updatedOptions)
      }
      // No action if the selected option is already active (prevents unchecking)
    } else {
      const updatedOptions = selectedOptions.includes(option)
        ? selectedOptions.filter((opt) => opt !== option)
        : [...selectedOptions, option]
      setSelectedOptions(updatedOptions)
      onChange(updatedOptions)
    }
  }

  const toggleDropdownVisibility = () => {
    setIsDropdownVisible(!isDropdownVisible)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        className={cn('mr-2 shadow-xs', className)}
        variant="outline"
        onClick={toggleDropdownVisibility}
      >
        <TbSortDescending className="size-4" /> {label || 'Filter'}
      </Button>
      {isDropdownVisible && (
        <ul className="absolute right-0 z-10 bg-white border rounded-md shadow-lg mt-2 max-w-fit p-1 select-none min-w-[140px]">
          {Object.entries(categories).map(([category, options], index) => (
            <li key={category}>
              {index > 0 && <hr className="my-2 border-t" />}
              {showCategory && (
                <div className="ml-2 text-xs font-semibold text-muted-foreground mt-2! mb-1">
                  {category}
                </div>
              )}
              {options.map((option) => (
                <label
                  key={option}
                  className="flex items-center relative p-2 cursor-pointer"
                >
                  <Checkbox
                    checked={selectedOptions.includes(option)}
                    onCheckedChange={() => handleOptionChange(option)}
                  />
                  <span className="text-sm ml-2 cursor-pointer">{option}</span>
                </label>
              ))}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default DaFilter
