// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { cn } from '@/lib/utils'
import { ASILLevel } from '@/types/flow.type'

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

  // Determine the text to display for each level.
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

  // Check if both levels are provided and are identical.
  const areLevelsSame = postAsilLevel ? preAsilLevel === postAsilLevel : false

  // Determine if we need to show the overlay badge:
  // Only show it if a post-mitigation level is provided and it differs from pre-mitigation.
  const showOverlayBadge = postAsilLevel && !areLevelsSame

  // Decide which badge is the "main" (larger) badge.
  // If there's a post-mitigation level that is different from the pre-mitigation level,
  // then use the post-mitigation values; otherwise, use the pre-mitigation values.
  const mainBadgeDisplay =
    postAsilLevel && !areLevelsSame ? displayPost : displayPre
  const mainBadgeColor =
    postAsilLevel && !areLevelsSame
      ? levelColors[postAsilLevel]
      : levelColors[preAsilLevel]
  const mainBadgeExtraClasses =
    postAsilLevel && !areLevelsSame ? postItemClassName : preItemClassName

  return (
    <div className={cn('relative inline-block', className)}>
      {/* Main badge (larger rectangle) */}
      <span
        className={cn(
          'flex w-10 h-7 text-[9px] py-0 px-1 items-start justify-start font-bold rounded-md text-white',
          mainBadgeColor,
          mainBadgeExtraClasses,
        )}
      >
        {mainBadgeDisplay}
      </span>

      {/* Overlay badge (smaller rectangle) rendered only if levels differ */}
      {showOverlayBadge && (
        <span
          className={cn(
            'absolute size-[16px] !text-[9px] bottom-[3px] right-[3px] transform flex items-center justify-center font-bold rounded text-white',
            levelColors[preAsilLevel],
            preItemClassName,
          )}
        >
          {displayPre}
        </span>
      )}
    </div>
  )
}
