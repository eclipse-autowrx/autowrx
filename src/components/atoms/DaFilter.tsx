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
}

const DaFilter = ({ categories, onChange, className }: DaFilterProps) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [isDropdownVisible, setIsDropdownVisible] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const allOptions = Object.values(categories).flat()
    setSelectedOptions(allOptions)
    onChange(allOptions)
  }, [])

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
    const updatedOptions = selectedOptions.includes(option)
      ? selectedOptions.filter((opt) => opt !== option)
      : [...selectedOptions, option]
    setSelectedOptions(updatedOptions)
    onChange(updatedOptions)
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
        <TbSortDescending className="w-4 h-4 mr-1.5" /> Filter
      </DaButton>
      {isDropdownVisible && (
        <ul className="absolute right-0 z-10 bg-white border rounded-md shadow-lg mt-2 max-w-fit p-1 select-none min-w-[140px]">
          {Object.entries(categories).map(([category, options], index) => (
            <li key={category}>
              {index > 0 && <hr className="my-2 border-t" />}
              <DaText variant="regular-bold" className="ml-2">
                {category}
              </DaText>
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
