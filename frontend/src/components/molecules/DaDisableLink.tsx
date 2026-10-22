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
import { useAuthConfigs } from '@/hooks/useAuthConfigs'

interface DisabledLinkProps {
  to: string
  children: ReactNode
  className?: string
  dataId?: string
}

const DisabledLink = ({
  to,
  children,
  className,
  dataId,
}: DisabledLinkProps) => {
  const { data: user } = useSelfProfileQuery()
  const { authConfigs } = useAuthConfigs()

  const handleClick = (e: React.MouseEvent) => {
    // Prevent navigation if not signed in and public viewing is disabled
    if (!user && !authConfigs.PUBLIC_VIEWING) {
      e.preventDefault()
    }
  }

  return (
    <Link
      to={authConfigs.PUBLIC_VIEWING || user ? to : '#'}
      onClick={handleClick}
      className={cn(className)}
      data-id={dataId}
    >
      {children}
    </Link>
  )
}

export default DisabledLink
