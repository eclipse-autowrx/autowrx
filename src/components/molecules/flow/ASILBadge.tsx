import { cn } from '@/lib/utils'

export type ASILLevel = 'A' | 'B' | 'C' | 'D' | 'QM'

interface ASILBadgeProps {
  level: ASILLevel
  showBadge?: boolean
  showFullText?: boolean
  className?: string
}

const levelColors: Record<ASILLevel, string> = {
  D: 'bg-red-500 border border-red-700',
  C: 'bg-orange-500 border border-orange-700',
  B: 'bg-yellow-500 border border-yellow-700',
  A: 'bg-green-500 border border-green-700',
  QM: 'bg-blue-500 border border-blue-700',
}

export const ASILBadge = ({
  level,
  showBadge = true,
  showFullText = false,
  className,
}: ASILBadgeProps) => {
  if (!showBadge) return null

  const displayText = level === 'QM' ? 'QM' : `ASIL-${level}`

  return (
    <span
      className={cn(
        'flex px-1 items-center justify-center font-bold rounded-md text-white',
        levelColors[level],
        className,
      )}
    >
      {showFullText ? displayText : level}
    </span>
  )
}
