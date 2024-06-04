import { useState, useEffect } from 'react'
import { DaButton } from '../atoms/DaButton'
import { cn } from '@/lib/utils'

interface DaFilterProps {
  options: string[]
  onChange: (selectedOptions: string[]) => void
  className?: string
}

const DaFilter = ({ options, onChange, className }: DaFilterProps) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>(options)
  const [isDropdownVisible, setIsDropdownVisible] = useState(false)

  useEffect(() => {
    // Ensure all options are selected by default
    onChange(options)
  }, [options, onChange])

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
        className={cn('text-da-primary-500 mr-2', className)}
        variant="outline-nocolor"
        size="md"
        onClick={toggleDropdownVisibility}
      >
        Filter
      </DaButton>
      {isDropdownVisible && (
        <ul className="absolute right-0 z-10 bg-white border rounded-md shadow-lg mt-2 max-w-fit">
          {options.map((option) => (
            <li key={option}>
              <label className="flex items-center p-2">
                <input
                  type="checkbox"
                  checked={selectedOptions.includes(option)}
                  onChange={() => handleOptionChange(option)}
                />
                <span className="ml-2">{option}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default DaFilter
