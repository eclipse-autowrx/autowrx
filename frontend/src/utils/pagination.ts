// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

export type PageItem = number | 'ellipsis'

/** Max page-number buttons shown (ellipsis slots are extra). */
export const MAX_VISIBLE_PAGE_BUTTONS = 7

/**
 * Build a sliding window of page numbers with ellipsis for large totals.
 * Examples (maxVisible=7, total=10):
 * - page 1 → 1 2 3 4 5 … 10
 * - page 5 → 1 … 4 5 6 … 10
 * - page 10 → 1 … 6 7 8 9 10
 */
export function getVisiblePageItems(
  currentPage: number,
  totalPages: number,
  maxVisible: number = MAX_VISIBLE_PAGE_BUTTONS,
): PageItem[] {
  if (totalPages <= 0) return []

  const total = Math.floor(totalPages)
  const current = Math.min(Math.max(1, Math.floor(currentPage)), total)

  if (total <= maxVisible) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const edgeCount = maxVisible - 2
  const siblingCount = 1
  const showLeftEllipsis = current - siblingCount > 2
  const showRightEllipsis = current + siblingCount < total - 1

  if (!showLeftEllipsis && showRightEllipsis) {
    const items: PageItem[] = []
    for (let i = 1; i <= edgeCount; i++) items.push(i)
    items.push('ellipsis')
    items.push(total)
    return items
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    const items: PageItem[] = [1, 'ellipsis']
    for (let i = total - edgeCount + 1; i <= total; i++) items.push(i)
    return items
  }

  if (showLeftEllipsis && showRightEllipsis) {
    const items: PageItem[] = [1, 'ellipsis']
    for (
      let i = current - siblingCount;
      i <= current + siblingCount;
      i++
    ) {
      items.push(i)
    }
    items.push('ellipsis')
    items.push(total)
    return items
  }

  return Array.from({ length: total }, (_, i) => i + 1)
}
