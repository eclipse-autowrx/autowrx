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
