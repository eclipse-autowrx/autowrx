// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

/**
 * Default color scheme for common API types
 * These are used when typeMetadata is not provided in the schema
 */
const DEFAULT_TYPE_COLORS: Record<string, string> = {
  // HTTP Methods
  GET: '#10b981', // emerald-500
  POST: '#3b82f6', // blue-500
  PUT: '#f59e0b', // amber-500
  PATCH: '#8b5cf6', // violet-500
  DELETE: '#ef4444', // red-500
  HEAD: '#06b6d4', // cyan-500
  OPTIONS: '#6366f1', // indigo-500
  
  // COVESA Types
  BRANCH: '#a855f7', // purple-500
  SENSOR: '#10b981', // emerald-500
  ACTUATOR: '#eab308', // yellow-500
  ATTRIBUTE: '#0ea5e9', // sky-500
  
  // Default fallback
  DEFAULT: '#6b7280', // gray-500
}

export interface TypeMetadata {
  type: string
  color?: string
  sampleCode?: string
  [key: string]: any // Allow additional properties
}

/**
 * Extract typeMetadata from PluginAPI schema or PluginAPI object
 */
export const extractTypeMetadata = (schema: string | object | null | undefined): TypeMetadata[] | null => {
  if (!schema) return null
  
  try {
    let schemaObj: any
    
    // Handle PluginAPI object (has schema property)
    if (typeof schema === 'object' && schema !== null && 'schema' in schema) {
      // It's a PluginAPI object, extract the schema string
      const schemaString = (schema as any).schema
      if (schemaString) {
        schemaObj = typeof schemaString === 'string' ? JSON.parse(schemaString) : schemaString
      } else {
        return null
      }
    } else {
      // It's a schema string or object directly
      schemaObj = typeof schema === 'string' ? JSON.parse(schema) : schema
    }
    
    if (!schemaObj) return null
    
    // Check if schema has typeMetadata at root level
    if (schemaObj.typeMetadata && Array.isArray(schemaObj.typeMetadata)) {
      return schemaObj.typeMetadata
    }
    
    // Check if schema is an array and has typeMetadata in items
    if (schemaObj.type === 'array' && schemaObj.items?.typeMetadata && Array.isArray(schemaObj.items.typeMetadata)) {
      return schemaObj.items.typeMetadata
    }
    
    // Check if schema is an object and has typeMetadata
    if (schemaObj.type === 'object' && schemaObj.typeMetadata && Array.isArray(schemaObj.typeMetadata)) {
      return schemaObj.typeMetadata
    }
    
    return null
  } catch (error) {
    console.error('Error extracting typeMetadata:', error)
    return null
  }
}

/**
 * Get color for a specific type
 * @param type - The type string (e.g., 'GET', 'POST', 'BRANCH')
 * @param schema - The PluginAPI schema (optional, for custom typeMetadata)
 * @returns Hex color string
 */
export const getTypeColor = (type: string, schema?: string | object | null): string => {
  if (!type) return DEFAULT_TYPE_COLORS.DEFAULT
  
  const normalizedType = type.toUpperCase()
  
  // Try to get from schema typeMetadata first
  if (schema) {
    const typeMetadata = extractTypeMetadata(schema)
    if (typeMetadata && Array.isArray(typeMetadata)) {
      const metadata = typeMetadata.find((m) => m.type?.toUpperCase() === normalizedType)
      if (metadata?.color) {
        return metadata.color
      }
    }
  }
  
  // Fall back to default colors
  return DEFAULT_TYPE_COLORS[normalizedType] || DEFAULT_TYPE_COLORS.DEFAULT
}

/**
 * Get all type metadata for a type (including sampleCode, etc.)
 */
export const getTypeMetadata = (type: string, schema?: string | object | null): TypeMetadata | null => {
  if (!type) return null
  
  const normalizedType = type.toUpperCase()
  
  if (schema) {
    const typeMetadata = extractTypeMetadata(schema)
    if (typeMetadata && Array.isArray(typeMetadata)) {
      const metadata = typeMetadata.find((m) => m.type?.toUpperCase() === normalizedType)
      if (metadata) {
        return metadata
      }
    }
  }
  
  // Return default metadata with color
  return {
    type: normalizedType,
    color: DEFAULT_TYPE_COLORS[normalizedType] || DEFAULT_TYPE_COLORS.DEFAULT,
  }
}

