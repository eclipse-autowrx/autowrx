// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

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

export interface InventorySchemaPopulated {
  name: string
  id: string
}

export interface InventorySchemaFormData {
  name: string
  description?: string
  schema_definition: string
}

export type CreateInventorySchemaPayload = InventorySchemaFormData

export type UpdateInventorySchemaPayload = Partial<
  Omit<InventorySchemaFormData, 'schema_definition'>
> & {
  schema_definition?: string
}

export interface InventoryInstance {
  id: string
  name: string
  schema: InventorySchemaPopulated
  data: Record<string, any>
  created_by?: User
  created_at: string
}

export type InventoryInstanceDetail = Omit<InventoryInstance, 'schema'> & {
  schema: InventorySchema
}

export type InventoryInstanceFormData = {
  name: string
  data: Record<string, any>
}

export type InventoryInstanceCreatePayload = Omit<
  InventoryInstanceFormData,
  'data'
> & {
  data: string
  schema: string
}

export type InventoryInstanceUpdatePayload = Partial<
  Omit<InventoryInstanceFormData, 'data'> & {
    data?: string
  }
>
