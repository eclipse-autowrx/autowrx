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
 * Returns true iff the current user may edit the given prototype:
 * prototype creator, model writer (WRITE_MODEL), or admin (MANAGE_USERS).
 */
const useCanEditPrototype = (prototype?: Prototype | null): boolean => {
  const { data: user } = useSelfProfileQuery()
  const [isAdmin, hasWritePermission] = usePermissionHook(
    [PERMISSIONS.MANAGE_USERS],
    [PERMISSIONS.WRITE_MODEL, prototype?.model_id],
  )
  if (!user || !prototype) return false
  if (isAdmin || hasWritePermission) return true
  if (!prototype.created_by?.id) return false
  return user.id === prototype.created_by.id
}

export default useCanEditPrototype
