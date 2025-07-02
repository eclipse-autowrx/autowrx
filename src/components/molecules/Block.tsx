// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC } from 'react'

interface BlockProps {
  title: string
  variant?: 'default' | 'outline'
  height?: string
  className?: string
}

const Block: FC<BlockProps> = ({
  title,
  variant = 'default',
  height = '200px',
  className = '',
}) => {
  return (
    <div
      className={`da-block-bare da-block-${variant} ${className}`}
      style={{ height: height }}
    >
      {title}
    </div>
  )
}

export { Block }
