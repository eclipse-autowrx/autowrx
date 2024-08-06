import { Link } from 'react-router-dom'
import { FC } from 'react'
import { cn } from '@/lib/utils'

interface DaTabItemProps {
  children: any
  active?: boolean
  to?: string
  small?: boolean
  onClick?: React.MouseEventHandler<HTMLDivElement>
}

const DaTabItem: FC<DaTabItemProps> = ({
  children,
  active,
  to,
  small,
  onClick,
}) => {
  return (
    <Link
      to={to || ''}
      target={to && to.startsWith('http') ? '_blank' : '_self'}
      rel="noopener noreferrer"
    >
      <div
        onClick={onClick}
        className={cn(
          `flex h-full da-label-small-bold items-center justify-center min-w-20 cursor-pointer hover:opacity-80 border-b-2 border-transparent hover:border-da-primary-500`,
          small ? 'py-0.5 px-2' : 'py-1 px-4',
          active
            ? 'text-da-primary-500 border-b-2 border-da-primary-500'
            : 'text-da-gray-medium ',
        )}
      >
        {children}
      </div>
    </Link>
  )
}

export default DaTabItem
