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
  email: string
  password: string
  role: 'admin' | 'user'
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
