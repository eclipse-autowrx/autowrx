// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { HTMLAttributes } from 'react'

interface DaImageProps extends HTMLAttributes<HTMLImageElement> {
  src?: string | undefined
  alt?: string | undefined
  /** Shown when `src` is missing, or when the image fails to load. */
  fallbackSrc?: string | undefined
}

const DaImage = React.forwardRef<HTMLImageElement, DaImageProps>(
  ({ className, src, alt, fallbackSrc, onError, ...props }, ref) => {
    return (
      <img
        ref={ref}
        src={src || fallbackSrc || ''}
        alt={alt}
        {...props}
        className={className}
        onError={(e) => {
          const img = e.currentTarget
          if (fallbackSrc && !img.dataset.fallbackApplied) {
            img.dataset.fallbackApplied = 'true'
            img.src = fallbackSrc
          }
          onError?.(e)
        }}
      />
    )
  },
)

DaImage.displayName = 'DaImage'

export { DaImage }
