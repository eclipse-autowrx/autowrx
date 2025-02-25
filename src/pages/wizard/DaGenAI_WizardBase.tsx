import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { DaButton } from '@/components/atoms/DaButton'
import { AddOn } from '@/types/addon.type'
import { DaTextarea } from '@/components/atoms/DaTextarea'
import config from '@/configs/config'
import axios from 'axios'
import { toast } from 'react-toastify'
import useAuthStore from '@/stores/authStore'
import default_generated_code from '@/data/default_generated_code'
import { cn, useClickOutside } from '@/lib/utils'
import { TbHistory, TbRotate, TbSettings } from 'react-icons/tb'
import useGenAIWizardStore from '@/pages/wizard/useGenAIWizardStore.js'
import DaPopup from '@/components/atoms/DaPopup'
import DaText from '@/components/atoms/DaText'
import DaGeneratorSelectPopup from '../../components/molecules/genAI/DaGeneratorSelectPopup.js'
import useListMarketplaceAddOns from '@/hooks/useListMarketplaceAddOns'
import usePermissionHook from '@/hooks/usePermissionHook'
import { PERMISSIONS } from '@/data/permission'
import Prompt_Templates from '../../../instance/prompt_templates.js'
import { retry } from '@/lib/retry.js'

const DaSpeechToText = lazy(() =>
  retry(() => import('../../components/molecules/genAI/DaSpeechToText.js')),
)

type DaGenAI_WizardBaseProps = {
  type: 'GenAI_Python' | 'GenAI_Dashboard' | 'GenAI_Widget'
  onCodeGenerated: (code: string) => void
  onLoadingChange: (loading: boolean) => void
  className?: string
}

