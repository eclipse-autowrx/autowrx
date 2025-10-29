// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { Link } from 'react-router-dom'
import React, { ReactNode } from 'react'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { cn } from '@/lib/utils'
import config from '@/configs/config'

interface DisabledLinkProps {
  to: string
  children: ReactNode
  className?: string
  dataId?: string
}

const DisabledLink = ({ to, children, className, dataId }: DisabledLinkProps) => {
  const { data: user } = useSelfProfileQuery()

  const handleClick = (e: React.MouseEvent) => {
    if (!user && config.strictAuth) {
      e.preventDefault()
    }
  }

  return (
    <Link
      to={!config.strictAuth || user ? to : '#'}
      onClick={handleClick}
      className={cn(className)}
      data-id={dataId}
    >
      {children}
    </Link>
  )
}

export default DisabledLink
