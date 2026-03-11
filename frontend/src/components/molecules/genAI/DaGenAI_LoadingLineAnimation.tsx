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

const DaGenAI_LoadingLineAnimation = ({
  loading,
  content,
}: LoadingLineAnimationProps) => {
  const [linePosition, setLinePosition] = useState(0)
  const [direction, setDirection] = useState(1)
  const [maxLeft, setMaxLeft] = useState(0)

  useEffect(() => {
    if (loading && maxLeft > 0) {
      const interval = setInterval(() => {
        setLinePosition((prevPosition) => {
          let newPosition = prevPosition + 2 * direction
          if (newPosition >= maxLeft - 2) {
            setDirection(-1)
            return maxLeft - 2
          }
          if (newPosition <= 0) {
            setDirection(1)
            return 0
          }
          return newPosition
        })
      }, 8)
      return () => clearInterval(interval)
    } else if (!loading) {
      setLinePosition(0)
      setDirection(1)
    }
  }, [loading, direction, maxLeft])

  return (
    <div
      ref={(element) => {
        if (element) {
          const width = element.clientWidth || 0
          if (width > 0 && width !== maxLeft) {
            setMaxLeft(width)
          }
        }
      }}
      className="relative w-full h-full select-none bg-muted rounded-md"
    >
      {!loading ? (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          {content}
        </div>
      ) : (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: `${linePosition}px`,
            height: '100%',
            width: '2px',
            backgroundColor: 'var(--primary)',
            boxShadow: '0px 0px 20px var(--primary)',
            zIndex: 10,
          }}
        />
      )}
    </div>
  )
}

export default DaGenAI_LoadingLineAnimation
