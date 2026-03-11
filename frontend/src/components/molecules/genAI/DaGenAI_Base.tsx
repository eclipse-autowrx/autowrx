// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useEffect, useRef, useState, useMemo } from 'react'
import { Button } from '@/components/atoms/button'
import { BsStars } from 'react-icons/bs'
import { AddOn } from '@/types/addon.type'
import { Textarea } from '@/components/atoms/textarea'
import DaGeneratorSelector from './DaGeneratorSelector'
import useListMarketplaceAddOns from '@/hooks/useListMarketplaceAddOns'
import usePermissionHook from '@/hooks/usePermissionHook'
import { PERMISSIONS } from '@/data/permission'
import DaSectionTitle from '@/components/atoms/DaSectionTitle'
import { getConfig } from '@/utils/siteConfig'
import axios from 'axios'
import { toast } from 'react-toastify'
import default_generated_code from '@/data/default_generated_code'
import { cn } from '@/lib/utils'
import {
  TbAlertCircle,
  TbCheck,
  TbCopy,
  TbExclamationMark,
  TbLoader,
} from 'react-icons/tb'
import { useAssets } from '@/hooks/useAssets'

type DaGenAI_BaseProps = {
  type: 'GenAI_Python' | 'GenAI_Dashboard' | 'GenAI_Widget'
  buttonText?: string
  placeholderText?: string
  className?: string
  onCodeGenerated: (code: string) => void
  onLoadingChange: (loading: boolean) => void
  onFinishChange: (isFinished: boolean) => void
}

