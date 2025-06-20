import { Link } from 'react-router-dom'
import React, { ReactNode } from 'react'
import useSelfProfileQuery from '@/hooks/useSelfProfile' // Replace with your actual auth hook
import { cn } from '@/lib/utils'
import config from '@/configs/config'

interface DisabledLinkProps {
  to: string
  children: ReactNode
  className?: string,
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
