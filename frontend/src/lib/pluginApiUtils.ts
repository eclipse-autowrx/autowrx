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
import { PluginAPI } from '@/services/pluginApi.service'
import { PluginApiInstance, getPluginApiInstanceById } from '@/services/pluginApiInstance.service'
import { getPluginAPIById } from '@/services/pluginApi.service'

const removeSpecialCharacters = (str: string) => {
  return str.replace(/[^a-zA-Z0-9 ]/g, '')
}

/**
 * Export PluginAPI as JSON file
 */
export const exportPluginAPI = async (api: PluginAPI) => {
  try {
    const exportData = {
      name: api.name,
      code: api.code,
      description: api.description,
      type: api.type,
      schema: api.schema,
      id_format: api.id_format,
      relationships: api.relationships,
      tree_config: api.tree_config,
      list_view_config: api.list_view_config,
      version: api.version,
      is_active: api.is_active,
    }

    const jsonString = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const filename = `plugin_api_${removeSpecialCharacters(api.name || api.code)}.json`
    saveAs(blob, filename)
  } catch (error) {
    console.error('Error exporting PluginAPI:', error)
    throw error
  }
}

/**
 * Export PluginApiInstance as ZIP file (includes schema + instance data)
 */
export const exportPluginApiInstance = async (instance: PluginApiInstance) => {
  try {
    // Fetch the schema
    const schema = await getPluginAPIById(instance.plugin_api)
    
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
      list_view_config: schema.list_view_config,
      version: schema.version,
      is_active: schema.is_active,
    }
    zip.file('schema.json', JSON.stringify(schemaData, null, 2))
    
    // Add instance data file
    const instanceData = {
      name: instance.name,
      description: instance.description,
      plugin_api_code: instance.plugin_api_code,
      data: instance.data,
      avatar: instance.avatar,
      provider_url: instance.provider_url,
    }
    zip.file('instance.json', JSON.stringify(instanceData, null, 2))
    
    // Add avatar image if exists
    if (instance.avatar) {
      try {
        // Download image as arraybuffer (same pattern as getImgFile in zipUtils)
        const imageResponse = await axios.get(instance.avatar, { responseType: 'arraybuffer' })
        
        // Detect image format from URL or Content-Type header
        let imageExtension = 'png' // default
        const contentType = imageResponse.headers['content-type']
        const avatarUrl = instance.avatar.toLowerCase()
        
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
        console.warn('Could not download avatar image:', error)
        // Continue without avatar if download fails
      }
    }
    
    // Generate ZIP file
    const content = await zip.generateAsync({ type: 'blob' })
    const filename = `plugin_api_instance_${removeSpecialCharacters(instance.name)}.zip`
    saveAs(content, filename)
  } catch (error) {
    console.error('Error exporting PluginApiInstance:', error)
    throw error
  }
}

/**
 * Import PluginAPI from JSON file
 */
export const importPluginAPIFromJSON = async (file: File): Promise<Partial<PluginAPI>> => {
  try {
    const text = await file.text()
    const data = JSON.parse(text)
    
    // Validate required fields
    if (!data.name || !data.code || !data.type || !data.schema) {
      throw new Error('Invalid PluginAPI file. Missing required fields: name, code, type, or schema')
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
      list_view_config: data.list_view_config,
      version: data.version || '1.0.0',
      is_active: data.is_active !== undefined ? data.is_active : true,
    }
  } catch (error) {
    console.error('Error importing PluginAPI:', error)
    throw error
  }
}

/**
 * Import PluginApiInstance from ZIP file
 * Returns { schema: Partial<PluginAPI>, instance: Partial<PluginApiInstance>, avatarBlob?: Blob, avatarExtension?: string }
 */
export const importPluginApiInstanceFromZIP = async (
  file: File
): Promise<{
  schema: Partial<PluginAPI>
  instance: Partial<PluginApiInstance>
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
    
    // Read instance.json
    const instanceStr = await zipFile.file('instance.json')?.async('string')
    if (!instanceStr) {
      throw new Error('ZIP file missing instance.json')
    }
    const instanceData = JSON.parse(instanceStr)
    
    // Validate instance
    if (!instanceData.name || !instanceData.data) {
      throw new Error('Invalid instance.json. Missing required fields: name or data')
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
        list_view_config: schemaData.list_view_config,
        version: schemaData.version || '1.0.0',
        is_active: schemaData.is_active !== undefined ? schemaData.is_active : true,
      },
      instance: {
        name: instanceData.name,
        description: instanceData.description,
        plugin_api_code: instanceData.plugin_api_code,
        data: instanceData.data,
        avatar: instanceData.avatar, // URL will be set after upload
        provider_url: instanceData.provider_url,
      },
      avatarBlob,
      avatarExtension,
    }
  } catch (error) {
    console.error('Error importing PluginApiInstance:', error)
    throw error
  }
}

