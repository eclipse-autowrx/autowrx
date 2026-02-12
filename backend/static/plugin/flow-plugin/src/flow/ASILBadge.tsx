// Copyright (c) 2025 Eclipse Foundation.
// SPDX-License-Identifier: MIT

import { cn } from '../lib/utils'
import type { ASILLevel } from '../types/flow.type'
import { asilBgColors } from './flow.colors'

interface ASILBadgeProps {
  preAsilLevel: ASILLevel
  postAsilLevel?: ASILLevel
  showBadge?: boolean
  showFullText?: boolean
  className?: string
  preItemClassName?: string
  postItemClassName?: string
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

  const areLevelsSame = postAsilLevel ? preAsilLevel === postAsilLevel : false
  const showOverlayBadge = postAsilLevel && !areLevelsSame

  const mainBadgeDisplay =
    postAsilLevel && !areLevelsSame ? displayPost : displayPre
  const mainBadgeStyle =
    postAsilLevel && !areLevelsSame
      ? asilBgColors[postAsilLevel]
      : asilBgColors[preAsilLevel]
  const mainBadgeExtraClasses =
    postAsilLevel && !areLevelsSame ? postItemClassName : preItemClassName

  return (
    <div className={cn('relative inline-block', className)}>
      <span
        className={cn(
          'flex w-10 h-7 text-[9px] py-0 px-1 items-start justify-start font-bold rounded-md text-white',
          mainBadgeExtraClasses,
        )}
        style={{
          backgroundColor: mainBadgeStyle.bg,
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: mainBadgeStyle.border,
        }}
      >
        {mainBadgeDisplay}
      </span>
      {showOverlayBadge && (
        <span
          className={cn(
            'absolute size-[16px] text-[9px] bottom-[3px] right-[3px] transform flex items-center justify-center font-bold rounded text-white',
            preItemClassName,
          )}
          style={{
            backgroundColor: asilBgColors[preAsilLevel].bg,
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: asilBgColors[preAsilLevel].border,
          }}
        >
          {displayPre}
        </span>
      )}
    </div>
  )
}
