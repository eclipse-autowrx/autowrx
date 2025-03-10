import { User } from './user.type'

export type CreateInventoryItem = {
  type: string
  data: {
    [key: string | number | symbol]: any
  }
}

export type InventoryItem = CreateInventoryItem & {
  id: string
  typeData?: any
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
