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

export interface InventorySchema {
  id: string
  name: string
  description?: string
  schema_definition: Record<string, any>
  created_by?: User
  created_at: string
}

export interface InventorySchemaFormData {
  name: string
  description?: string
  schema_definition: string
}

export type CreateInventorySchemaPayload = Omit<
  InventorySchemaFormData,
  'schema_definition'
> & {
  schema_definition: Record<string, any>
}

export type UpdateInventorySchemaPayload = Partial<
  Omit<InventorySchemaFormData, 'schema_definition'>
> & {
  schema_definition?: Record<string, any>
}
