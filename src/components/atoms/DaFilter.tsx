import { useState, useEffect } from 'react'
import { DaButton } from '../atoms/DaButton'
import { cn } from '@/lib/utils'
import DaCheckbox from './DaCheckbox'

interface DaFilterProps {
  options: string[]
  onChange: (selectedOptions: string[]) => void
  className?: string
}

const DaFilter = ({ options, onChange, className }: DaFilterProps) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [isDropdownVisible, setIsDropdownVisible] = useState(false)

  useEffect(() => {
    setSelectedOptions(options)
    onChange(options)
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
    <div className="relative">
      <DaButton
        className={cn('text-da-primary-500 mr-2 !shadow-sm', className)}
        variant="outline-nocolor"
        size="md"
        onClick={toggleDropdownVisibility}
      >
        Filter
      </DaButton>
      {isDropdownVisible && (
        <ul className="absolute right-0 z-10 bg-white border rounded-md shadow-lg mt-2 max-w-fit p-1">
          {options.map((option) => (
            <DaCheckbox
              key={option}
              checked={selectedOptions.includes(option)}
              onChange={() => handleOptionChange(option)}
              label={option}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

export default DaFilter
