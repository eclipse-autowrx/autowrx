import React, { useState, useEffect } from 'react'
import { DaSkeleton } from '@/components/atoms/DaSkeleton'
import DaText from '../atoms/DaText'
import { debounce } from 'lodash'

const defaultMaxItems = {
  sm: 2,
  md: 4,
  lg: 6,
  xl: 8,
}

interface DaSkeletonGridProps {
  className?: string
  itemClassName?: string
  containerHeight?: string
  maxItems?: {
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  timeout?: number // timeout in seconds
  timeoutText?: string
  onTimeout?: () => void
  timeoutContainerClassName?: string
}

const DaSkeletonGrid = ({
  className = '',
  itemClassName = '',
  containerHeight = 'min-h-[200px]',
  maxItems = defaultMaxItems,
  timeout = 0,
  timeoutText = 'No data available',
  timeoutContainerClassName = '',
  onTimeout,
}: DaSkeletonGridProps) => {
  const [numItems, setNumItems] = useState(maxItems.xl || defaultMaxItems.xl)
  const [isTimedOut, setIsTimedOut] = useState(false)

  useEffect(() => {
    const updateNumItems = () => {
      const screenWidth = window.innerWidth
      if (screenWidth >= 1280) {
        setNumItems(maxItems.xl || defaultMaxItems.xl)
      } else if (screenWidth >= 1024) {
        setNumItems(maxItems.lg || defaultMaxItems.lg)
      } else if (screenWidth >= 768) {
        setNumItems(maxItems.md || defaultMaxItems.md)
      } else {
        setNumItems(maxItems.sm || defaultMaxItems.sm)
      }
    }

    updateNumItems()
    const debouncedUpdateNumItems = debounce(updateNumItems, 250)
    window.addEventListener('resize', debouncedUpdateNumItems)

    return () => {
      window.removeEventListener('resize', debouncedUpdateNumItems)
    }
  }, [maxItems])

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    if (timeout > 0) {
      timeoutId = setTimeout(() => {
        setIsTimedOut(true)
        onTimeout?.()
      }, timeout * 1000)
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [timeout, onTimeout])

  if (isTimedOut) {
    return (
      <div
        className={`flex flex-col w-full ${containerHeight} items-center justify-center ${timeoutContainerClassName}`}
      >
        <DaText variant="regular-bold">{timeoutText}</DaText>
      </div>
    )
  }

  return (
    <div className={`flex flex-col w-full ${containerHeight} ${className}`}>
      <div className="w-full grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array(numItems)
          .fill(null)
          .map((_, index) => (
            <div
              key={index}
              className={`flex flex-col space-y-2 h-[184px] ${itemClassName}`}
            >
              <DaSkeleton className="flex w-full h-[160px]" />
              <DaSkeleton className="flex w-full h-[24px]" />
            </div>
          ))}
      </div>
    </div>
  )
}

export default DaSkeletonGrid
