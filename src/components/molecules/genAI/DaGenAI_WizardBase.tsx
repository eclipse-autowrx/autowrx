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
import useGenAIWizardStore from '@/stores/genAIWizardStore'
import DaPopup from '@/components/atoms/DaPopup'
import DaText from '@/components/atoms/DaText'
import DaGeneratorSelectPopup from './DaGeneratorSelectPopup'
import { io } from 'socket.io-client'
import useListMarketplaceAddOns from '@/hooks/useListMarketplaceAddOns'
import usePermissionHook from '@/hooks/usePermissionHook'
import { PERMISSIONS } from '@/data/permission'
import Prompt_Templates from '../../../../instance/prompt_templates.js'
import useSocketIO from '@/hooks/useSocketIO.js'
import { retry } from '@/lib/retry.js'

const DaSpeechToText = lazy(() => retry(() => import('./DaSpeechToText')))

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
  const socket = useSocketIO()

  const prompt = wizardPrompt
  const setPrompt = setWizardPrompt

  const addOnsArray =
    {
      GenAI_Python: config.genAI.sdvApp,
      GenAI_Dashboard: config.genAI.dashboard,
      GenAI_Widget: config.genAI.widget,
    }[type] || []

  const builtInAddOns: AddOn[] = addOnsArray.map((addOn: any) => ({
    ...addOn,
    customPayload: addOn.customPayload(prompt),
  }))

  useEffect(() => {
    if (!socket) {
      return
    }

    socket.on('connect', () => {
      console.log('Socket.IO connection established')
    })

    socket.on('etas-stream', (rawMessage) => {
      let message
      try {
        message =
          typeof rawMessage === 'string' ? JSON.parse(rawMessage) : rawMessage
      } catch (error) {
        console.error('Error parsing JSON:', error, rawMessage)
        return
      }

      const cleanedContent = message.content
        .replace(/^=+\s*(.*?)\s*=+$/g, '$1')
        .trim()

      if (message.source && message.content) {
        const newLog = {
          source: message.source.trim().toLowerCase(),
          content: cleanedContent,
        }

        setUniqueLogs((prevLogs) => {
          const exists = prevLogs.some(
            (log) =>
              log.source === newLog.source && log.content === newLog.content,
          )

          if (!exists) {
            return [...prevLogs, newLog]
          }
          return prevLogs
        })
      } else {
        console.warn('Message is missing source or content:', message)
      }
    })

    socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error)
    })

    socket.on('disconnect', () => {
      console.log('Socket.IO connection closed')
    })

    return () => {
      socket.disconnect()
    }
  }, [access, socket])

  const handleGenerate = async () => {
    if (!selectedAddOn) return
    onCodeGenerated('')
    setCodeGenerating(true)
    onLoadingChange(true)
    setUniqueLogs([])
    try {
      if (selectedAddOn.isMock) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        onCodeGenerated && onCodeGenerated(default_generated_code)
        setPrototypeData({ code: default_generated_code })
        return
      }

      let response
      if (
        selectedAddOn.endpointUrl &&
        !(marketplaceAddOns || []).some(
          (addOn) => addOn.id === selectedAddOn.id,
        )
      ) {
        response = await axios.post(
          selectedAddOn.endpointUrl,
          { prompt },
          { headers: { Authorization: `Bearer ${access?.token}` } },
        )
        onCodeGenerated(response.data.payload.code)
        setWizardGeneratedCode(response.data.payload.code)
      } else {
        response = await axios.post(
          config.genAI.defaultEndpointUrl,
          {
            endpointURL: selectedAddOn.endpointUrl,
            inputPrompt: prompt,
            systemMessage: selectedAddOn.samples || '',
          },
          { headers: { Authorization: `Bearer ${access?.token}` } },
        )
        onCodeGenerated(response.data)
        setWizardGeneratedCode(response.data)
      }
    } catch (error) {
      timeouts.current.forEach((timeout) => clearTimeout(timeout))
      timeouts.current = []
      console.error('Error generating AI content:', error)
      if (axios.isAxiosError && axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message || 'Error generating AI content',
        )
      } else {
        toast.error('Error generating AI content')
      }
    } finally {
      setCodeGenerating(false)
      onLoadingChange(false)
    }
  }

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

  useEffect(() => {
    const getSelectedGeneratorFromLocalStorage = (): AddOn | null => {
      const storedAddOn = localStorage.getItem('lastUsed_GenAIWizardGenerator')
      return storedAddOn ? JSON.parse(storedAddOn) : null
    }

    const lastUsedGenAI = getSelectedGeneratorFromLocalStorage()
    if (lastUsedGenAI) {
      setSelectedAddOn(lastUsedGenAI)
    } else {
      // If not last used found in localStorage, check builtInAddOns for etas-sdv-genai if instance is etas
      let defaultAddOn: AddOn | undefined
      if (config.instance === 'etas') {
        defaultAddOn = builtInAddOns.find(
          (addOn) => addOn.id === 'etas-sdv-genai',
        )
      } else {
        defaultAddOn = builtInAddOns[0]
      }
      if (defaultAddOn) {
        setSelectedAddOn(defaultAddOn)
      }
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
                  onClick={() => {
                    setShowDropdown(!showDropdown)
                  }}
                >
                  <TbHistory className="mr-1 size-4 rotate-[0deg]" />
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
            <div key={index} className="flex w-full items-center">
              <div className="uppercase font-bold px-2 py-1 bg-white/25 w-fit h-fit rounded-md mr-1">
                {log.source}
              </div>
              {log.content}
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
              localStorage.setItem(
                'lastUsed_GenAIWizardGenerator',
                JSON.stringify(addOn),
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
