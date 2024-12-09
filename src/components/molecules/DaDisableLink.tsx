import { Link } from 'react-router-dom'
import React, { ReactNode } from 'react'
import useSelfProfileQuery from '@/hooks/useSelfProfile' // Replace with your actual auth hook
import { cn } from '@/lib/utils'
import config from '@/configs/config'

interface DisabledLinkProps {
  to: string
  children: ReactNode
  className?: string
}

const DisabledLink = ({ to, children, className }: DisabledLinkProps) => {
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
    >
      {children}
    </Link>
  )
}

export default DisabledLink
