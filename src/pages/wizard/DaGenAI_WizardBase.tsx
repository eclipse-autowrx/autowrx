import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { DaButton } from '@/components/atoms/DaButton'
import { AddOn } from '@/types/addon.type'
import { DaTextarea } from '@/components/atoms/DaTextarea'
import config from '@/configs/config'
import { toast } from 'react-toastify'
import useAuthStore from '@/stores/authStore'
import default_generated_code from '@/data/default_generated_code'
import { cn, useClickOutside } from '@/lib/utils'
import useGenAIWizardStore from '@/pages/wizard/useGenAIWizardStore.js'
import DaPopup from '@/components/atoms/DaPopup'
import DaText from '@/components/atoms/DaText'
import DaGeneratorSelectPopup from '../../components/molecules/genAI/DaGeneratorSelectPopup.js'
import useListMarketplaceAddOns from '@/hooks/useListMarketplaceAddOns'
import usePermissionHook from '@/hooks/usePermissionHook'
import { PERMISSIONS } from '@/data/permission'
import Prompt_Templates from '../../../instance/prompt_templates.js'
import { retry } from '@/lib/retry.js'
import {
  PiGear,
  PiLightbulb,
  PiMagicWand,
  PiSparkle,
  PiXCircle,
} from 'react-icons/pi'
import MarkdownRender from './MarkdownRender.js'

const DaSpeechToText = lazy(() =>
  retry(() => import('../../components/molecules/genAI/DaSpeechToText.js')),
)

type DaGenAI_WizardBaseProps = {
  type: 'GenAI_Python' | 'GenAI_Dashboard' | 'GenAI_Widget'
  onCodeGenerated: (code: string) => void
  className?: string
}

