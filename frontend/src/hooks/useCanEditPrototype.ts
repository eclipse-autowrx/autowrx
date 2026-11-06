// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import usePrototypeAccess from '@/hooks/usePrototypeAccess'
import type { Prototype } from '@/types/model.type'

/**
 * Returns true iff the current user may edit the given prototype.
 * Private: creator, model owner or admin. Public: any signed-in user.
 */
const useCanEditPrototype = (prototype?: Prototype | null): boolean =>
  usePrototypeAccess(prototype).canEdit

export default useCanEditPrototype
