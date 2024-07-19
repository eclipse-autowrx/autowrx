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
