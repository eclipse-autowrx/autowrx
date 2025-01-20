import React, { useState, useEffect } from 'react'
import { DaSkeleton } from '@/components/atoms/DaSkeleton'
import DaText from '../atoms/DaText'
import { debounce } from 'lodash'
import { cn } from '@/lib/utils'

const defaultMaxItems = {
  sm: 2,
  md: 4,
  lg: 6,
  xl: 8,
}

interface DaSkeletonGridProps {
  className?: string
  itemWrapperClassName?: string
  itemClassName?: string
  containerHeight?: string
  maxItems?: {
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  timeout?: number
  timeoutText?: string
  emptyText?: string
  isLoading?: boolean
  data?: any[]
  onTimeout?: () => void
  timeoutContainerClassName?: string
  emptyContainerClassName?: string
  primarySkeletonClassName?: string
  secondarySkeletonClassName?: string
  children?: React.ReactNode
}

const DaSkeletonGrid = ({
  className = '',
  itemWrapperClassName = '',
  itemClassName = '',
  containerHeight = 'min-h-[200px]',
  maxItems = defaultMaxItems,
  timeout = 0,
  timeoutText = 'No data available',
  emptyText = 'No items found',
  data,
  isLoading = true,
  timeoutContainerClassName = '',
  emptyContainerClassName = '',
  primarySkeletonClassName = '',
  secondarySkeletonClassName = '',
  onTimeout,
  children,
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
    if (data && data.length > 0) {
      setIsTimedOut(false)
    }
  }, [data])

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    // Only start timeout if we're loading or don't have data yet
    if (timeout > 0 && (isLoading || !data)) {
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
  }, [timeout, onTimeout, isLoading, data])

  // 1. First, check timeout
  if (isTimedOut && (isLoading || !data?.length)) {
    return (
      <div
        className={`flex flex-col w-full ${containerHeight} items-center justify-center ${timeoutContainerClassName}`}
      >
        <DaText variant="regular-bold">{timeoutText}</DaText>
      </div>
    )
  }

  // 2. Then, check loading state
  if (isLoading) {
    return (
      <div className={`flex flex-col w-full ${containerHeight} ${className}`}>
        <div
          className={cn(
            'w-full grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6',
            itemWrapperClassName,
          )}
        >
          {Array(numItems)
            .fill(null)
            .map((_, index) => (
              <div
                key={index}
                className={`flex flex-col space-y-2 ${itemClassName}`}
              >
                <DaSkeleton
                  className={cn(
                    'flex w-full h-[160px]', // This magic number means the height of the prototype item
                    primarySkeletonClassName, // Adjust height here for other items
                  )}
                />
                <DaSkeleton
                  className={cn(
                    'flex w-full h-[24px]',
                    secondarySkeletonClassName,
                  )}
                />
              </div>
            ))}
        </div>
      </div>
    )
  }
  // 3. Finally, check empty state
  if (data !== undefined && data.length === 0) {
    return (
      <div
        className={`flex flex-col w-full ${containerHeight} items-center justify-center ${emptyContainerClassName}`}
      >
        <DaText variant="regular-bold">{emptyText}</DaText>
      </div>
    )
  }

  // If we have data and we're not loading, render the children
  return children || null
}

export default DaSkeletonGrid