const DaGenAI_WizardBase = ({
  type,
  className = '',
  onCodeGenerated,
  onLoadingChange,
}: DaGenAI_WizardBaseProps) => {
  const { wizardPrompt, setWizardPrompt } = useGenAIWizardStore()
  const [selectedAddOn, setSelectedAddOn] = useState<AddOn | undefined>(
    undefined,
  )
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { data: marketplaceAddOns } = useListMarketplaceAddOns(type)
  const [canUseGenAI] = usePermissionHook([PERMISSIONS.USE_GEN_AI])
  const [uniqueLogs, setUniqueLogs] = useState<
    { source: string; content: string }[]
  >([])
  const access = useAuthStore((state) => state.access)
  const timeouts = useRef<NodeJS.Timeout[]>([])
  const {
    registerWizardGenerateCodeAction,
    setWizardGeneratedCode,
    setPrototypeData,
    setCodeGenerating,
  } = useGenAIWizardStore()
  const [openSelectorPopup, setOpenSelectorPopup] = useState(false)
  const [promptTemplates, setPromptTemplates] = useState<any[]>([])

  const prompt = wizardPrompt
  const setPrompt = setWizardPrompt

  // Determine built-in add-ons based on the type.
  const addOnsArray =
    {
      GenAI_Python: config.genAI.sdvApp,
      GenAI_Dashboard: config.genAI.dashboard,
      GenAI_Widget: config.genAI.widget,
    }[type] || []

  // builtInAddOns contain the full definitions including customPayload.
  const builtInAddOns: AddOn[] = addOnsArray.map((addOn: any) => ({
    ...addOn,
    customPayload: addOn.customPayload,
  }))

  // -------------------------------
  // Updated handleGenerate using POST with manual SSE stream parsing
  // -------------------------------
  const handleGenerate = async () => {
    if (!selectedAddOn) return
    onCodeGenerated('')
    setCodeGenerating(true)
    onLoadingChange(true)
    setUniqueLogs([])

    if (selectedAddOn.isMock) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      onCodeGenerated(default_generated_code)
      setPrototypeData({ code: default_generated_code })
      setCodeGenerating(false)
      onLoadingChange(false)
      return
    }

    try {
      // Create the payload using the add-on’s customPayload function.
      const payload = selectedAddOn.customPayload(prompt)
      console.log('Payload:', payload)

      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${access?.token}`,
        },
        body: JSON.stringify(payload),
      }

      // A manual implementation to read a streaming response:
      async function streamSSE(url: string, options: RequestInit) {
        const response = await fetch(url, options)
        if (!response.ok) {
          throw new Error('Network response was not ok')
        }
        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error('ReadableStream not supported in this browser')
        }
        const decoder = new TextDecoder('utf-8')
        let buffer = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          // SSE events are typically separated by a double newline.
          const events = buffer.split('\n\n')
          // Keep the last incomplete event in the buffer.
          buffer = events.pop() || ''
          for (const eventStr of events) {
            // Process each event block.
            const lines = eventStr.split('\n')
            let eventData = ''
            for (const line of lines) {
              if (line.startsWith('data:')) {
                eventData += line.slice(5).trim()
              }
            }
            if (eventData) {
              try {
                const eventObj = JSON.parse(eventData)
                if (eventObj.message && eventObj.message.content) {
                  const { type: contentType, payload: eventPayload } =
                    eventObj.message.content
                  if (contentType === 'code') {
                    onCodeGenerated(eventPayload)
                    setWizardGeneratedCode(eventPayload)
                  } else if (contentType === 'selected-signals') {
                    // Split the signal string by '%n' and join with newline.
                    const signals = eventPayload
                      .split('%n')
                      .filter((signal: any) => signal.trim() !== '')
                    const formattedSignals = signals.join('\n')
                    setUniqueLogs((prevLogs) => {
                      const existingIndex = prevLogs.findIndex(
                        (log) => log.source === contentType,
                      )
                      if (existingIndex !== -1) {
                        const newLogs = [...prevLogs]
                        newLogs[existingIndex] = {
                          source: contentType,
                          content: formattedSignals,
                        }
                        return newLogs
                      }
                      return [
                        ...prevLogs,
                        { source: contentType, content: formattedSignals },
                      ]
                    })
                  }
                }
              } catch (e) {
                console.error('Error parsing SSE event:', e)
              }
            }
          }
        }
      }

      await streamSSE(selectedAddOn.endpointUrl, options)
    } catch (error) {
      timeouts.current.forEach((timeout) => clearTimeout(timeout))
      timeouts.current = []
      console.error('Error generating AI content:', error)
      toast.error('Error generating AI content')
    } finally {
      setCodeGenerating(false)
      onLoadingChange(false)
    }
  }
  // -------------------------------
  // End updated handleGenerate
  // -------------------------------

  useClickOutside(dropdownRef, () => {
    setShowDropdown(false)
  })

  useEffect(() => {
    registerWizardGenerateCodeAction(handleGenerate)
  }, [prompt, selectedAddOn])

  useEffect(() => {
    if (prompt.length === 0) {
      setUniqueLogs([])
    }
  }, [prompt])

  // -------------------------------
  // Rehydrate the add-on from localStorage
  // -------------------------------
  useEffect(() => {
    const storedAddOnStr = localStorage.getItem('lastUsed_GenAIWizardGenerator')
    let selected: AddOn | undefined = undefined

    if (storedAddOnStr) {
      const storedAddOn = JSON.parse(storedAddOnStr)
      selected = builtInAddOns.find((addOn) => addOn.id === storedAddOn.id)
    }

    if (!selected) {
      selected =
        config.instance === 'etas'
          ? builtInAddOns.find((addOn) => addOn.id === 'etas-sdv-genai')
          : builtInAddOns[0]
    }

    if (selected) {
      setSelectedAddOn(selected)
    }
  }, [builtInAddOns])

  useEffect(() => {
    setPromptTemplates(Prompt_Templates)
  }, [])

  return (
    <div className={cn('flex h-full w-full rounded px-4', className)}>
      <div className="flex h-full w-full flex-col overflow-y-auto border-none pl-0.5 pr-2">
        <div className="flex w-full items-center justify-between">
          <div className="space-x-2">
            <div className="relative flex">
              {promptTemplates && promptTemplates.length > 0 && (
                <DaButton
                  variant="plain"
                  size="sm"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  <TbHistory className="mr-1 size-4" />
                  History
                </DaButton>
              )}

              {showDropdown && (
                <div
                  ref={dropdownRef}
                  className="absolute top-6 z-10 mt-2 w-full min-w-full rounded-lg border border-gray-300 bg-white shadow-lg"
                >
                  {promptTemplates &&
                    promptTemplates.length > 0 &&
                    promptTemplates.map((template) => (
                      <div
                        key={template.title}
                        className="da-txt-small flex w-full min-w-full shrink-0 cursor-pointer border-b p-2 hover:bg-da-gray-light"
                        onClick={() => {
                          setPrompt(template.prompt)
                          setShowDropdown(!showDropdown)
                        }}
                      >
                        {template.title}
                      </div>
                    ))}
                </div>
              )}
              <DaButton variant="plain" size="sm" onClick={() => setPrompt('')}>
                <TbRotate className="mr-1 size-4 rotate-[270deg]" />
                Clear
              </DaButton>
              <DaButton
                variant="plain"
                size="sm"
                onClick={() => setOpenSelectorPopup(true)}
              >
                <TbSettings className="mr-1 size-4" />
                Settings
              </DaButton>
            </div>
          </div>

          {/* Speech to Text component */}
          <Suspense>
            <DaSpeechToText onRecognize={setPrompt} prompt={prompt} />
          </Suspense>
        </div>

        {/* Prompt Textarea */}
        <div className="mt-1 flex h-full w-full">
          <DaTextarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask AI to generate based on this prompt..."
            className="w-full h-full"
            textareaClassName="flex h-full resize-none !bg-gray-50 text-da-gray-darkest !text-lg"
          />
        </div>

        {/* Status Section */}
        <div className="da-label-small-medium mb-1 mt-2">Status</div>
        <div className="flex flex-col mt-0 h-full mb-2 space-y-2 overflow-y-auto flex-shrink-0 max-h-[100px] xl:max-h-[150px] 2xl:max-h-[200px] rounded-md bg-da-gray-darkest p-3 text-white text-sm">
          {uniqueLogs.map((log, index) => (
            <div key={index} className="flex flex-col w-full">
              <div className="uppercase text-xs font-bold p-1 mb-2 bg-white/25 w-fit h-fit rounded-md mr-1">
                {log.source}
              </div>
              <div className="flex whitespace-pre-wrap leading-relaxed">
                {log.content}
              </div>
            </div>
          ))}
        </div>

        {/* Generator Selector Popup */}
        <DaPopup
          state={[openSelectorPopup, setOpenSelectorPopup]}
          trigger={<span></span>}
          className="flex flex-col w-[40vw] lg:w-[30vw] min-w-[600px] max-w-[500px] h-fit max-h-[550px] p-4 bg-da-white"
          onClose={() => setOpenSelectorPopup(false)}
        >
          <DaText variant="sub-title">Select AI Generator</DaText>
          <DaGeneratorSelectPopup
            builtInAddOns={builtInAddOns}
            marketplaceAddOns={
              marketplaceAddOns ? (canUseGenAI ? marketplaceAddOns : []) : []
            }
            onSelectedGeneratorChange={(addOn: AddOn) => {
              setSelectedAddOn(addOn)
              // Remove customPayload before storing so it can be rehydrated later.
              const { customPayload, ...addOnToStore } = addOn
              localStorage.setItem(
                'lastUsed_GenAIWizardGenerator',
                JSON.stringify(addOnToStore),
              )
            }}
            onClick={() => setOpenSelectorPopup(false)}
          />
        </DaPopup>
      </div>
    </div>
  )
}

export default DaGenAI_WizardBase
