// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import axios from 'axios'
import { CustomApiSchema } from '@/services/customApiSchema.service'
import { CustomApiSet, getCustomApiSetById } from '@/services/customApiSet.service'
import { getCustomApiSchemaById } from '@/services/customApiSchema.service'

const removeSpecialCharacters = (str: string) => {
  return str.replace(/[^a-zA-Z0-9 ]/g, '')
}

/**
 * Export CustomApiSchema as JSON file
 */
export const exportCustomApiSchema = async (schema: CustomApiSchema) => {
  try {
    const exportData = {
      name: schema.name,
      code: schema.code,
      description: schema.description,
      type: schema.type,
      schema: schema.schema,
      id_format: schema.id_format,
      relationships: schema.relationships,
      tree_config: schema.tree_config,
      display_mapping: schema.display_mapping,
      version: schema.version,
      is_active: schema.is_active,
    }

    const jsonString = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const filename = `custom_api_schema_${removeSpecialCharacters(schema.name || schema.code)}.json`
    saveAs(blob, filename)
  } catch (error) {
    console.error('Error exporting CustomApiSchema:', error)
    throw error
  }
}

/**
 * Export CustomApiSet as ZIP file (includes schema + set data)
 */
export const exportCustomApiSet = async (set: CustomApiSet) => {
  try {
    // Fetch the schema
    const schema = await getCustomApiSchemaById(set.custom_api_schema)
    
    const zip = new JSZip()
    
    // Add schema file
    const schemaData = {
      name: schema.name,
      code: schema.code,
      description: schema.description,
      type: schema.type,
      schema: schema.schema,
      id_format: schema.id_format,
      relationships: schema.relationships,
      tree_config: schema.tree_config,
      display_mapping: schema.display_mapping,
      version: schema.version,
      is_active: schema.is_active,
    }
    zip.file('schema.json', JSON.stringify(schemaData, null, 2))
    
    // Add set data file
    const setData = {
      name: set.name,
      description: set.description,
      custom_api_schema_code: set.custom_api_schema_code,
      data: set.data,
      avatar: set.avatar,
      provider_url: set.provider_url,
    }
    zip.file('set.json', JSON.stringify(setData, null, 2))
    
    // Add avatar image if exists
    if (set.avatar) {
      try {
        // Download image as arraybuffer (same pattern as getImgFile in zipUtils)
        const imageResponse = await axios.get(set.avatar, { responseType: 'arraybuffer' })
        
        // Detect image format from URL or Content-Type header
        let imageExtension = 'png' // default
        const contentType = imageResponse.headers['content-type']
        const avatarUrl = set.avatar.toLowerCase()
        
        if (contentType) {
          if (contentType.includes('svg')) {
            imageExtension = 'svg'
          } else if (contentType.includes('jpeg') || contentType.includes('jpg')) {
            imageExtension = 'jpg'
          } else if (contentType.includes('png')) {
            imageExtension = 'png'
          } else if (contentType.includes('webp')) {
            imageExtension = 'webp'
          } else if (contentType.includes('gif')) {
            imageExtension = 'gif'
          }
        } else {
          // Fallback: check URL extension
          if (avatarUrl.includes('.svg')) {
            imageExtension = 'svg'
          } else if (avatarUrl.includes('.jpg') || avatarUrl.includes('.jpeg')) {
            imageExtension = 'jpg'
          } else if (avatarUrl.includes('.webp')) {
            imageExtension = 'webp'
          } else if (avatarUrl.includes('.gif')) {
            imageExtension = 'gif'
          }
        }
        
        zip.file(`avatar.${imageExtension}`, imageResponse.data, { binary: true })
      } catch (error) {
        // Continue without avatar if download fails
      }
    }
    
    // Generate ZIP file
    const content = await zip.generateAsync({ type: 'blob' })
    const filename = `custom_api_set_${removeSpecialCharacters(set.name)}.zip`
    saveAs(content, filename)
  } catch (error) {
    console.error('Error exporting CustomApiSet:', error)
    throw error
  }
}

