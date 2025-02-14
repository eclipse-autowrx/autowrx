import { User } from './user.type'

export type CreateInventoryItem = {
  name: string
  visibility: 'private' | 'public'
  type: string
  details: any
  image?: string
}

export type InventoryItem = Omit<CreateInventoryItem, 'type'> & {
  createdAt: string
  updatedAt: string
  created_by?: Partial<User>
  type?: InventoryType
}

export type InventoryType = {
  id: string
  name: string
  description: string
  schema: any
  created_by?: Partial<User>
  createdAt: string
  updatedAt: string
}
