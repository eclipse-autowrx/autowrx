import { cn } from '@/lib/utils'
import { useState } from 'react'
import { HiStar } from 'react-icons/hi'
import Rating from 'react-rating'

interface DaStarsRatingProps {
  initialRating: number
  readonly?: boolean
  onChange?: (value: number) => void
  className?: string
}

const DaStarsRating = ({
  initialRating,
  readonly = false,
  onChange,
  className,
}: DaStarsRatingProps) => {
  const [rating, setRating] = useState(initialRating)
  const RatingComponent = Rating as any

  const handleRatingChange = (value: number) => {
    setRating(value)
    if (onChange) {
      onChange(value)
    }
  }

  return (
    <RatingComponent
      className={cn('h-6 mx-2', className)}
      readonly={readonly}
      emptySymbol={<HiStar className="text-gray-300" size={24} />}
      initialRating={rating}
      fullSymbol={<HiStar className="text-[#FFDB58]" size={24} />}
      onChange={handleRatingChange}
    />
  )
}

export default DaStarsRating
