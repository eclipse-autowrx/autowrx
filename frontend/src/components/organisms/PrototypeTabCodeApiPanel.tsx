// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { FC, useState, useEffect, useMemo } from 'react'
import DaDialog from '@/components/molecules/DaDialog'
import { shallow } from 'zustand/shallow'
import useModelStore from '@/stores/modelStore'
import { DaApiListItem } from '@/components/molecules/DaApiList'
import ModelApiList from '@/components/organisms/ModelApiList'
import { getApiTypeClasses } from '@/lib/utils'
import { DaCopy } from '@/components/atoms/DaCopy'
import DaTabItem from '@/components/atoms/DaTabItem'
import useCurrentModel from '@/hooks/useCurrentModel'
import { UspSeviceList, ServiceDetail } from '@/components/organisms/ViewApiUSP'
import { V2CApiList, ApiDetail, DEFAULT_V2C } from '@/components/organisms/ViewApiV2C'
import { useQuery } from '@tanstack/react-query'
import { getCustomApiSetById } from '@/services/customApiSet.service'
import { getCustomApiSchemaById } from '@/services/customApiSchema.service'
import CustomAPIList from '@/components/organisms/CustomAPIList'
import CustomAPIView from '@/components/organisms/CustomAPIView'
import { Spinner } from '@/components/atoms/spinner'

interface ApiCodeBlockProps {
  content: string
  sampleLabel: string
  dataId?: string
  copyClassName?: string
  onApiCodeCopy?: () => void
}

const ApiCodeBlock = ({
  content,
  sampleLabel,
  dataId,
  copyClassName,
  onApiCodeCopy,
}: ApiCodeBlockProps) => {
  return (
    <div className="flex flex-col" data-id={dataId}>
      <DaCopy
        textToCopy={content}
        className={`flex h-6 items-center w-fit mt-3 ${copyClassName}`}
        onCopied={onApiCodeCopy}
      >
        <span className="flex w-fit shrink-0 text-sm text-muted-foreground">
          {sampleLabel}
        </span>
      </DaCopy>

      <div className="flex flex-wrap w-full min-w-fit px-3 py-3 mt-2 bg-gray-100 rounded-lg justify-between border">
        <span className="w-full text-sm font-mono text-gray-700 whitespace-pre-line">
          {content}
        </span>
      </div>
    </div>
  )
}

interface APIDetailsProps {
  activeApi: any
  requestCancel?: () => void
}

