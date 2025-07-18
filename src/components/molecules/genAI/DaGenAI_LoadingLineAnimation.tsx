// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useState, useEffect } from 'react'

interface LoadingLineAnimationProps {
  loading: boolean
  content: React.ReactNode
}

const LoadingLineAnimation = ({
  loading,
  content,
}: LoadingLineAnimationProps) => {
  const [linePosition, setLinePosition] = useState(0)
  const [direction, setDirection] = useState(1)
  const [maxLeft, setMaxLeft] = useState(0)

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLinePosition((prevPosition) => {
          let newPosition = prevPosition + 2 * direction
          if (newPosition >= maxLeft - 2 || newPosition <= 0) {
            setDirection(-direction)
          }
          return newPosition
        })
      }, 8)
      return () => clearInterval(interval)
    }
  }, [loading, direction, maxLeft])

  return (
    <div
      ref={(element) => {
        setMaxLeft(element?.clientWidth || 0)
      }}
      className="relative flex h-full flex-1 select-none items-center justify-center bg-gray-50 shadow"
    >
      {!loading ? (
        <div>{content}</div>
      ) : (
        <div
          className="overflow-hidden"
          style={{
            position: 'absolute',
            top: 0,
            left: `${linePosition}px`,
            height: '100%',
            width: '2px',
            backgroundColor: 'hsl(var(--da-primary-500))',
            boxShadow: '0px 0px 20px #005072',
          }}
        />
      )}
    </div>
  )
}

export default LoadingLineAnimation
