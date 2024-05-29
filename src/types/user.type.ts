interface Roles {
  model_contributor: string[]
  tenant_admin: string[]
  model_member: string[]
}

interface UserInfo {
  email: string
  providerId: string
}

export interface User extends Document {
  name: string
  email: string
  role: "admin" | "user"
  roles: Roles
  emailVerified: boolean
  isSystemAdmin: boolean
  image_file?: string
  provider: string
  uid?: string
  provider_data?: UserInfo[]
  createdAt?: Date
  updatedAt?: Date
}
