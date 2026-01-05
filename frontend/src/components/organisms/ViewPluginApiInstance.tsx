// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getPluginApiInstanceById, type PluginApiInstanceItem } from '@/services/pluginApiInstance.service'
import { getPluginAPIById } from '@/services/pluginApi.service'
import CustomAPIList from '@/components/organisms/CustomAPIList'
import CustomAPIView from '@/components/organisms/CustomAPIView'
import { Spinner } from '@/components/atoms/spinner'

interface ViewPluginApiInstanceProps {
  instanceId: string
}

const ViewPluginApiInstance: React.FC<ViewPluginApiInstanceProps> = ({ instanceId }) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)

  // Normalize instanceId to string (should be string from route params, but safeguard)
  const normalizedInstanceId = typeof instanceId === 'string' 
    ? instanceId 
    : (instanceId && typeof instanceId === 'object' && 'toString' in instanceId)
    ? (instanceId as any).toString()
    : String(instanceId)

  // Fetch instance data
  const { data: instance, isLoading: isLoadingInstance } = useQuery({
    queryKey: ['plugin-api-instance', normalizedInstanceId],
    queryFn: () => getPluginApiInstanceById(normalizedInstanceId),
    enabled: !!normalizedInstanceId && normalizedInstanceId !== '[object Object]',
  })

  // Extract plugin_api ID
  const pluginApiId = instance?.plugin_api
    ? typeof instance.plugin_api === 'string'
      ? instance.plugin_api
      : (instance.plugin_api as any).id || (instance.plugin_api as any)._id || instance.plugin_api
    : null

  // Fetch PluginAPI schema
  const { data: pluginAPI, isLoading: isLoadingSchema } = useQuery({
    queryKey: ['plugin-api', pluginApiId],
    queryFn: () => getPluginAPIById(pluginApiId!),
    enabled: !!pluginApiId,
  })

  const items = instance?.data?.items || []
  const selectedItem = selectedItemId ? items.find((item) => item.id === selectedItemId) : null

  // Debug: Log instance avatar
  useEffect(() => {
    if (instance) {
      console.log('ViewPluginApiInstance - Full instance object:', JSON.stringify(instance, null, 2))
      console.log('ViewPluginApiInstance - instance.avatar:', instance.avatar)
      console.log('ViewPluginApiInstance - typeof instance.avatar:', typeof instance.avatar)
      console.log('ViewPluginApiInstance - instance.avatar truthy?', !!instance.avatar)
      console.log('ViewPluginApiInstance - All instance keys:', Object.keys(instance))
      // Check if avatar exists with different casing or name
      console.log('ViewPluginApiInstance - instance keys containing "avatar" or "image":', 
        Object.keys(instance).filter(k => k.toLowerCase().includes('avatar') || k.toLowerCase().includes('image')))
    }
  }, [instance])

  // Handle URL query parameter for active API
  useEffect(() => {
    if (!items.length) return

    const apiParam = searchParams.get('api')
    
    if (apiParam) {
      // Check if the API param matches an existing item ID
      const itemExists = items.some((item) => item.id === apiParam)
      if (itemExists && selectedItemId !== apiParam) {
        setSelectedItemId(apiParam)
      } else if (!itemExists) {
        // API param doesn't match any item, select first and update URL
        const firstItemId = items[0].id
        setSelectedItemId(firstItemId)
        setSearchParams({ api: firstItemId }, { replace: true })
      }
    } else {
      // If no API param and no selection, select first item
      if (!selectedItemId && items.length > 0) {
        const firstItemId = items[0].id
        setSelectedItemId(firstItemId)
        setSearchParams({ api: firstItemId }, { replace: true })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, searchParams]) // Re-run when items load or URL changes

  // Update URL when item is selected
  const handleSelectItem = (itemId: string) => {
    setSelectedItemId(itemId)
    setSearchParams({ api: itemId }, { replace: true })
  }

  // Extract method options for filter
  const getMethodOptions = (): string[] => {
    if (!pluginAPI?.schema) return []
    try {
      const schemaObj = typeof pluginAPI.schema === 'string' 
        ? JSON.parse(pluginAPI.schema) 
        : pluginAPI.schema
      
      const itemSchema = schemaObj.type === 'array' ? schemaObj.items : schemaObj
      const methodProperty = itemSchema?.properties?.method
      
      if (methodProperty?.enum) {
        return methodProperty.enum
      }
      
      return []
    } catch {
      return []
    }
  }

  if (isLoadingInstance || isLoadingSchema) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner className="mr-2" />
        <span className="text-sm font-medium text-muted-foreground">Loading API instance...</span>
      </div>
    )
  }

  if (!instance || !pluginAPI) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-sm font-medium text-muted-foreground">
          Instance or schema not found.
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-1 min-h-0 gap-4 h-full">
      {/* Left: API List */}
      <div className="w-1/2 border-r border-border pr-0 flex flex-col min-h-0">
        <CustomAPIList
          items={items}
          selectedItemId={selectedItemId}
          onSelectItem={handleSelectItem}
          schema={pluginAPI}
          mode="view"
          filterOptions={{
            typeField: 'method',
            typeOptions: getMethodOptions(),
          }}
          footerImage={instance?.avatar}
          providerUrl={instance?.provider_url}
        />
      </div>

      {/* Right: API Detail View */}
      <div className="w-1/2 pl-0 flex flex-col min-h-0">
        {selectedItem ? (
          <CustomAPIView
            item={selectedItem}
            schema={pluginAPI.schema}
            itemId={selectedItem.id}
            excludeFields={['id', 'path', 'parent_id', 'relationships']}
          />
        ) : (
          <div className="text-center py-12 text-sm text-muted-foreground">
            Select an API from the list to view details.
          </div>
        )}
      </div>
    </div>
  )
}

export default ViewPluginApiInstance

