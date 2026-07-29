// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import useSelfProfileQuery from '@/hooks/useSelfProfile'
import usePermissionHook from '@/hooks/usePermissionHook'
import { PERMISSIONS } from '@/data/permission'
import type { Prototype } from '@/types/model.type'

/**
 * Returns true iff the current user is the creator of the given prototype
 * or an admin (MANAGE_USERS permission).
 */
const useCanEditPrototype = (prototype?: Prototype | null): boolean => {
  const { data: user } = useSelfProfileQuery()
  const [isAdmin] = usePermissionHook([PERMISSIONS.MANAGE_USERS])
  if (!user || !prototype?.created_by?.id) return false
  return user.id === prototype.created_by.id || isAdmin
}

export default useCanEditPrototype