const DaGenAI_WizardBase = ({
  type,
  className = '',
  onCodeGenerated,
}: DaGenAI_WizardBaseProps) => {
  const { wizardPrompt, wizardPrototype, setWizardPrompt, resetWizardStore } =
    useGenAIWizardStore()
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
    wizardModelId,
  } = useGenAIWizardStore()
  const [openSelectorPopup, setOpenSelectorPopup] = useState(false)
  const [promptTemplates, setPromptTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
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
    setLoading(true)
    setUniqueLogs([])

    if (selectedAddOn.isMock) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      onCodeGenerated(default_generated_code)
      setPrototypeData({ code: default_generated_code })
      setCodeGenerating(false)
      setLoading(false)
      return
    }

    try {
      // Create the payload using the add-on’s customPayload function.
      // Determine the profile with a fallback.
      const profile = wizardPrototype.model_id || 'spring_ai_azure_vector_store'
      // Create the payload using the add-on’s customPayload function with the profile.
      const payload = selectedAddOn.customPayload(prompt, profile)
      console.log('Payload at wizard base', payload)

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
                  const {
                    type: contentType,
                    payload: eventPayload,
                    thoughts,
                  } = eventObj.message.content

                  if (contentType === 'code') {
                    // Process generated code.
                    onCodeGenerated(eventPayload)
                    setWizardGeneratedCode(eventPayload)

                    // Optionally update logs with the explanation/thoughts.
                    if (thoughts && thoughts.trim()) {
                      const cleanThoughts = thoughts
                        .replace(/```(?:json)?|```/g, '')
                        .trim()
                      setUniqueLogs((prevLogs) => {
                        const existingIndex = prevLogs.findIndex(
                          (log) => log.source === contentType,
                        )
                        if (existingIndex !== -1) {
                          const newLogs = [...prevLogs]
                          newLogs[existingIndex] = {
                            source: contentType,
                            content: cleanThoughts,
                          }
                          return newLogs
                        }
                        return [
                          ...prevLogs,
                          { source: contentType, content: cleanThoughts },
                        ]
                      })
                    }
                  } else if (contentType === 'selected_signals') {
                    // Process selected signals.
                    let signals: string[] = []
                    if (thoughts && thoughts.trim()) {
                      const cleanThoughts = thoughts
                        .replace(/```(?:json)?|```/g, '')
                        .trim()
                      try {
                        signals = JSON.parse(cleanThoughts)
                      } catch (err) {
                        console.error('Error parsing thoughts JSON:', err)
                        signals = eventPayload
                          .split('%n')
                          .filter((s: string) => s.trim() !== '')
                      }
                    } else if (eventPayload) {
                      signals = eventPayload
                        .split('%n')
                        .filter((s: string) => s.trim() !== '')
                    }
                    const formattedSignals =
                      '### Selected Signals  \n' + signals.join('  \n') + '\n'
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
                  } else if (contentType === 'error') {
                    // Handle error response.
                    setUniqueLogs((prevLogs) => [
                      ...prevLogs,
                      { source: contentType, content: eventPayload },
                    ])
                    console.error('Error from AI service:', eventPayload)
                    toast.error(eventPayload)
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
      setLoading(false)
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
    <div className={cn('flex flex-col h-full w-full rounded py-1', className)}>
      <div className="font-semibold text-da-gray-dark border-b py-2 mb-1 px-3">
        Generate with AI
      </div>

      <div className="flex h-full w-full flex-col overflow-y-auto border-none py-2 px-3">
        {uniqueLogs && uniqueLogs.length > 0 ? (
          <div className="flex flex-col mt-0 h-full mb-2 space-y-2 overflow-y-auto rounded-md bg-gray-200 p-3 text-da-gray-darkest text-sm">
            {uniqueLogs.map((log, index) => (
              <div key={index} className="flex flex-col w-full">
                <MarkdownRender markdownText={log.content} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full">
            <PiSparkle className="size-10 text-da-gray-darkest" />
            <div className="text-xl text-da-gray-darkest font-semibold mt-2">
              Create vehicle apps with GenAI
            </div>
            <div className="max-w-[30vw] text-center mt-1">
              Start your session by entering what the vehicle should do. If you
              are not satisfied with the results, clear the input and insert a
              new text.
            </div>
          </div>
        )}

        {/* Prompt Textarea */}
        <div className="flex flex-col h-fit w-full ">
          <div className="flex w-full items-center justify-between">
            <div className="space-x-2">
              <div className="relative flex">
                {promptTemplates && promptTemplates.length > 0 && (
                  <DaButton
                    variant="plain"
                    size="sm"
                    onClick={() => setShowDropdown(!showDropdown)}
                  >
                    <PiLightbulb className="mr-1 size-5" />
                    Examples
                  </DaButton>
                )}

                {showDropdown && (
                  <div
                    ref={dropdownRef}
                    className="absolute top-6 z-10 mt-2 w-full min-w-full max-h-[20vh] rounded-lg border border-gray-300 bg-white shadow-lg overflow-y-auto scroll"
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
                <DaButton
                  variant="plain"
                  size="sm"
                  onClick={() => resetWizardStore()}
                >
                  <PiXCircle className="mr-1 size-5" />
                  Clear
                </DaButton>
                <DaButton
                  variant="plain"
                  size="sm"
                  onClick={() => setOpenSelectorPopup(true)}
                >
                  <PiGear className="mr-1 size-5" />
                  Settings
                </DaButton>
              </div>
            </div>
          </div>
          <div className="flex flex-col p-2 mt-2 border border-da-gray-medium rounded-md">
            <DaTextarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask AI to generate based on this prompt..."
              className="w-full h-[15vh] shadow-none !outline-none focus:outline-none"
              textareaClassName="flex h-full resize-none focus:ring-0 !shadow-none border-none text-da-gray-darkest !text-lg"
            />
            <div className="flex justify-between p-2">
              <Suspense>
                <DaSpeechToText
                  onRecognize={setPrompt}
                  prompt={prompt}
                  iconClassName="text-da-gray-medium"
                />
              </Suspense>
              <DaButton
                onClick={handleGenerate}
                className="!px-5 !rounded-full"
                variant="solid"
                disabled={wizardPrompt.length === 0 || loading}
              >
                <PiMagicWand className="size-5 mr-2" /> Generate
              </DaButton>
            </div>
          </div>
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
