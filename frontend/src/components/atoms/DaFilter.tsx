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
  disabled?: boolean
}

const DaFilter = ({
  categories,
  onChange,
  className,
  showCategory = true,
  singleSelect = false,
  defaultValue,
  label,
  disabled = false,
}: DaFilterProps) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>(() => {
    const allOptions = Object.values(categories).flat()
    return singleSelect
      ? defaultValue && defaultValue.length > 0
        ? [defaultValue[0]]
        : []
      : defaultValue && defaultValue.length > 0
        ? defaultValue
        : allOptions
  })
  const [isDropdownVisible, setIsDropdownVisible] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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

  const handleSelectAll = (currentCategory: string) => {
    const allOptions = [
      ...new Set([...categories[currentCategory], ...selectedOptions]),
    ]
    setSelectedOptions(allOptions)
    onChange(allOptions)
  }

  const handleClearAll = (currentCategory: string) => {
    const newSelectedOptions = selectedOptions.filter(
      (option) => !categories[currentCategory].includes(option),
    )
    setSelectedOptions(newSelectedOptions)
    onChange(newSelectedOptions)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        className={cn('mr-2 shadow-xs', className)}
        variant="outline"
        onClick={toggleDropdownVisibility}
        disabled={disabled}
      >
        <TbSortDescending className="size-4" /> {label || 'Filter'}
      </Button>
      {isDropdownVisible && (
        <ul className="absolute right-0 z-10 bg-white border rounded-md shadow-lg mt-2 max-w-fit p-1 select-none min-w-[140px]">
          {Object.entries(categories).map(([category, options], index) => {
            const shouldDisableSelectAll = options.every((option) =>
              selectedOptions.includes(option),
            )
            const shouldDisableClearAll = options.every(
              (option) => !selectedOptions.includes(option),
            )
            return (
              <li key={category}>
                {index > 0 && <hr className="my-2 border-t" />}
                {showCategory && (
                  <div className="ml-2 text-xs font-semibold text-muted-foreground mt-2! mb-1">
                    {category}
                  </div>
                )}
                {/* Select All / Clear All buttons - only show in multi-select mode */}
                {!singleSelect && (
                  <div className="flex justify-between items-center px-2 py-1.5 mb-1 border-b border-border/50">
                    <button
                      type="button"
                      onClick={() => handleSelectAll(category)}
                      disabled={shouldDisableSelectAll}
                      className={cn(
                        'text-xs text-muted-foreground hover:text-foreground transition-colors',
                        shouldDisableSelectAll &&
                          'opacity-50 cursor-not-allowed',
                      )}
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => handleClearAll(category)}
                      disabled={shouldDisableClearAll}
                      className={cn(
                        'text-xs text-muted-foreground hover:text-foreground transition-colors',
                        shouldDisableClearAll &&
                          'opacity-50 cursor-not-allowed',
                      )}
                    >
                      Clear All
                    </button>
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
                    <span className="text-sm ml-2 cursor-pointer">
                      {option}
                    </span>
                  </label>
                ))}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default DaFilter
