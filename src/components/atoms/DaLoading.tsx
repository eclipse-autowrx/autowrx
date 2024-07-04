import { useState, useEffect } from 'react'
import { TbX } from 'react-icons/tb'
import { DaButton } from './DaButton'
import { DaText } from './DaText'

interface DaLoadingProps {
  text?: string
  timeoutText?: string
  timeout?: number
  size?: number
  fullScreen?: boolean
  showRetry?: boolean
}

const DaLoading = ({
  text = 'Loading...',
  timeoutText = 'Something went wrong. Please try again',
  timeout = 20,
  size = 60,
  fullScreen = true,
  showRetry = true,
}) => {
  const [hasTimedOut, setHasTimedOut] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setHasTimedOut(true)
    }, timeout * 1000)

    return () => clearTimeout(timer)
  }, [timeout])

  const circleRadius = size * 0.38
  const strokeWidth = size * 0.067

  return (
    <div
      className={`flex flex-col justify-center items-center select-none ${fullScreen ? 'w-full h-full' : ''}`}
    >
      {!hasTimedOut ? (
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
      ) : (
        showRetry && <TbX className="text-da-gray-medium mb-6" size={size} />
      )}
      <DaText variant="title" className="text-da-gray-medium">
        {hasTimedOut ? timeoutText : text}
      </DaText>
      {hasTimedOut && showRetry && (
        <DaButton
          variant="outline-nocolor"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Try to reload the page
        </DaButton>
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