const DaGenAI_Base = ({
  type,
  buttonText = 'Generate',
  placeholderText = 'Ask AI to generate based on this prompt...',
  className = '',
  onCodeGenerated,
  onLoadingChange,
  onFinishChange,
}: DaGenAI_BaseProps) => {
  const [prompt, setPrompt] = useState<string>('')
  const [selectedAddOn, setSelectedAddOn] = useState<AddOn | undefined>(
    undefined,
  )
  const [loading, setLoading] = useState<boolean>(false)
  const [addonsLoaded, setAddonsLoaded] = useState<boolean>(false)
  const { data: marketplaceAddOns } = useListMarketplaceAddOns(type)
  const [canUseGenAI] = usePermissionHook([PERMISSIONS.USE_GEN_AI])
  const [hasGenAIAssets, setHasGenAIAssets] = useState(false)
  const timeouts = useRef<NodeJS.Timeout[]>([])
  const [copied, setCopied] = useState(false)
  
  // Initialize built-in addons immediately for GenAI_Python
  const [builtInAddOns, setBuiltInAddOns] = useState<AddOn[]>(() => {
    if (type === 'GenAI_Python') {
      // Create default SDV Copilot immediately, endpoint will be loaded from GENAI_SDV_APP_ENDPOINT config
      return [{
        id: 'sdv-copilot-builtin',
        type: 'GenAI_Python' as const,
        name: 'SDV Copilot',
        description: 'Support develop basic SDV Python App',
        apiKey: 'Empty',
        endpointUrl: '', // Will be loaded from config
        customPayload: (prompt: string) => ({ prompt }),
        method: 'POST',
        requestField: 'prompt',
        responseField: 'data',
      }]
    }
    return []
  })

  const { useFetchAssets } = useAssets()
  const { data: assets } = useFetchAssets()

  // Load built-in addons endpoint from site config and update
  useEffect(() => {
    const loadBuiltInAddOnsEndpoint = async () => {
      try {
        if (type === 'GenAI_Python') {
          const endpointUrl = await getConfig(
            'GENAI_SDV_APP_ENDPOINT',
            'site',
            undefined,
            '' // No hardcoded fallback - use default from DEFAULT_SITE_CONFIGS or require admin configuration
          )

          // Update the endpoint URL from config
          setBuiltInAddOns([{
            id: 'sdv-copilot-builtin',
            type: 'GenAI_Python',
            name: 'SDV Copilot',
            description: 'Support develop basic SDV Python App',
            apiKey: 'Empty',
            endpointUrl: endpointUrl || '', // Use empty string if not configured
            customPayload: (prompt: string) => ({ prompt }),
            method: 'POST',
            requestField: 'prompt',
            responseField: 'data',
          }])
        }
      } catch (err) {
        console.error('Error loading built-in addons endpoint:', err)
      }
    }
    loadBuiltInAddOnsEndpoint()
  }, [type])

  const mergedBuiltInAddOns = useMemo(() => {
    return builtInAddOns.map((addOn: AddOn) => {
      const marketplaceMatch = marketplaceAddOns?.find(
        (marketAddOn) => marketAddOn.id === addOn.id,
      )
      if (marketplaceMatch) {
        return {
          ...marketplaceMatch,
          customPayload: addOn.customPayload || ((prompt: string) => ({ prompt })),
        }
      }
      return {
        ...addOn,
        customPayload: addOn.customPayload || ((prompt: string) => ({ prompt })),
      }
    })
  }, [builtInAddOns, marketplaceAddOns, prompt])

  const [userAIAddons, setUserAIAddOns] = useState<AddOn[]>([])

  useEffect(() => {
    if (!assets) {
      setUserAIAddOns([])
      return
    }
    if (type === 'GenAI_Python') {
      const pythonGenAIs = assets.filter(
        (asset: any) => asset.type === 'GENAI-PYTHON',
      )
      setHasGenAIAssets(pythonGenAIs.length > 0)
      const pythonAIAddons = pythonGenAIs.map((asset: any) => {
        let url = ''
        let accessToken = ''
        let method = 'POST'
        let requestField = ''
        let responseField = ''
        try {
          const data = JSON.parse(asset.data)
          url = data.url || ''
          accessToken = data.accessToken || ''
          method = data.method || 'POST'
          requestField = data.requestField || 'prompt'
          responseField = data.responseField || 'data'
        } catch (err) {
          console.log(err)
        }
        return {
          id: asset.name + '-' + Math.random().toString(36).substring(2, 8),
          type: 'GenAI_Python' as const,
          name: asset.name || 'My python genAI',
          description: '',
          apiKey: accessToken,
          endpointUrl: url,
          method: method,
          requestField: requestField,
          responseField: responseField,
          customPayload: (prompt: string) => ({ prompt }),
        }
      })
      setUserAIAddOns(pythonAIAddons)
      return
    }
  }, [assets, type])

  useEffect(() => {
    // Mark as loaded when marketplace addons are loaded (even if empty array)
    // Built-in addons are loaded synchronously in the other useEffect
    if (marketplaceAddOns !== undefined) {
      setAddonsLoaded(true)
    }
  }, [marketplaceAddOns])

  // Also mark as loaded once built-in addons are set (for GenAI_Python)
  useEffect(() => {
    if (type === 'GenAI_Python' && builtInAddOns.length > 0) {
      setAddonsLoaded(true)
    }
  }, [builtInAddOns, type])

  useEffect(() => {
    if (addonsLoaded) {
      const getSelectedGeneratorFromLocalStorage = (): AddOn | null => {
        const storedAddOn = localStorage.getItem('lastUsed_GenAIGenerator')
        return storedAddOn ? JSON.parse(storedAddOn) : null
      }
      const lastUsedGenAI = getSelectedGeneratorFromLocalStorage()
      if (lastUsedGenAI) {
        setSelectedAddOn(lastUsedGenAI)
      } else if (mergedBuiltInAddOns.length > 0) {
        setSelectedAddOn(mergedBuiltInAddOns[0])
      }
    }
  }, [addonsLoaded, mergedBuiltInAddOns])

  const filteredMarketplaceAddOns = useMemo(() => {
    if (!marketplaceAddOns) return []
    const builtInIds = mergedBuiltInAddOns.map((addon: AddOn) => addon.id)
    const builtInNames = mergedBuiltInAddOns.map((addon: AddOn) => addon.name.toLowerCase())
    // Filter out marketplace addons that match built-in addons by ID or name
    // Also filter out "SDV Copilot" or "SDV-Copilot" variants
    return marketplaceAddOns.filter((addon) => {
      const addonNameLower = addon.name.toLowerCase()
      const isBuiltInById = builtInIds.includes(addon.id)
      const isBuiltInByName = builtInNames.includes(addonNameLower)
      const isSDVCopilot = addonNameLower.includes('sdv copilot') || addonNameLower.includes('sdv-copilot')
      return !isBuiltInById && !isBuiltInByName && !isSDVCopilot
    })
  }, [marketplaceAddOns, mergedBuiltInAddOns])

  const handleGenerate = async () => {
    if (!selectedAddOn) return
    onCodeGenerated('')
    setLoading(true)
    onLoadingChange(true)
    try {
      if (selectedAddOn.isMock) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        onCodeGenerated(default_generated_code)
        return
      }

      if (selectedAddOn.endpointUrl && selectedAddOn.name !== 'SDV Copilot') {
        switch (selectedAddOn.method?.toLowerCase().trim()) {
          case 'get':
            try {
              const response = await axios.get(
                selectedAddOn.endpointUrl +
                  `?${selectedAddOn.requestField || 'prompt'}=${encodeURIComponent(prompt)}`,
                {
                  headers: {
                    Authorization: `${selectedAddOn.apiKey}`,
                    'Content-Type': 'application/json',
                  },
                },
              )
              if (
                response.data &&
                response.data[selectedAddOn.responseField || 'data']
              ) {
                onCodeGenerated(
                  response.data[selectedAddOn.responseField || 'data'],
                )
              } else {
                onCodeGenerated(
                  `Error: Receive incorrect format data\r\n${JSON.stringify(response.data, null, 4)}`,
                )
              }
            } catch (err) {
              console.log(err)
            }
            break
          case 'post':
            try {
              const payload = {
                systemMessage: selectedAddOn.samples || '',
              } as any
              payload[selectedAddOn.requestField || 'prompt'] = prompt

              const response = await axios.post(
                selectedAddOn.endpointUrl,
                payload,
                {
                  headers: {
                    Authorization: `${selectedAddOn.apiKey}`,
                    'Content-Type': 'application/json',
                  },
                },
              )
              if (
                response.data &&
                response.data[selectedAddOn.responseField || 'data']
              ) {
                onCodeGenerated(
                  response.data[selectedAddOn.responseField || 'data'],
                )
              } else {
                onCodeGenerated(
                  `Error: Receive incorrect format data\r\n${JSON.stringify(response.data, null, 4)}`,
                )
              }
            } catch (err) {
              console.log(err)
            }
            break
          default:
            break
        }
        return
      }

      // Use the SDV App endpoint for SDV Copilot
      try {
        const endpointUrl = await getConfig(
          'GENAI_SDV_APP_ENDPOINT',
          'site',
          undefined,
          '' // No hardcoded fallback - use default from DEFAULT_SITE_CONFIGS or require admin configuration
        )

        if (!endpointUrl) {
          throw new Error('GENAI_SDV_APP_ENDPOINT is not configured. Please configure it in Site Management.')
        }

        const response = await axios.post(
          endpointUrl,
          {
            systemMessage: selectedAddOn.samples || '',
            message: prompt,
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          },
        )

        // Parse the generated content from the response structure
        onCodeGenerated(response.data.content || response.data.data || JSON.stringify(response.data))
      } catch (err) {
        console.log(err)
      }
    } catch (error) {
      timeouts.current.forEach((timeout) => clearTimeout(timeout))
      timeouts.current = []
      console.error('Error generating AI content:', error)
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message || 'Error generating AI content',
        )
      } else {
        toast.error('Error generating AI content')
      }
    } finally {
      setLoading(false)
      onLoadingChange(false)
      onFinishChange(true)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText('info@digital.auto')
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <div className={cn('flex h-full w-full rounded', className)}>
      <div className="flex h-full w-full flex-col border-r border-border pl-0.5 pr-2 min-h-0 overflow-hidden">
        <div className="flex w-full items-center justify-between shrink-0">
          <DaSectionTitle number={1} title="Prompting" />
        </div>
        <div className="mt-1 flex w-full shrink-0" style={{ maxHeight: '200px' }}>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (!loading && prompt && addonsLoaded) {
                  handleGenerate()
                }
              }
            }}
            placeholder={placeholderText}
            className="w-full resize-none bg-muted text-foreground"
            rows={6}
            style={{ maxHeight: '200px' }}
          />
        </div>

        <DaSectionTitle number={2} title="Select Generator" className="mt-4 shrink-0" />
        <div className="flex w-full shrink-0" style={{ maxHeight: '200px', minHeight: '120px' }}>
          {addonsLoaded ? (
            <DaGeneratorSelector
              builtInAddOns={mergedBuiltInAddOns}
              marketplaceAddOns={
                marketplaceAddOns
                  ? canUseGenAI
                    ? filteredMarketplaceAddOns
                    : []
                  : []
              }
              userAIAddons={userAIAddons}
              onSelectedGeneratorChange={(addOn: AddOn) => {
                setSelectedAddOn(addOn)
                localStorage.setItem(
                  'lastUsed_GenAIGenerator',
                  JSON.stringify(addOn),
                )
              }}
            />
          ) : (
            <div className="flex items-center mt-2 w-full h-10 border justify-center rounded-md shadow-sm">
              <TbLoader className="text-primary animate-spin mr-1.5" />
              Loading AI Generator
            </div>
          )}
        </div>

        <div className="mt-auto pt-2 flex flex-col gap-2 shrink-0">
          {!canUseGenAI && !hasGenAIAssets ? (
            <div className="flex w-full select-none justify-start items-center text-sm text-muted-foreground py-1 font-medium">
              <TbAlertCircle className="text-destructive mr-1 size-5 shrink-0" />
              <span className="flex items-center flex-wrap gap-1">
                Permission required
                <span className="xl:inline hidden"> for GenAI access</span>.
                Contact
                <span
                  className="py-0.5 px-1 rounded-lg bg-muted hover:bg-muted/80 cursor-pointer inline-flex items-center gap-1"
                  onClick={handleCopy}
                >
                  info@digital.auto{' '}
                  {copied ? (
                    <TbCheck className="text-green-500 h-4 w-4 inline-block" />
                  ) : (
                    <TbCopy className="h-4 w-4 inline-block" />
                  )}
                </span>
              </span>
            </div>
          ) : (
            !prompt && (
              <div className="flex w-full select-none justify-start items-center text-sm text-muted-foreground py-1 font-medium">
                <TbExclamationMark className="text-orange-500 mr-1 size-5 shrink-0" />
                You need to enter prompt and select generator
              </div>
            )
          )}

          <Button
            variant="default"
            disabled={
              !prompt ||
              loading ||
              !addonsLoaded ||
              (!canUseGenAI && !hasGenAIAssets)
            }
            className="min-h-8 w-full py-1 shrink-0"
            onClick={handleGenerate}
          >
            <BsStars
              className={`mb-0.5 mr-1 inline-block size-4 ${loading ? 'animate-pulse' : ''}`}
            />
            {!loading && <div>{buttonText}</div>}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default DaGenAI_Base
