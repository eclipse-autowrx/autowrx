// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

/**
 * Default color palette - 10 nice colors for automatic assignment
 * These are used when types don't have explicit colors defined
 */
const DEFAULT_COLOR_PALETTE: string[] = [
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#06b6d4', // cyan-500
  '#eab308', // yellow-500
  '#f97316', // orange-500
  '#ec4899', // pink-500
  '#6366f1', // indigo-500
]

/**
 * Well-known type colors (for specific types that should always use these colors)
 * These take precedence over automatic assignment
 */
const WELL_KNOWN_TYPE_COLORS: Record<string, string> = {
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
  
  // Service Types
  'ATOMIC SERVICE': '#8b5cf6', // violet-500
  'BASIC SERVICE': '#3b82f6', // blue-500
  ATOMIC: '#8b5cf6', // violet-500
  BASIC: '#3b82f6', // blue-500
}

export interface TypeMetadata {
  type: string
  color?: string
  sampleCode?: string
  [key: string]: any // Allow additional properties
}

/**
 * Extract typeMetadata from CustomApiSchema schema or CustomApiSchema object
 */
export const extractTypeMetadata = (schema: string | object | null | undefined): TypeMetadata[] | null => {
  if (!schema) return null
  
  try {
    let schemaObj: any
    
    // Handle CustomApiSchema object (has schema property)
    if (typeof schema === 'object' && schema !== null && 'schema' in schema) {
      // It's a CustomApiSchema object, extract the schema string
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
 * Get all unique types from API items
 * @param items - Array of API items
 * @param displayMapping - Display mapping config to extract type field name
 * @returns Array of unique type strings
 */
export const extractUniqueTypes = (
  items: any[],
  displayMapping?: { type?: string | null } | null
): string[] => {
  if (!items || items.length === 0) return []
  
  const typeField = displayMapping?.type || 'type'
  const types = new Set<string>()
  
  items.forEach((item) => {
    // Try to get type from the configured field
    let typeValue: any = null
    
    // Handle template syntax like "{method}" or direct field name like "method"
    if (typeField.includes('{') && typeField.includes('}')) {
      // Template syntax - extract field name
      const fieldMatch = typeField.match(/\{(\w+)\}/)
      if (fieldMatch) {
        const fieldName = fieldMatch[1]
        typeValue = item[fieldName]
      }
    } else {
      // Direct field name
      typeValue = item[typeField]
    }
    
    if (typeValue && typeof typeValue === 'string') {
      types.add(typeValue.toUpperCase().trim())
    }
  })
  
  return Array.from(types).sort()
}

/**
 * Generate color assignments for unique types
 * @param uniqueTypes - Array of unique type strings
 * @param schema - The CustomApiSchema schema (optional, for existing typeMetadata)
 * @returns Map of type -> color
 */
export const generateTypeColorMap = (
  uniqueTypes: string[],
  schema?: string | object | null
): Map<string, string> => {
  const colorMap = new Map<string, string>()
  const existingMetadata = schema ? extractTypeMetadata(schema) : null
  
  // First, assign colors from schema typeMetadata if they exist
  const typesWithColors = new Set<string>()
  if (existingMetadata && Array.isArray(existingMetadata)) {
    existingMetadata.forEach((metadata) => {
      const normalizedType = metadata.type?.toUpperCase().trim()
      if (normalizedType && metadata.color) {
        colorMap.set(normalizedType, metadata.color)
        typesWithColors.add(normalizedType)
      }
    })
  }
  
  // Then, assign well-known colors
  uniqueTypes.forEach((type) => {
    const normalizedType = type.toUpperCase().trim()
    if (!typesWithColors.has(normalizedType)) {
      // Check well-known colors first
      if (WELL_KNOWN_TYPE_COLORS[normalizedType]) {
        colorMap.set(normalizedType, WELL_KNOWN_TYPE_COLORS[normalizedType])
        typesWithColors.add(normalizedType)
      } else {
        // Try matching just the first word
        const firstWord = normalizedType.split(/\s+/)[0]
        if (firstWord && WELL_KNOWN_TYPE_COLORS[firstWord]) {
          colorMap.set(normalizedType, WELL_KNOWN_TYPE_COLORS[firstWord])
          typesWithColors.add(normalizedType)
        }
      }
    }
  })
  
  // Finally, assign colors from default palette for remaining types
  let colorIndex = 0
  uniqueTypes.forEach((type) => {
    const normalizedType = type.toUpperCase().trim()
    if (!typesWithColors.has(normalizedType)) {
      const color = DEFAULT_COLOR_PALETTE[colorIndex % DEFAULT_COLOR_PALETTE.length]
      colorMap.set(normalizedType, color)
      colorIndex++
    }
  })
  
  return colorMap
}

/**
 * Generate typeMetadata array for schema
 * @param uniqueTypes - Array of unique type strings
 * @param schema - The CustomApiSchema schema (optional, for existing typeMetadata)
 * @returns Array of TypeMetadata objects
 */
export const generateTypeMetadata = (
  uniqueTypes: string[],
  schema?: string | object | null
): TypeMetadata[] => {
  const colorMap = generateTypeColorMap(uniqueTypes, schema)
  const existingMetadata = schema ? extractTypeMetadata(schema) : null
  const existingMetadataMap = new Map<string, TypeMetadata>()
  
  // Preserve existing metadata
  if (existingMetadata && Array.isArray(existingMetadata)) {
    existingMetadata.forEach((metadata) => {
      const normalizedType = metadata.type?.toUpperCase().trim()
      if (normalizedType) {
        existingMetadataMap.set(normalizedType, metadata)
      }
    })
  }
  
  // Generate metadata array
  return uniqueTypes.map((type) => {
    const normalizedType = type.toUpperCase().trim()
    const existing = existingMetadataMap.get(normalizedType)
    
    if (existing) {
      // Preserve existing metadata, ensure color is set
      return {
        ...existing,
        type: normalizedType,
        color: existing.color || colorMap.get(normalizedType) || DEFAULT_COLOR_PALETTE[0],
      }
    }
    
    // Create new metadata
    return {
      type: normalizedType,
      color: colorMap.get(normalizedType) || DEFAULT_COLOR_PALETTE[0],
    }
  })
}

/**
 * Get color for a specific type
 * @param type - The type string (e.g., 'GET', 'POST', 'BRANCH')
 * @param schema - The CustomApiSchema schema (optional, for custom typeMetadata)
 * @param items - Array of API items (optional, for auto-generating colors)
 * @param displayMapping - Display mapping config (optional, for extracting type field)
 * @returns Hex color string
 */
export const getTypeColor = (
  type: string,
  schema?: string | object | null,
  items?: any[],
  displayMapping?: { type?: string | null } | null
): string => {
  if (!type) return DEFAULT_COLOR_PALETTE[0]
  
  const normalizedType = type.toUpperCase().trim()
  
  // Try to get from schema typeMetadata first
  if (schema) {
    const typeMetadata = extractTypeMetadata(schema)
    if (typeMetadata && Array.isArray(typeMetadata)) {
      const metadata = typeMetadata.find((m) => m.type?.toUpperCase().trim() === normalizedType)
      if (metadata?.color) {
        return metadata.color
      }
    }
  }
  
  // If items are provided, generate color map dynamically
  if (items && items.length > 0) {
    const uniqueTypes = extractUniqueTypes(items, displayMapping)
    const colorMap = generateTypeColorMap(uniqueTypes, schema)
    const color = colorMap.get(normalizedType)
    if (color) {
      return color
    }
  }
  
  // Check well-known colors
  if (WELL_KNOWN_TYPE_COLORS[normalizedType]) {
    return WELL_KNOWN_TYPE_COLORS[normalizedType]
  }
  
  // Try matching just the first word
  const firstWord = normalizedType.split(/\s+/)[0]
  if (firstWord && WELL_KNOWN_TYPE_COLORS[firstWord]) {
    return WELL_KNOWN_TYPE_COLORS[firstWord]
  }
  
  // Default fallback - use first color from palette
  return DEFAULT_COLOR_PALETTE[0]
}

/**
 * Get all type metadata for a type (including sampleCode, etc.)
 */
export const getTypeMetadata = (
  type: string,
  schema?: string | object | null,
  items?: any[],
  displayMapping?: { type?: string | null } | null
): TypeMetadata | null => {
  if (!type) return null
  
  const normalizedType = type.toUpperCase().trim()
  
  if (schema) {
    const typeMetadata = extractTypeMetadata(schema)
    if (typeMetadata && Array.isArray(typeMetadata)) {
      const metadata = typeMetadata.find((m) => m.type?.toUpperCase().trim() === normalizedType)
      if (metadata) {
        return metadata
      }
    }
  }
  
  // If items are provided, generate color map dynamically
  let color = DEFAULT_COLOR_PALETTE[0]
  if (items && items.length > 0) {
    const uniqueTypes = extractUniqueTypes(items, displayMapping)
    const colorMap = generateTypeColorMap(uniqueTypes, schema)
    color = colorMap.get(normalizedType) || color
  } else {
    // Fall back to well-known colors
    color = WELL_KNOWN_TYPE_COLORS[normalizedType] || 
            WELL_KNOWN_TYPE_COLORS[normalizedType.split(/\s+/)[0]] || 
            DEFAULT_COLOR_PALETTE[0]
  }
  
  return {
    type: normalizedType,
    color,
  }
}

/**
 * Export default color palette for use in UI
 */
export const getDefaultColorPalette = (): string[] => {
  return [...DEFAULT_COLOR_PALETTE]
}

/**
 * Update schema JSON with generated typeMetadata based on items
 * This helps create the color config in the schema automatically
 * @param schemaString - The schema JSON string
 * @param items - Array of API items to extract types from
 * @param displayMapping - Display mapping config to extract type field name
 * @returns Updated schema JSON string with typeMetadata added
 */
export const updateSchemaWithTypeMetadata = (
  schemaString: string,
  items: any[],
  displayMapping?: { type?: string | null } | null
): string => {
  try {
    const schemaObj = JSON.parse(schemaString)
    const uniqueTypes = extractUniqueTypes(items, displayMapping)
    
    if (uniqueTypes.length === 0) {
      return schemaString // No types to generate metadata for
    }
    
    // Generate typeMetadata
    const typeMetadata = generateTypeMetadata(uniqueTypes, schemaObj)
    
    // Add typeMetadata to schema
    if (schemaObj.type === 'array' && schemaObj.items) {
      // For array schemas, add typeMetadata to items
      schemaObj.items.typeMetadata = typeMetadata
    } else {
      // For other schemas, add at root level
      schemaObj.typeMetadata = typeMetadata
    }
    
    return JSON.stringify(schemaObj, null, 2)
  } catch (error) {
    console.error('Error updating schema with typeMetadata:', error)
    return schemaString // Return original if error
  }
}

