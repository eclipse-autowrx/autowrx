import React from 'react'
import { cn } from '@/lib/utils'

type ProgressBarProps = {
  value: number
  type: 'blue' | 'red' | 'default'
  max?: number
  className?: string
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  type,
  max = 5,
  className,
}) => {
  // Calculate the percentage of progress based on the value and maximum.
  const percentage = Math.min((value / max) * 100, 100)

  // Choose gradient background classes based on the type.
  let gradientClassName = ''
  if (type === 'blue') {
    gradientClassName =
      'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500'
  } else if (type === 'red') {
    gradientClassName =
      'bg-gradient-to-r from-amber-500 via-rose-500 to-red-500'
  } else if (type === 'default') {
    gradientClassName = 'bg-da-primary-500'
  }

  return (
    <div
      className={cn(
        'w-full h-[6px] rounded-[2.5px] overflow-hidden relative',
        className,
      )}
    >
      {/* Full gradient background */}
      <div className={cn('w-full h-full', gradientClassName)} />
      {/* Gray overlay covering the unfilled portion */}
      <div
        className="absolute top-0 right-0 h-full bg-gray-300"
        style={{ width: `${100 - percentage}%` }}
      />
    </div>
  )
}

export default ProgressBar
