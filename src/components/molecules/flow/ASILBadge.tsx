import { cn } from '@/lib/utils'

export type ASILLevel = 'A' | 'B' | 'C' | 'D' | 'QM'

interface ASILBadgeProps {
  preAsilLevel: ASILLevel
  postAsilLevel?: ASILLevel
  showBadge?: boolean
  showFullText?: boolean
  className?: string
  preItemClassName?: string
  postItemClassName?: string
}

const levelColors: Record<ASILLevel, string> = {
  D: 'bg-red-500 border border-red-700',
  C: 'bg-orange-500 border border-orange-700',
  B: 'bg-yellow-500 border border-yellow-700',
  A: 'bg-green-500 border border-green-700',
  QM: 'bg-blue-500 border border-blue-700',
}

export const ASILBadge = ({
  preAsilLevel,
  postAsilLevel,
  showBadge = true,
  showFullText = false,
  className,
  preItemClassName,
  postItemClassName,
}: ASILBadgeProps) => {
  if (!showBadge) return null

  // Display text: if showFullText is true, then show "ASIL-X" (except QM remains QM)
  const displayPre = showFullText
    ? preAsilLevel === 'QM'
      ? 'QM'
      : `ASIL-${preAsilLevel}`
    : preAsilLevel

  const displayPost =
    postAsilLevel &&
    (showFullText
      ? postAsilLevel === 'QM'
        ? 'QM'
        : `ASIL-${postAsilLevel}`
      : postAsilLevel)

  return (
    <div className={cn('relative inline-block', className)}>
      {/* Pre-Mitigation badge (the main, larger badge) */}
      <span
        className={cn(
          'flex w-9 h-7 text-[9px] py-0 px-1 items-start justify-start font-bold rounded-md text-white',
          levelColors[preAsilLevel],
          preItemClassName,
        )}
      >
        {displayPre}
      </span>
      {/* Post-Mitigation badge (if provided), rendered as a smaller rectangle in the bottom right */}
      {displayPost && (
        <span
          className={cn(
            'absolute w-6 !text-[9px] bottom-1 right-1 transform translate-x-1/2 translate-y-1/2 flex px-1 py-0.5 items-center justify-center font-bold rounded-md text-white',
            levelColors[postAsilLevel],
            postItemClassName,
          )}
        >
          {displayPost}
        </span>
      )}
    </div>
  )
}
