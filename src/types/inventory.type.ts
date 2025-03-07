import { User } from './user.type'

export type CreateInventoryItem = {
  name: string
  type: string
  image?: string
}

export type InventoryItem = Omit<CreateInventoryItem, 'type'> & {
  id: string
  description?: string
  createdAt: string
  updatedAt: string
  created_by?: Partial<User>
  type: string
  [x: string | number | symbol]: any
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
