// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useState, useEffect } from 'react'
import { TbX } from 'react-icons/tb'
import { DaButton } from './DaButton'
import { DaText } from './DaText'
import DaErrorDisplay from '../molecules/DaErrorDisplay'
import { cn } from '@/lib/utils'

interface DaLoadingProps {
  text?: string
  timeoutText?: string
  timeout?: number
  size?: number
  fullScreen?: boolean
  showRetry?: boolean
  stopLoading?: boolean
  className?: string
}

const DaLoading = ({
  text = 'Loading...',
  timeoutText = 'Something went wrong. Please try again',
  timeout = 20,
  size = 60,
  fullScreen = true,
  showRetry = true,
  stopLoading = false, // Default to false
  className,
}: DaLoadingProps) => {
  const [hasTimedOut, setHasTimedOut] = useState(false)

  useEffect(() => {
    if (stopLoading) {
      setHasTimedOut(true)
    } else {
      const timer = setTimeout(() => {
        setHasTimedOut(true)
      }, timeout * 1000)

      return () => clearTimeout(timer)
    }
  }, [stopLoading, timeout])

  const circleRadius = size * 0.38
  const strokeWidth = size * 0.067

  return (
    <div
      className={cn(
        `flex flex-col justify-center items-center select-none`,
        fullScreen ? 'w-full h-full' : '',
        className,
      )}
    >
      {!hasTimedOut && (
        <svg
          className="loading-spinner"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={circleRadius}
            fill="transparent"
            strokeWidth={strokeWidth}
            stroke="#f3f3f3"
          />
          <path
            d={`M ${size / 2} ${size / 2} m -${circleRadius} 0 a ${circleRadius} ${circleRadius} 0 0 1 ${
              circleRadius * 0.87
            } -${circleRadius}`}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            stroke="url(#gradient)"
          />
          <defs>
            <linearGradient id="gradient" x1="100%" y1="100%">
              <stop stopColor="hsl(var(--da-primary-500))" offset="0%" />
              <stop stopColor="hsl(var(--da-secondary-500))" offset="100%" />
            </linearGradient>
          </defs>
        </svg>
      )}

      {!hasTimedOut && (
        <DaText variant="sub-title" className="text-da-gray-medium mt-4">
          {text}
        </DaText>
      )}

      {hasTimedOut && showRetry && (
        <div className="flex w-full h-full">
          <DaErrorDisplay error={timeoutText} />
        </div>
      )}
      <style>
        {`
          .loading-spinner {
              transform-origin: center;
              animation: spin 1s linear infinite;
          }

          @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  )
}

export default DaLoading
