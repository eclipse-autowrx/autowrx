// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { HTMLAttributes } from 'react'

interface DaImageProps extends HTMLAttributes<HTMLImageElement> {
  //   children?: React.ReactNode;
  src?: string | undefined
  alt?: string | undefined
}

const DaImage = React.forwardRef<HTMLImageElement, DaImageProps>(
  ({ className, src, alt, ...props }, ref) => {
    return <img ref={ref} src={src || ''} {...props} className={className} />
  },
)

export { DaImage }
