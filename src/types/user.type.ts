interface Roles {
  model_contributor: string[]
  tenant_admin: string[]
  model_member: string[]
}

interface UserInfo {
  email: string
  providerId: string
}

export interface User {
  name: string
  email: string
  role: 'admin' | 'user'
  roles: Roles
  email_verified: boolean
  is_system_admin: boolean
  image_file?: string
  provider: string
  uid?: string
  provider_data?: UserInfo[]
  created_at: Date
  id: string
}
