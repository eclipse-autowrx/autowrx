interface Roles {
  model_contributor: string[]
  tenant_admin: string[]
  model_member: string[]
}

interface UserInfo {
  email: string
  providerId: string
}

export type UserCreate = {
  name: string
  email?: string
  password: string
}

export type User = Omit<UserCreate, 'password'> & {
  roles: Roles
  email_verified: boolean
  image_file?: string
  provider: string
  provider_data?: UserInfo[]
  created_at: Date
  id: string
}

export type UserUpdate = Partial<
  Omit<User, 'email_verified' | 'created_at' | 'id'>
> & {
  password?: string
}

export type InvitedUser = {
  email?: string
  image_file?: string
  name: string
  id: string
  access_level?: string // Label of access level: Eg. Owner, Member, Contributor, ...
  access_level_id?: string // ID of access level: Eg. owner, model_member, model_contributor, ...
  forbid_remove?: boolean
}
