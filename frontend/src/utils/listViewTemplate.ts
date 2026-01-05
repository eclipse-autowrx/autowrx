/**
 * Extract list_view_config from JSON schema or PluginAPI object
 * Priority: schema JSON string > top-level list_view_config
 */
export const extractListViewConfig = (schema: string | object | any): {
  title?: string | null
  description?: string | null
  type?: string | null
  style?: 'compact' | 'badge' | 'badge-image' | null
} | null => {
  try {
    // If it's a PluginAPI object, FIRST check the schema string inside it (higher priority)
    // This is where users typically edit list_view_config in the JSON editor
    if (schema && typeof schema === 'object' && 'schema' in schema && typeof schema.schema === 'string') {
      try {
        const parsedSchema = JSON.parse(schema.schema)
        // Check if schema is an array with items.list_view_config
        if (parsedSchema.type === 'array' && parsedSchema.items?.list_view_config) {
          return parsedSchema.items.list_view_config
        }
        // Check if schema has list_view_config at root
        if (parsedSchema.list_view_config) {
          return parsedSchema.list_view_config
        }
      } catch {
        // Ignore parse errors, continue to check other locations
      }
    }
    
    // Then check if it's a PluginAPI object with list_view_config at top level (fallback)
    if (schema && typeof schema === 'object' && 'list_view_config' in schema) {
      return schema.list_view_config || null
    }
    
    // If it's a string, try to parse it
    const schemaObj = typeof schema === 'string' ? JSON.parse(schema) : schema
    
    // Check if schema is an array with items.list_view_config
    if (schemaObj.type === 'array' && schemaObj.items?.list_view_config) {
      return schemaObj.items.list_view_config
    }
    
    // Check if schema is an object with list_view_config
    if (schemaObj.type === 'object' && schemaObj.list_view_config) {
      return schemaObj.list_view_config
    }
    
    // Check direct property
    if (schemaObj.list_view_config) {
      return schemaObj.list_view_config
    }
    
    return null
  } catch {
    return null
  }
}

/**
 * Extract list_view_style from JSON schema or PluginAPI object
 * Returns 'compact' (default), 'badge', or 'badge-image'
 * Priority: schema JSON string > top-level list_view_config
 */
export const extractListViewStyle = (schema: string | object | any): 'compact' | 'badge' | 'badge-image' => {
  try {
    // First check the schema JSON string (where users typically edit it)
    // This is the highest priority since it's what users edit in the JSON editor
    if (schema && typeof schema === 'object' && 'schema' in schema && typeof schema.schema === 'string') {
      try {
        const parsedSchema = JSON.parse(schema.schema)
        let config = null
        
        // Check if schema is an array with items.list_view_config
        if (parsedSchema.type === 'array' && parsedSchema.items?.list_view_config) {
          config = parsedSchema.items.list_view_config
        }
        // Check if schema has list_view_config at root
        else if (parsedSchema.list_view_config) {
          config = parsedSchema.list_view_config
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
    
    // Then check if it's a PluginAPI object with list_view_config at top level (fallback)
    if (schema && typeof schema === 'object' && 'list_view_config' in schema) {
      const config = schema.list_view_config
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
    const listViewConfig = extractListViewConfig(schema)
    if (listViewConfig?.style === 'badge-image') {
      return 'badge-image'
    }
    if (listViewConfig?.style === 'badge') {
      return 'badge'
    }
    if (listViewConfig?.style === 'compact') {
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
export const renderListViewField = (template: string | null | undefined, item: any): string => {
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
 * @param listViewConfig - List view configuration from schema
 * @returns Object with title, description, and type
 */
export const getListViewDisplayValues = (
  item: any,
  listViewConfig?: {
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
  
  if (!listViewConfig) {
    return defaults
  }
  
  return {
    title: renderListViewField(listViewConfig.title, item) || defaults.title,
    description: renderListViewField(listViewConfig.description, item) || defaults.description,
    type: renderListViewField(listViewConfig.type, item) || defaults.type,
  }
}

