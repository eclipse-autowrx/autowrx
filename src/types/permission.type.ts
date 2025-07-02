// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { User } from './user.type'

export interface CheckPermissionResponse {
  hasPermission: boolean
}

export type permission = 'unlimitedModel' | 'manageUsers' | 'generativeAI'

export interface Role {
  permissions: permission[]
  name: string
  id: string
}

export interface UsersWithRoles {
  users: User[]
  role: Role
}
