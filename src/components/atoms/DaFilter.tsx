import { useState, useEffect, useRef } from 'react'
import { DaButton } from '../atoms/DaButton'
import { cn } from '@/lib/utils'
import DaCheckbox from './DaCheckbox'
import { TbSortDescending } from 'react-icons/tb'
import { DaText } from './DaText'

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
      <DaButton
        className={cn('text-da-primary-500 mr-2 !shadow-sm', className)}
        variant="outline-nocolor"
        size="md"
        onClick={toggleDropdownVisibility}
      >
        <TbSortDescending className="size-5 mr-1.5" /> {label || 'Filter'}
      </DaButton>
      {isDropdownVisible && (
        <ul className="absolute right-0 z-10 bg-white border rounded-md shadow-lg mt-2 max-w-fit p-1 select-none min-w-[140px]">
          {Object.entries(categories).map(([category, options], index) => (
            <li key={category}>
              {index > 0 && <hr className="my-2 border-t" />}
              {showCategory && (
                <div className="ml-2 text-sm font-bold text-da-gray-medium !mt-2 mb-1">
                  {category}
                </div>
              )}
              {options.map((option) => (
                <DaCheckbox
                  key={option}
                  checked={selectedOptions.includes(option)}
                  onChange={() => handleOptionChange(option)}
                  label={option}
                />
              ))}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default DaFilter
