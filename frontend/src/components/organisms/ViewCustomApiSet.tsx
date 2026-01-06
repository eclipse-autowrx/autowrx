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
import { getCustomApiSetById, type CustomApiSetItem } from '@/services/customApiSet.service'
import { getCustomApiSchemaById } from '@/services/customApiSchema.service'
import CustomAPIList from '@/components/organisms/CustomAPIList'
import CustomAPIView from '@/components/organisms/CustomAPIView'
import { Spinner } from '@/components/atoms/spinner'

interface ViewCustomApiSetProps {
  instanceId: string
}

const ViewCustomApiSet: React.FC<ViewCustomApiSetProps> = ({ instanceId }) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)

  // Normalize instanceId to string (should be string from route params, but safeguard)
  const normalizedSetId = typeof instanceId === 'string' 
    ? instanceId 
    : (instanceId && typeof instanceId === 'object' && 'toString' in instanceId)
    ? (instanceId as any).toString()
    : String(instanceId)

  // Fetch set data
  const { data: set, isLoading: isLoadingSet } = useQuery({
    queryKey: ['custom-api-set', normalizedSetId],
    queryFn: () => getCustomApiSetById(normalizedSetId),
    enabled: !!normalizedSetId && normalizedSetId !== '[object Object]',
  })

  // Extract custom_api_schema ID
  const customApiSchemaId = set?.custom_api_schema
    ? typeof set.custom_api_schema === 'string'
      ? set.custom_api_schema
      : (set.custom_api_schema as any).id || (set.custom_api_schema as any)._id || set.custom_api_schema
    : null

  // Fetch CustomApiSchema schema
  const { data: customApiSchema, isLoading: isLoadingSchema } = useQuery({
    queryKey: ['custom-api-schema', customApiSchemaId],
    queryFn: () => getCustomApiSchemaById(customApiSchemaId!),
    enabled: !!customApiSchemaId,
  })

  const items = set?.data?.items || []
  const selectedItem = selectedItemId ? items.find((item) => item.id === selectedItemId) : null

  // Debug: Log set avatar
  useEffect(() => {
    if (set) {
      console.log('ViewCustomApiSet - Full set object:', JSON.stringify(set, null, 2))
      console.log('ViewCustomApiSet - set.avatar:', set.avatar)
      console.log('ViewCustomApiSet - typeof set.avatar:', typeof set.avatar)
      console.log('ViewCustomApiSet - set.avatar truthy?', !!set.avatar)
      console.log('ViewCustomApiSet - All set keys:', Object.keys(set))
      // Check if avatar exists with different casing or name
      console.log('ViewCustomApiSet - set keys containing "avatar" or "image":', 
        Object.keys(set).filter(k => k.toLowerCase().includes('avatar') || k.toLowerCase().includes('image')))
    }
  }, [set])

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
    if (!customApiSchema?.schema) return []
    try {
      const schemaObj = typeof customApiSchema.schema === 'string' 
        ? JSON.parse(customApiSchema.schema) 
        : customApiSchema.schema
      
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

  if (isLoadingSet || isLoadingSchema) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner className="mr-2" />
        <span className="text-sm font-medium text-muted-foreground">Loading API set...</span>
      </div>
    )
  }

  if (!set || !customApiSchema) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-sm font-medium text-muted-foreground">
          Set or schema not found.
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
          schema={customApiSchema}
          mode="view"
          filterOptions={{
            typeField: 'method',
            typeOptions: getMethodOptions(),
          }}
          footerImage={set?.avatar}
          providerUrl={set?.provider_url}
        />
      </div>

      {/* Right: API Detail View */}
      <div className="w-1/2 pl-0 flex flex-col min-h-0">
        {selectedItem ? (
          <CustomAPIView
            item={selectedItem}
            schema={customApiSchema.schema}
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

export default ViewCustomApiSet

