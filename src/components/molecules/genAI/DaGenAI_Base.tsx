// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { lazy, Suspense, useEffect, useRef, useState, useMemo } from 'react'
import { DaButton } from '@/components/atoms/DaButton'
import { BsStars } from 'react-icons/bs'
import { AddOn } from '@/types/addon.type'
import { DaTextarea } from '@/components/atoms/DaTextarea'
import DaGeneratorSelector from './DaGeneratorSelector.tsx'
import useListMarketplaceAddOns from '@/hooks/useListMarketplaceAddOns'
import usePermissionHook from '@/hooks/usePermissionHook'
import { PERMISSIONS } from '@/data/permission'
import DaSectionTitle from '@/components/atoms/DaSectionTitle'
import config from '@/configs/config'
import axios from 'axios'
import { toast } from 'react-toastify'
import useAuthStore from '@/stores/authStore'
import default_generated_code from '@/data/default_generated_code'
import { cn } from '@/lib/utils'
import {
  TbAlertCircle,
  TbCheck,
  TbCopy,
  TbExclamationMark,
  TbLoader,
} from 'react-icons/tb'
import { retry } from '@/lib/retry.ts'
import { useAssets } from '@/hooks/useAssets'

const DaSpeechToText = lazy(() => retry(() => import('./DaSpeechToText')))

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
  const access = useAuthStore((state) => state.access)
  const timeouts = useRef<NodeJS.Timeout[]>([])
  const [copied, setCopied] = useState(false)

  const addOnsArray =
    {
      GenAI_Python: config.genAI.sdvApp,
      GenAI_Dashboard: config.genAI.dashboard,
      GenAI_Widget: config.genAI.widget,
    }[type] || []

  const builtInAddOns = useMemo(() => {
    return addOnsArray.map((addOn: any) => {
      const marketplaceMatch = marketplaceAddOns?.find(
        (marketAddOn) => marketAddOn.id === addOn.id,
      )
      if (marketplaceMatch) {
        return {
          ...marketplaceMatch,
          customPayload: addOn.customPayload(prompt),
        }
      }
      return {
        ...addOn,
        customPayload: addOn.customPayload(prompt),
      }
    })
  }, [addOnsArray, marketplaceAddOns, prompt])

  const [userAIAddons, setUserAIAddOns] = useState<AddOn[]>([])
  const { useFetchAssets } = useAssets()
  const { data: assets } = useFetchAssets()

  useEffect(() => {
    if (!assets) {
      setUserAIAddOns([])
      return
    }
    if (type == 'GenAI_Python') {
      let pythonGenAIs = assets.filter(
        (asset: any) => asset.type == 'GENAI-PYTHON',
      )
      // console.log(pythonGenAIs)
      setHasGenAIAssets(pythonGenAIs.length > 0)
      let pythonAIAddons = pythonGenAIs.map((asset: any) => {
        let url = ''
        let accessToken = ''
        let method = 'POST'
        let requestField = ''
        let responseField = ''
        try {
          let data = JSON.parse(asset.data)
          url = data.url || ''
          accessToken = data.accessToken || ''
          ;(method = data.method), (requestField = data.requestField)
          responseField = data.responseField
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
      // console.log(pythonAIAddons)
      setUserAIAddOns(pythonAIAddons)
      return
    }
  }, [assets])

  useEffect(() => {
    if (marketplaceAddOns) {
      setAddonsLoaded(true)
    }
  }, [marketplaceAddOns])

  useEffect(() => {
    if (addonsLoaded) {
      const getSelectedGeneratorFromLocalStorage = (): AddOn | null => {
        const storedAddOn = localStorage.getItem('lastUsed_GenAIGenerator')
        return storedAddOn ? JSON.parse(storedAddOn) : null
      }
      const lastUsedGenAI = getSelectedGeneratorFromLocalStorage()
      if (lastUsedGenAI) {
        setSelectedAddOn(lastUsedGenAI)
      } else if (builtInAddOns.length > 0) {
        setSelectedAddOn(builtInAddOns[0])
      }
    }
  }, [addonsLoaded, builtInAddOns])

  const filteredMarketplaceAddOns = useMemo(() => {
    if (!marketplaceAddOns) return []
    const builtInIds = builtInAddOns.map((addon: AddOn) => addon.id)
    return marketplaceAddOns.filter((addon) => !builtInIds.includes(addon.id))
  }, [marketplaceAddOns, builtInAddOns])

  const handleGenerate = async () => {
    if (!selectedAddOn) return
    onCodeGenerated('')
    setLoading(true)
    onLoadingChange(true)
    try {
      // console.log(`selectedAddOn: ${JSON.stringify(selectedAddOn)}`)
      // console.log(`selectedAddOn.isMock: ${selectedAddOn.isMock}`)
      if (selectedAddOn.isMock) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        onCodeGenerated(default_generated_code)
        return
      }

      // console.log(`selectedAddOn.endpointUrl: ${selectedAddOn.endpointUrl}`)

      if (selectedAddOn.endpointUrl && selectedAddOn.name != 'SDV Copilot') {
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
              let payload = {
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

      // Use the new endpoint and payload format
      try {
        const response = await axios.post(
          'https://digitalauto-ai.com/chat',
          {
            systemMessage: selectedAddOn.samples || '',
            message: prompt,
          },
          {
            headers: {
              // Authorization: `Bearer ${access?.token}`,
              'Content-Type': 'application/json',
            },
          },
        )

        // Parse the generated content from the new response structure
        onCodeGenerated(response.data.content)
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
      <div className="flex h-full w-full flex-col border-r border-da-gray-light pl-0.5 pr-2">
        <div className="flex w-full items-center justify-between">
          <DaSectionTitle number={1} title="Prompting" />
          <div
            className={cn(
              canUseGenAI || hasGenAIAssets
                ? ''
                : 'opacity-50 pointer-events-none',
            )}
          >
            <Suspense>
              <DaSpeechToText onRecognize={setPrompt} prompt={prompt} />
            </Suspense>
          </div>
        </div>
        <div className="mt-1 flex h-full max-h-[300px] w-full">
          <DaTextarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            // Listen for Enter key to trigger generation (ignoring Shift+Enter for new lines)
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (!loading && prompt && addonsLoaded) {
                  handleGenerate()
                }
              }
            }}
            placeholder={placeholderText}
            className="w-full h-full"
            textareaClassName="flex h-full resize-none !bg-gray-50 text-da-gray-dark"
          />
        </div>

        <DaSectionTitle number={2} title="Select Generator" className="mt-4" />
        <div className="flex h-[150px] xl:h-[300px] w-full">
          {addonsLoaded ? (
            <DaGeneratorSelector
              builtInAddOns={builtInAddOns}
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
              <TbLoader className="text-da-primary-500 animate-spin mr-1.5" />
              Loading AI Generator
            </div>
          )}
        </div>

        {!canUseGenAI && !hasGenAIAssets ? (
          <div className="flex w-full select-none justify-center items-center text-sm text-da-gray-dark py-1 font-medium">
            <TbAlertCircle className="text-red-500 mr-1 size-5" />
            Permission required
            <span className="xl:flex hidden ml-1"> for GenAI access</span>.
            Contact
            <span
              className="ml-1 py-0.5 px-1 rounded-lg bg-gray-100 hover:bg-gray-200 cursor-pointer"
              onClick={handleCopy}
            >
              info@digital.auto{' '}
              {copied ? (
                <TbCheck className="text-green-500 h-4 w-4 inline-block" />
              ) : (
                <TbCopy className="h-4 w-4 inline-block" />
              )}
            </span>
          </div>
        ) : (
          !prompt && (
            <div className="flex w-full select-none justify-center items-center text-sm text-da-gray-dark py-1 font-medium">
              <TbExclamationMark className="text-orange-500 mr-1 size-5" />
              You need to enter prompt and select generator
            </div>
          )
        )}

        <DaButton
          variant="solid"
          disabled={
            !prompt ||
            loading ||
            !addonsLoaded ||
            (!canUseGenAI && !hasGenAIAssets)
          }
          className={cn('min-h-8 w-full py-1', prompt ? '!mt-1' : '')}
          onClick={handleGenerate}
        >
          <BsStars
            className={`mb-0.5 mr-1 inline-block size-4 ${loading ? 'animate-pulse' : ''}`}
          />
          {!loading && <div>{buttonText}</div>}
        </DaButton>
      </div>
    </div>
  )
}

export default DaGenAI_Base
