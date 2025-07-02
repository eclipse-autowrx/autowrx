// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { AxiosError, isAxiosError } from 'axios'
import { serverAxios } from './base'
import { List } from '@/types/common.type'
import {
  CreateInventorySchemaPayload,
  InventoryInstance,
  InventoryInstanceCreatePayload,
  InventoryInstanceFormData,
  InventoryInstanceDetail,
  InventoryInstanceUpdatePayload,
  InventorySchema,
  InventorySchemaFormData,
  UpdateInventorySchemaPayload,
} from '@/types/inventory.type'

const handleThrowError = (
  error: unknown,
  action: string,
  type: string,
): Error => {
  if (isAxiosError(error)) {
    console.error(
      `Error ${action} ${type}:`,
      error.response?.data || error.message,
    )
    throw new Error(error.response?.data?.message || `Failed to fetch ${type}`)
  }
  console.error(
    `Unexpected error ${action} ${type}:`,
    (error as Error).message || error,
  )
  throw new Error((error as Error).message || `Failed while ${action} ${type}`)
}

export const listInventorySchemasService = async (params = {}) => {
  try {
    const response = await serverAxios.get<List<InventorySchema>>(
      '/inventory/schemas',
      {
        params,
      },
    )
    return response.data
  } catch (error) {
    handleThrowError(error, 'fetching', 'inventory schemas')
  }
}

export const getSchemaService = async (schemaId: string) => {
  try {
    const response = await serverAxios.get<InventorySchema>(
      `/inventory/schemas/${schemaId}`,
    )
    return response.data
  } catch (error) {
    if ((error as AxiosError).response?.status === 404) {
      throw new Error('Schema not found')
    }
    handleThrowError(error, 'fetching', 'inventory schema by id')
  }
}

export const createSchemaService = async (
  schemaData: InventorySchemaFormData,
) => {
  try {
    // Parse the stringified JSON before sending
    const payload: CreateInventorySchemaPayload = {
      ...schemaData,
      schema_definition: schemaData.schema_definition,
    }
    const response = await serverAxios.post<InventorySchema>(
      '/inventory/schemas',
      payload,
    )
    return response.data
  } catch (error) {
    handleThrowError(error, 'creating', 'inventory schemas')
  }
}

export const deleteSchemaService = async (schemaId: string) => {
  try {
    await serverAxios.delete(`/inventory/schemas/${schemaId}`)
  } catch (error) {
    if ((error as AxiosError).response?.status === 404) {
      throw new Error('Schema not found')
    }
    handleThrowError(error, 'deleting', 'inventory schema by id')
  }
}

export const updateSchemaService = async (
  schemaId: string,
  schemaData: Partial<InventorySchemaFormData>,
) => {
  try {
    const payload: UpdateInventorySchemaPayload = { ...schemaData }
    if (!payload.schema_definition) {
      delete payload.schema_definition
    }

    const response = await serverAxios.patch<InventorySchema>(
      `/inventory/schemas/${schemaId}`,
      payload,
    )
    return response.data
  } catch (error) {
    if ((error as AxiosError).response?.status === 404) {
      throw new Error('Schema not found')
    }
    handleThrowError(error, 'updating', 'inventory schema by id')
  }
}

export const createInstanceService = async (
  schemaId: string,
  formData: InventoryInstanceFormData,
) => {
  try {
    const payload: InventoryInstanceCreatePayload = {
      ...formData,
      data: JSON.stringify(formData.data),
      schema: schemaId,
    }

    const response = await serverAxios.post<InventoryInstance>(
      '/inventory/instances',
      payload,
    )
    return response.data
  } catch (error: any) {
    if ((error as AxiosError).response?.status === 404) {
      throw new Error('Schema not found')
    }
    handleThrowError(error, 'creating', 'inventory instance')
  }
}

export const listInventoryInstancesService = async (params = {}) => {
  try {
    const response = await serverAxios.get<List<InventoryInstance>>(
      '/inventory/instances',
      {
        params,
      },
    )
    return response.data
  } catch (error) {
    handleThrowError(error, 'fetching', 'inventory instances')
  }
}

export const getInventoryInstanceService = async (instanceId: string) => {
  try {
    const response = await serverAxios.get<InventoryInstanceDetail>(
      `/inventory/instances/${instanceId}`,
    )
    return response.data
  } catch (error) {
    if ((error as AxiosError).response?.status === 404) {
      throw new Error('Instance not found')
    }
    handleThrowError(error, 'fetching', 'inventory instance by id')
  }
}

export const updateInventoryInstanceService = async (
  instanceId: string,
  formData: InventoryInstanceFormData,
) => {
  try {
    const payload: InventoryInstanceUpdatePayload = {
      ...formData,
      ...(formData.data && {
        data: JSON.stringify(formData.data),
      }),
    }
    if (!payload.data) {
      delete payload.data
    }
    const response = await serverAxios.patch<InventoryInstance>(
      `/inventory/instances/${instanceId}`,
      payload,
    )
    return response.data
  } catch (error) {
    if ((error as AxiosError).response?.status === 404) {
      throw new Error('Instance not found')
    }
    handleThrowError(error, 'updating', 'inventory instance by id')
  }
}

export const deleteInventoryInstanceService = async (instanceId: string) => {
  try {
    return serverAxios.delete(`/inventory/instances/${instanceId}`)
  } catch (error) {
    if ((error as AxiosError).response?.status === 404) {
      throw new Error('Instance not found')
    }
    handleThrowError(error, 'deleting', 'inventory instance by id')
  }
}
