import { AxiosError, isAxiosError } from 'axios'
import { serverAxios } from './base'
import { List } from '@/types/common.type'
import {
  CreateInventorySchemaPayload,
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
      schema_definition: JSON.parse(schemaData.schema_definition),
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
    const { schema_definition, ...rest } = schemaData
    const payload: UpdateInventorySchemaPayload = {
      ...rest,
      // Parse schema_definition only if it exists and is a string
      ...(typeof schema_definition === 'string' && {
        schema_definition: JSON.parse(schema_definition),
      }),
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
