// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { Prototype } from '@/types/model.type'
import {
  getPrototypeLastViewed,
  PrototypeLastViewed,
} from '@/utils/prototypeLastViewed'

export type PrototypeViewSort = 'last-viewed' | 'first-viewed'

const compareNames = (a: Prototype, b: Prototype) =>
  a.name.localeCompare(b.name)

export function sortPrototypesByViewed(
  prototypes: Prototype[],
  mode: PrototypeViewSort,
  lastViewed: PrototypeLastViewed = getPrototypeLastViewed(),
): Prototype[] {
  return [...prototypes].sort((a, b) => {
    const lastViewedA = lastViewed[a.id]
    const lastViewedB = lastViewed[b.id]
    const hasViewedA = lastViewedA !== undefined
    const hasViewedB = lastViewedB !== undefined

    if (!hasViewedA && !hasViewedB) return compareNames(a, b)
    if (!hasViewedA) return 1
    if (!hasViewedB) return -1

    const timestampDifference =
      mode === 'last-viewed'
        ? lastViewedB - lastViewedA
        : lastViewedA - lastViewedB
    return timestampDifference || compareNames(a, b)
  })
}
