/**
 * Extract id_format from JSON schema
 */
export const extractIdFormat = (schema: string | object): string | null => {
  try {
    const schemaObj = typeof schema === 'string' ? JSON.parse(schema) : schema
    
    // If schema is an array, check items.id_format
    if (schemaObj.type === 'array' && schemaObj.items?.id_format) {
      return schemaObj.items.id_format
    }
    
    // If schema is an object, check id_format directly
    if (schemaObj.type === 'object' && schemaObj.id_format) {
      return schemaObj.id_format
    }
    
    return null
  } catch {
    return null
  }
}

/**
 * Generate ID from template string
 * @param template - Template string with variables like "{method}:{path}"
 * @param item - Item data object
 * @returns Generated ID string
 */
export const generateIdFromTemplate = (template: string, item: any): string => {
  if (!template) return ''
  
  // Replace template variables like {method}, {path}, etc.
  let generatedId = template.replace(/\{(\w+)\}/g, (match, fieldName) => {
    const value = item[fieldName]
    if (value === null || value === undefined || value === '') {
      return '' // Return empty string if field is missing
    }
    
    // Convert to string and keep original formatting
    let strValue = String(value)
    
    // Keep method in original case (uppercase)
    // Keep path with slashes as-is
    // No aggressive cleaning - preserve the original format
    
    return strValue
  })
  
  // Clean up any double separators (but preserve single separators like : and /)
  generatedId = generatedId
    .replace(/[:]{2,}/g, ':') // Replace multiple colons with single
    .replace(/^[:]+|[:]+$/g, '') // Remove leading/trailing colons only
  
  return generatedId.trim()
}

/**
 * Generate ID with fallback logic
 * @param item - Item data
 * @param index - Item index
 * @param existingIds - Set of existing IDs
 * @param schema - JSON Schema (string or object)
 * @returns Generated unique ID
 */
export const generateItemId = (
  item: any,
  index: number,
  existingIds: Set<string>,
  schema?: string | object | null
): string => {
  // If item already has an ID, use it (but ensure uniqueness)
  if (item.id && typeof item.id === 'string' && item.id.trim()) {
    const baseId = item.id.trim()
    let uniqueId = baseId
    let counter = 1
    while (existingIds.has(uniqueId)) {
      uniqueId = `${baseId}_${counter}`
      counter++
    }
    return uniqueId
  }

  // Try to use id_format from schema
  if (schema) {
    const idFormat = extractIdFormat(schema)
    if (idFormat && idFormat.trim()) {
      const generatedId = generateIdFromTemplate(idFormat, item)
      if (generatedId) {
        let uniqueId = generatedId
        let counter = 1
        while (existingIds.has(uniqueId)) {
          uniqueId = `${generatedId}_${counter}`
          counter++
        }
        return uniqueId
      }
    }
  }

  // Fallback: Try common identifier fields (in order of preference)
  const identifierFields = ['name', 'path', 'endpoint', 'node_id', 'key', 'code', 'label', 'title']
  for (const field of identifierFields) {
    if (item[field] && typeof item[field] === 'string' && item[field].trim()) {
      let baseId = item[field].trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_').replace(/_+/g, '_')
      if (baseId) {
        // For paths, also normalize
        if (field === 'path') {
          baseId = baseId.replace(/^\//, '').replace(/\//g, '_')
        }
        let uniqueId = baseId
        let counter = 1
        while (existingIds.has(uniqueId)) {
          uniqueId = `${baseId}_${counter}`
          counter++
        }
        return uniqueId
      }
    }
  }

  // Try combination of path and method
  const path = item.path || ''
  const method = item.method || ''
  if (path && method) {
    // Keep method in original case and path with slashes
    let baseId = `${method}:${path}`
    let uniqueId = baseId
    let counter = 1
    while (existingIds.has(uniqueId)) {
      uniqueId = `${baseId}_${counter}`
      counter++
    }
    return uniqueId
  }

  // Final fallback: index-based ID
  let uniqueId = `item_${index + 1}`
  let counter = 1
  while (existingIds.has(uniqueId)) {
    uniqueId = `item_${index + 1}_${counter}`
    counter++
  }
  return uniqueId
}