/**
 * Import CustomApiSchema from JSON file
 */
export const importCustomApiSchemaFromJSON = async (file: File): Promise<Partial<CustomApiSchema>> => {
  try {
    const text = await file.text()
    const data = JSON.parse(text)
    
    // Validate required fields
    if (!data.name || !data.code || !data.type || !data.schema) {
      throw new Error('Invalid CustomApiSchema file. Missing required fields: name, code, type, or schema')
    }
    
    return {
      name: data.name,
      code: data.code,
      description: data.description,
      type: data.type,
      schema: data.schema,
      id_format: data.id_format,
      relationships: data.relationships,
      tree_config: data.tree_config,
      display_mapping: data.display_mapping,
      version: data.version || '1.0.0',
      is_active: data.is_active !== undefined ? data.is_active : true,
    }
  } catch (error) {
    console.error('Error importing CustomApiSchema:', error)
    throw error
  }
}

/**
 * Import CustomApiSet from ZIP file
 * Returns { schema: Partial<CustomApiSchema>, set: Partial<CustomApiSet>, avatarBlob?: Blob, avatarExtension?: string }
 */
export const importCustomApiSetFromZIP = async (
  file: File
): Promise<{
  schema: Partial<CustomApiSchema>
  set: Partial<CustomApiSet>
  avatarBlob?: Blob
  avatarExtension?: string
}> => {
  try {
    const zip = new JSZip()
    const zipFile = await zip.loadAsync(file)
    
    if (!zipFile) {
      throw new Error('Invalid ZIP file')
    }
    
    // Read schema.json
    const schemaStr = await zipFile.file('schema.json')?.async('string')
    if (!schemaStr) {
      throw new Error('ZIP file missing schema.json')
    }
    const schemaData = JSON.parse(schemaStr)
    
    // Validate schema
    if (!schemaData.name || !schemaData.code || !schemaData.type || !schemaData.schema) {
      throw new Error('Invalid schema.json. Missing required fields: name, code, type, or schema')
    }
    
    // Read set.json (was instance.json)
    const setStr = await zipFile.file('set.json')?.async('string') || await zipFile.file('instance.json')?.async('string')
    if (!setStr) {
      throw new Error('ZIP file missing set.json or instance.json')
    }
    const setData = JSON.parse(setStr)
    
    // Validate set
    if (!setData.name || !setData.data) {
      throw new Error('Invalid set.json. Missing required fields: name or data')
    }
    
    // Read avatar if exists (check multiple formats)
    let avatarBlob: Blob | undefined
    let avatarExtension: string | undefined
    const avatarFormats = ['svg', 'png', 'jpg', 'jpeg', 'webp', 'gif']
    for (const format of avatarFormats) {
      const avatarFile = zipFile.file(`avatar.${format}`)
      if (avatarFile) {
        avatarBlob = await avatarFile.async('blob')
        avatarExtension = format
        break
      }
    }
    
    return {
      schema: {
        name: schemaData.name,
        code: schemaData.code,
        description: schemaData.description,
        type: schemaData.type,
        schema: schemaData.schema,
        id_format: schemaData.id_format,
        relationships: schemaData.relationships,
        tree_config: schemaData.tree_config,
        display_mapping: schemaData.display_mapping,
        version: schemaData.version || '1.0.0',
        is_active: schemaData.is_active !== undefined ? schemaData.is_active : true,
      },
      set: {
        name: setData.name,
        description: setData.description,
        custom_api_schema_code: setData.custom_api_schema_code || setData.plugin_api_code, // Backward compatibility
        data: setData.data,
        avatar: setData.avatar, // URL will be set after upload
        provider_url: setData.provider_url,
      },
      avatarBlob,
      avatarExtension,
    }
  } catch (error) {
    console.error('Error importing CustomApiSet:', error)
    throw error
  }
}
