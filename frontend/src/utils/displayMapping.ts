/**
 * Extract display_mapping from JSON schema or CustomApiSchema object
 * Priority: schema JSON string > top-level display_mapping
 */
export const extractDisplayMapping = (schema: string | object | any): {
  title?: string | null
  description?: string | null
  type?: string | null
  style?: 'compact' | 'badge' | 'badge-image' | null
  image?: string | null
} | null => {
  try {
    // If it's a CustomApiSchema object, FIRST check the schema string inside it (higher priority)
    // This is where users typically edit display_mapping in the JSON editor
    if (schema && typeof schema === 'object' && 'schema' in schema && typeof schema.schema === 'string') {
      try {
        const parsedSchema = JSON.parse(schema.schema)
        // Check if schema is an array with items.display_mapping
        if (parsedSchema.type === 'array' && parsedSchema.items?.display_mapping) {
          return parsedSchema.items.display_mapping
        }
        // Check if schema has display_mapping at root
        if (parsedSchema.display_mapping) {
          return parsedSchema.display_mapping
        }
      } catch {
        // Ignore parse errors, continue to check other locations
      }
    }
    
    // Then check if it's a CustomApiSchema object with display_mapping at top level (fallback)
    if (schema && typeof schema === 'object' && 'display_mapping' in schema) {
      return schema.display_mapping || null
    }
    
    // If it's a string, try to parse it
    const schemaObj = typeof schema === 'string' ? JSON.parse(schema) : schema
    
    // Check if schema is an array with items.display_mapping
    if (schemaObj.type === 'array' && schemaObj.items?.display_mapping) {
      return schemaObj.items.display_mapping
    }
    
    // Check if schema is an object with display_mapping
    if (schemaObj.type === 'object' && schemaObj.display_mapping) {
      return schemaObj.display_mapping
    }
    
    // Check direct property
    if (schemaObj.display_mapping) {
      return schemaObj.display_mapping
    }
    
    return null
  } catch {
    return null
  }
}

/**
 * Extract display style from JSON schema or CustomApiSchema object
 * Returns 'compact' (default), 'badge', or 'badge-image'
 * Priority: schema JSON string > top-level display_mapping
 */
export const extractDisplayStyle = (schema: string | object | any): 'compact' | 'badge' | 'badge-image' => {
  try {
    // First check the schema JSON string (where users typically edit it)
    // This is the highest priority since it's what users edit in the JSON editor
    if (schema && typeof schema === 'object' && 'schema' in schema && typeof schema.schema === 'string') {
      try {
        const parsedSchema = JSON.parse(schema.schema)
        let config = null
        
        // Check if schema is an array with items.display_mapping
        if (parsedSchema.type === 'array' && parsedSchema.items?.display_mapping) {
          config = parsedSchema.items.display_mapping
        }
        // Check if schema has display_mapping at root
        else if (parsedSchema.display_mapping) {
          config = parsedSchema.display_mapping
        }
        
        if (config && typeof config === 'object' && 'style' in config) {
          if (config.style === 'badge-image') {
            return 'badge-image'
          }
          if (config.style === 'badge') {
            return 'badge'
          }
          if (config.style === 'compact') {
            return 'compact'
          }
        }
      } catch {
        // Ignore parse errors, continue to check other locations
      }
    }
    
    // Then check if it's a CustomApiSchema object with display_mapping at top level (fallback)
    if (schema && typeof schema === 'object' && 'display_mapping' in schema) {
      const config = schema.display_mapping
      if (config && typeof config === 'object' && 'style' in config) {
        if (config.style === 'badge-image') {
          return 'badge-image'
        }
        if (config.style === 'badge') {
          return 'badge'
        }
        if (config.style === 'compact') {
          return 'compact'
        }
      }
    }
    
    // Finally check the extracted config (for other cases)
    const displayMapping = extractDisplayMapping(schema)
    if (displayMapping?.style === 'badge-image') {
      return 'badge-image'
    }
    if (displayMapping?.style === 'badge') {
      return 'badge'
    }
    if (displayMapping?.style === 'compact') {
      return 'compact'
    }
    
    // Default to 'compact'
    return 'compact'
  } catch {
    return 'compact'
  }
}

/**
 * Render a field value from template string or direct field name
 * @param template - Template string with variables like "{method}:{path}" or direct field name like "summary"
 * @param item - Item data object
 * @returns Rendered string value
 */
export const renderDisplayField = (template: string | null | undefined, item: any): string => {
  if (!template || !template.trim()) {
    return ''
  }
  
  const templateStr = template.trim()
  
  // Check if it's a template string (contains {})
  if (templateStr.includes('{') && templateStr.includes('}')) {
    // It's a template string - use template replacement
    return generateValueFromTemplate(templateStr, item)
  } else {
    // It's a direct field name - return the field value
    const value = item[templateStr]
    if (value === null || value === undefined) {
      return ''
    }
    return String(value)
  }
}

/**
 * Generate value from template string (similar to generateIdFromTemplate but preserves formatting)
 * @param template - Template string with variables like "{method}:{path}"
 * @param item - Item data object
 * @returns Generated string value
 */
const generateValueFromTemplate = (template: string, item: any): string => {
  if (!template) return ''
  
  // Replace template variables like {method}, {path}, etc.
  let generatedValue = template.replace(/\{(\w+)\}/g, (match, fieldName) => {
    const value = item[fieldName]
    if (value === null || value === undefined || value === '') {
      return '' // Return empty string if field is missing
    }
    
    // Convert to string and preserve original formatting (unlike ID generation)
    return String(value)
  })
  
  // Clean up any double separators (but preserve single separators like : and /)
  generatedValue = generatedValue
    .replace(/[:]{2,}/g, ':') // Replace multiple colons with single
    .replace(/^[:]+|[:]+$/g, '') // Remove leading/trailing colons only
  
  return generatedValue.trim()
}

/**
 * Get display values for list view item
 * @param item - Item data
 * @param displayMapping - Display mapping configuration from schema
 * @returns Object with title, description, and type
 */
export const getDisplayValues = (
  item: any,
  displayMapping?: {
    title?: string | null
    description?: string | null
    type?: string | null
  } | null
): {
  title: string
  description: string
  type: string
} => {
  // Default fallback values
  const defaults = {
    title: item.id || '',
    description: item.path || '',
    type: item.method || '',
  }
  
  if (!displayMapping) {
    return defaults
  }
  
  return {
    title: renderDisplayField(displayMapping.title, item) || defaults.title,
    description: renderDisplayField(displayMapping.description, item) || defaults.description,
    type: renderDisplayField(displayMapping.type, item) || defaults.type,
  }
}

// Backward compatibility exports (deprecated, use new names)
export const extractListViewConfig = extractDisplayMapping
export const extractListViewStyle = extractDisplayStyle
export const renderListViewField = renderDisplayField
export const getListViewDisplayValues = getDisplayValues

