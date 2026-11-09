// Copyright (c) 2026 Eclipse Foundation.
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

export const isPrivatePrototype = (prototype?: Prototype | null) =>
  prototype?.visibility === 'private'

export type PrototypeAccess = {
  /** Edit content (code, name, image, …). */
  canEdit: boolean
  /** Change visibility; always allowed for creator, model owner and admin. */
  canManage: boolean
  canDelete: boolean
}

/**
 * Mirrors the backend prototype rules:
 * - private: creator, model owner and admin only;
 * - public (or no visibility, i.e. legacy): model writers may edit and delete,
 *   only creator/model owner/admin change visibility.
 */
const usePrototypeAccess = (prototype?: Prototype | null): PrototypeAccess => {
  const { data: user } = useSelfProfileQuery()
  // ADMIN checked against a prototype id resolves to creator / model owner /
  // global admin on the backend: no model-scoped role carries ADMIN.
  const [isManager, hasWriteModel] = usePermissionHook(
    [PERMISSIONS.ADMIN, prototype?.id],
    [PERMISSIONS.WRITE_MODEL, prototype?.model_id],
  )
  if (!user || !prototype) {
    return { canEdit: false, canManage: false, canDelete: false }
  }
  const isCreator =
    !!prototype.created_by?.id && user.id === prototype.created_by.id
  const canManage = isCreator || isManager
  if (isPrivatePrototype(prototype)) {
    return { canEdit: canManage, canManage, canDelete: canManage }
  }
  const canWrite = canManage || hasWriteModel
  return { canEdit: canWrite, canManage, canDelete: canWrite }
}

export default usePrototypeAccess