const APIDetails: FC<APIDetailsProps> = ({ activeApi, requestCancel }) => {
  useEffect(() => {
    if (activeApi) {
    }
  }, [activeApi])
  
  const { textClass } = getApiTypeClasses(activeApi?.type || '')
  
  return (
    <div className="flex flex-col">
      {activeApi && (
        <div className="flex flex-col w-full">
          <div className="flex pb-2 items-center border-b border-gray-200 justify-between">
            <DaCopy textToCopy={activeApi.name}>
              <span className="text-lg font-semibold text-primary cursor-pointer">
                {activeApi.name}
              </span>
            </DaCopy>
            <div className={textClass}>
              {activeApi.type.toUpperCase()}
            </div>
          </div>
          <div className="max-h-[500px] overflow-y-auto">
            {['branch'].includes(activeApi.type) && (
              <div>
                <div className="mt-4 text-gray-700 py-1 flex items-center text-sm">
                  This is branch node, branch include a list of child API. You
                  can not call a branch in python code, please select its
                  children.
                </div>
              </div>
            )}
            {['attribute'].includes(activeApi.type) && (
              <div>
                <div className="mt-4 text-gray-700 py-1 flex items-center text-sm">
                  An attribute has a default value, but not all Vehicle Signal
                  Specification attributes include one. OEMs must define or
                  override defaults if needed to match the actual vehicle.
                </div>
              </div>
            )}
            {['actuator', 'sensor'].includes(activeApi.type) && (
              <ApiCodeBlock
                content={`value = (await self.${activeApi.name}.get()).value`}
                sampleLabel="Sample code to get signal value"
                copyClassName="btn-copy-get-code"
                onApiCodeCopy={() => {
                  if (requestCancel) {
                    requestCancel()
                  }
                }}
              />
            )}
            {['actuator'].includes(activeApi.type) && (
              <ApiCodeBlock
                content={`await self.${activeApi.name}.set(value)`}
                sampleLabel="Sample code to set signal value"
                copyClassName="btn-copy-set-code"
                onApiCodeCopy={() => {
                  if (requestCancel) {
                    requestCancel()
                  }
                }}
              />
            )}
            {['actuator', 'sensor'].includes(activeApi.type) && (
              <ApiCodeBlock
                content={`await self.${activeApi.name}.subscribe(function_name)`}
                sampleLabel="Sample code to subscribe signal value"
                copyClassName="btn-copy-subscribe-code"
                onApiCodeCopy={() => {
                  if (requestCancel) {
                    requestCancel()
                  }
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

interface PrototypeTabCodeApiPanelProps {
  code: string
}

const PrototypeTabCodeApiPanel: FC<PrototypeTabCodeApiPanelProps> = ({
  code,
}) => {
  const [tab, setTab] = useState<
    'used-signals' | 'all-signals' | 'usp' | 'v2c' | string
  >('used-signals')
  const { data: model } = useCurrentModel()
  
  // Get CustomApiSet IDs from model
  const customApiSetIds = useMemo(() => {
    return (model?.custom_api_sets || []).map((id: any) => {
      if (typeof id === 'string') return id
      if (id && typeof id === 'object' && 'toString' in id) return id.toString()
      return String(id)
    }).filter((id: any): id is string => 
      !!id && typeof id === 'string' && id !== '[object Object]' && id !== 'undefined' && id !== 'null'
    )
  }, [model?.custom_api_sets])
  
  // Determine if current tab is a CustomApiSet tab
  const isCustomApiSetTab = tab.startsWith('custom-api-set-')
  const activeCustomApiSetId = isCustomApiSetTab ? tab.replace('custom-api-set-', '') : null
  
  // Fetch active CustomApiSet data
  const { data: activeCustomApiSet, isLoading: isLoadingSet } = useQuery({
    queryKey: ['custom-api-set', activeCustomApiSetId],
    queryFn: () => getCustomApiSetById(activeCustomApiSetId!),
    enabled: !!activeCustomApiSetId,
  })
  
  // Extract custom_api_schema ID from set
  const customApiSchemaId = activeCustomApiSet?.custom_api_schema
    ? typeof activeCustomApiSet.custom_api_schema === 'string'
      ? activeCustomApiSet.custom_api_schema
      : (activeCustomApiSet.custom_api_schema as any).id || (activeCustomApiSet.custom_api_schema as any)._id || activeCustomApiSet.custom_api_schema
    : null
  
  // Fetch CustomApiSchema schema
  const { data: activeCustomApiSchema, isLoading: isLoadingSchema } = useQuery({
    queryKey: ['custom-api-schema', customApiSchemaId],
    queryFn: () => getCustomApiSchemaById(customApiSchemaId!),
    enabled: !!customApiSchemaId,
  })

  // State for selected API item in CustomApiSet view
  const [selectedCustomApiItemId, setSelectedCustomApiItemId] = useState<string | null>(null)
  
  const customApiItems = activeCustomApiSet?.data?.items || []
  const selectedCustomApiItem = selectedCustomApiItemId 
    ? customApiItems.find((item: any) => item.id === selectedCustomApiItemId) 
    : null
  
  // Extract method options for filter
  const getMethodOptions = (): string[] => {
    if (!activeCustomApiSchema?.schema) return []
    try {
      const schemaObj = typeof activeCustomApiSchema.schema === 'string' 
        ? JSON.parse(activeCustomApiSchema.schema) 
        : activeCustomApiSchema.schema
      
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

  const [activeModelUspSevices, activeModelV2CApis] =
    useModelStore((state) => [
      state.activeModelUspSevices,
      state.activeModelV2CApis,
    ])
  
  // Check if USP or V2C are available (for backward compatibility, but we'll prioritize CustomApiSets)
  const hasUSP = activeModelUspSevices && activeModelUspSevices.length > 0
  const hasV2C = activeModelV2CApis && activeModelV2CApis.length > 0

  useEffect(() => {
    // if (model?.extend?.vehicle_api?.USP) {
    //   setTab('usp')
    // }
  }, [model])

  const [activeModelApis] = useModelStore(
    (state) => [state.activeModelApis],
    shallow,
  )

  const [useApis, setUseApis] = useState<any[]>([])
  const [usedCustomApiItems, setUsedCustomApiItems] = useState<Map<string, any[]>>(new Map()) // Map of setId -> used items
  const [activeApi, setActiveApi] = useState<any>()
  const [popupApi, setPopupApi] = useState<boolean>(false)
  const [activeService, setActiveService] = useState<any>(null)
  const [activeV2CApi, setActiveV2CApi] = useState<any>(null)
  
  useEffect(() => {
    if (!code || !activeModelApis || activeModelApis.length === 0) {
      setUseApis([])
      return
    }
    let useList: any[] = []
    activeModelApis.forEach((item: any) => {
      if (code.includes(item.shortName)) {
        useList.push(item)
      }
    })
    setUseApis(useList)
  }, [code, activeModelApis])

  // Fetch all CustomApiSets for "Used APIs" tab
  const customApiSetQueries = useQuery({
    queryKey: ['custom-api-sets', customApiSetIds.join(',')],
    queryFn: async () => {
      const sets = await Promise.all(
        customApiSetIds.map((id) => getCustomApiSetById(id))
      )
      return sets
    },
    enabled: customApiSetIds.length > 0,
  })

  // Check for used CustomApiSet APIs in code
  useEffect(() => {
    if (!code || !customApiSetQueries.data || customApiSetQueries.data.length === 0) {
      setUsedCustomApiItems(new Map())
      return
    }

    const usedItemsMap = new Map<string, any[]>()
    
    customApiSetQueries.data.forEach((set) => {
      const items = set?.data?.items || []
      const usedItems: any[] = []
      
      items.forEach((item: any) => {
        // Check if code contains the API ID or path
        if (item.id && code.includes(item.id)) {
          usedItems.push(item)
        } else if (item.path && code.includes(item.path)) {
          usedItems.push(item)
        }
      })
      
      if (usedItems.length > 0) {
        usedItemsMap.set(set.id, usedItems)
      }
    })
    
    setUsedCustomApiItems(usedItemsMap)
  }, [code, customApiSetQueries.data])

  const onApiClicked = (api: any) => {
    if (!api) return
    setActiveApi(api)
    setPopupApi(true)
  }

  return (
    <div className="flex flex-col w-full h-full p-1">
      <DaDialog
        open={popupApi}
        onOpenChange={setPopupApi}
        trigger={<span></span>}
        dialogTitle="API Details"
        className="w-[800px] max-w-[90vw]"
      >
        <APIDetails
          activeApi={activeApi}
          requestCancel={() => {
            setPopupApi(false)
          }}
        />
      </DaDialog>

      <div className="flex justify-between border-b mx-3 mt-2">
        <>
          <div className="flex">
            <DaTabItem
              active={tab === 'used-signals'}
              dataId="used-signals-tab"
              to="#"
              onClick={(e) => {
                e.preventDefault()
                setTab('used-signals')
              }}
            >
              Used APIs
            </DaTabItem>
            <DaTabItem
              active={tab === 'all-signals'}
              dataId="all-signals-tab"
              to="#"
              onClick={(e) => {
                e.preventDefault()
                setTab('all-signals')
              }}
            >
              COVESA Signals
            </DaTabItem>
            {/* USP and V2C tabs (for backward compatibility) */}
            {hasUSP && (
              <DaTabItem
                active={tab === 'usp'}
                to="#"
                onClick={(e) => {
                  e.preventDefault()
                  setTab('usp')
                }}
              >
                USP 2.0
              </DaTabItem>
            )}
            {hasV2C && (
              <DaTabItem
                active={tab === 'v2c'}
                to="#"
                onClick={(e) => {
                  e.preventDefault()
                  setTab('v2c')
                }}
              >
                V2C
              </DaTabItem>
            )}
            {/* CustomApiSet tabs */}
            {customApiSetIds.map((setId) => {
              const tabId = `custom-api-set-${setId}`
              return (
                <CustomApiSetTab
                  key={setId}
                  setId={setId}
                  active={tab === tabId}
                  onClick={(e) => {
                    e.preventDefault()
                    setTab(tabId)
                    setSelectedCustomApiItemId(null) // Reset selection when switching tabs
                  }}
                />
              )
            })}
          </div>
        </>
      </div>

      {tab === 'used-signals' && (
        <>
          <div className="flex flex-col w-full h-full px-4 overflow-y-auto">
            <div className="flex flex-col w-full min-w-fit mt-2">
              {/* COVESA APIs */}
              <span className="text-sm font-semibold">COVESA:</span>
              {useApis &&
                useApis.map((item: any, index: any) => (
                  <DaApiListItem
                    key={index}
                    api={item}
                    onClick={() => {
                      onApiClicked(item)
                    }}
                  />
                ))}
              
              {/* CustomApiSet sections */}
              {Array.from(usedCustomApiItems.entries()).map(([setId, items]) => {
                const set = customApiSetQueries.data?.find((s) => s.id === setId)
                const setName = set?.name || setId
                
                return (
                  <React.Fragment key={setId}>
                    <div className='mt-4'></div>
                    <span className="text-sm font-semibold">{setName}:</span>
                    {items.map((item: any, index: number) => (
                      <div
                        key={`${setId}-${item.id}-${index}`}
                        className="flex items-center py-1 px-2 hover:bg-muted rounded cursor-pointer"
                        onClick={() => {
                          setTab(`custom-api-set-${setId}`)
                          setSelectedCustomApiItemId(item.id)
                        }}
                      >
                        <span className="text-sm">{item.id || item.path || 'Unknown API'}</span>
                      </div>
                    ))}
                  </React.Fragment>
                )
              })}
            </div>
          </div>
        </>
      )}

      {tab === 'all-signals' && (
        <div className="flex w-full overflow-hidden">
          <ModelApiList onApiClick={onApiClicked} readOnly={true} />
        </div>
      )}

      {tab === 'usp' && (
        <div className="w-full">
          <div className="w-full h-[240px] overflow-y-auto">
            <UspSeviceList
              services={activeModelUspSevices || []}
              onServiceSelected={setActiveService}
              activeService={activeService}
            />
          </div>
          <div className="w-full h-[calc(100vh-460px)] overflow-y-auto">
            {activeService && (
              <ServiceDetail
                service={activeService}
                hideImage={true}
                hideTitle={true}
              />
            )}
          </div>
        </div>
      )}

      {tab === 'v2c' && (
        <div className="w-full">
          <div className="w-full h-[240px] overflow-y-auto">
            <V2CApiList
              apis={DEFAULT_V2C}
              activeApi={activeV2CApi}
              onApiSelected={setActiveV2CApi}
            />
          </div>
          <div className="w-full h-[calc(100vh-460px)] overflow-y-auto">
            <ApiDetail api={activeV2CApi} />
          </div>
        </div>
      )}

      {/* CustomApiSet tab - 50/50 layout */}
      {isCustomApiSetTab && (
        <div className="w-full flex flex-col h-full min-h-0">
          {isLoadingSet || isLoadingSchema ? (
            <div className="flex items-center justify-center h-full">
              <Spinner className="mr-2" />
              <span className="text-sm font-medium text-muted-foreground">Loading API set...</span>
            </div>
          ) : !activeCustomApiSet || !activeCustomApiSchema ? (
            <div className="flex items-center justify-center h-full">
              <span className="text-sm font-medium text-muted-foreground">
                Set or schema not found.
              </span>
            </div>
          ) : (
            <>
              {/* Top 50%: API List */}
              <div className="w-full h-1/2 flex flex-col min-h-0 border-b border-border">
                <CustomAPIList
                  key={activeCustomApiSetId}
                  items={customApiItems}
                  selectedItemId={selectedCustomApiItemId}
                  onSelectItem={setSelectedCustomApiItemId}
                  schema={activeCustomApiSchema}
                  mode="view"
                  filterOptions={{
                    typeField: 'method',
                    typeOptions: getMethodOptions(),
                  }}
                  footerImage={activeCustomApiSet?.avatar}
                  providerUrl={activeCustomApiSet?.provider_url}
                />
              </div>
              
              {/* Bottom 50%: API Detail View */}
              <div className="w-full h-1/2 flex flex-col min-h-0">
                {selectedCustomApiItem ? (
                  <CustomAPIView
                    item={selectedCustomApiItem}
                    schema={activeCustomApiSchema.schema}
                    itemId={selectedCustomApiItem.id}
                    excludeFields={['id', 'path', 'parent_id', 'relationships']}
                  />
                ) : (
                  <div className="text-center py-12 text-sm text-muted-foreground">
                    Select an API from the list to view details.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// Helper component for CustomApiSet tab
interface CustomApiSetTabProps {
  setId: string
  active: boolean
  onClick: (e: React.MouseEvent) => void
}

const CustomApiSetTab: FC<CustomApiSetTabProps> = ({ setId, active, onClick }) => {
  const { data: set } = useQuery({
    queryKey: ['custom-api-set-tab-name', setId],
    queryFn: () => getCustomApiSetById(setId),
    enabled: !!setId,
    staleTime: Infinity, // Set names don't change often
  })
  
  return (
    <DaTabItem
      active={active}
      to="#"
      onClick={onClick}
    >
      {set?.name || 'Loading...'}
    </DaTabItem>
  )
}

export default PrototypeTabCodeApiPanel
