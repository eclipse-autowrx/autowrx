import { useEffect, useRef, useState } from 'react'
import { DaButton } from '@/components/atoms/DaButton'
import { BsStars } from 'react-icons/bs'
import { AddOn } from '@/types/addon.type'
import { DaTextarea } from '@/components/atoms/DaTextarea.tsx'
import DaGeneratorSelector from './DaGeneratorSelector.tsx'
import useListMarketplaceAddOns from '@/hooks/useListMarketplaceAddOns'
import usePermissionHook from '@/hooks/usePermissionHook'
import { PERMISSIONS } from '@/data/permission'
import DaSectionTitle from '@/components/atoms/DaSectionTitle'
import DaSpeechToText from './DaSpeechToText'
import config from '@/configs/config'
import axios from 'axios'
import { toast } from 'react-toastify'
import useAuthStore from '@/stores/authStore.ts'
import default_generated_code from '@/data/default_generated_code'
import { cn } from '@/lib/utils.ts'
import { TbHistory, TbRotate, TbSettings } from 'react-icons/tb'
import promptTemplates from '@/data/prompt_templates.ts'
import { useClickOutside } from '@/lib/utils.ts'
import useGenAIWizardStore from '@/stores/genAIWizardStore.ts'
import DaPopup from '@/components/atoms/DaPopup.tsx'
import DaText from '@/components/atoms/DaText.tsx'
import DaGeneratorSelectPopup from './DaGeneratorSelectPopup.tsx'

type DaGenAI_BaseProps = {
  type: 'GenAI_Python' | 'GenAI_Dashboard' | 'GenAI_Widget'
  buttonText?: string
  placeholderText?: string
  className?: string
  onCodeGenerated: (code: string) => void
  onLoadingChange: (loading: boolean) => void
  onFinishChange: (isFinished: boolean) => void
  isWizard?: boolean
}

const DaGenAI_Base = ({
  type,
  buttonText = 'Generate',
  placeholderText = 'Ask AI to generate based on this prompt...',
  className = '',
  onCodeGenerated,
  onLoadingChange,
  onFinishChange,
  isWizard,
}: DaGenAI_BaseProps) => {
  const [inputPrompt, setInputPrompt] = useState<string>('')
  const [selectedAddOn, setSelectedAddOn] = useState<AddOn | undefined>(
    undefined,
  )
  const [loading, setLoading] = useState<boolean>(false)
  const [streamOutput, setStreamOutput] = useState<string>('')
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [isFinished, setIsFinished] = useState<boolean>(false)
  const { data: marketplaceAddOns } = useListMarketplaceAddOns(type)
  const [canUseGenAI] = usePermissionHook([PERMISSIONS.USE_GEN_AI])
  const access = useAuthStore((state) => state.access)
  const timeouts = useRef<NodeJS.Timeout[]>([])
  const {
    registerWizardGenerateCodeAction,
    setWizardGeneratedCode,
    setPrototypeData,
    setWizardPrompt,
    setWizardLog,
  } = useGenAIWizardStore()

  const [openSelectorPopup, setOpenSelectorPopup] = useState(false)

  const addOnsArray =
    {
      GenAI_Python: config.genAI.sdvApp,
      GenAI_Dashboard: config.genAI.dashboard,
      GenAI_Widget: config.genAI.widget,
    }[type] || []

  const builtInAddOns: AddOn[] = addOnsArray.map((addOn: any) => ({
    ...addOn,
    customPayload: addOn.customPayload(inputPrompt),
  }))

  const mockStreamOutput = async () => {
    setStreamOutput(() => 'Sending request...')
    timeouts.current.push(
      setTimeout(() => {
        setStreamOutput(() => 'Processing request...')
      }, 500),
    )
    timeouts.current.push(
      setTimeout(() => {
        setStreamOutput(() => 'Querying context...')
      }, 650),
    )
    timeouts.current.push(
      setTimeout(() => {
        setStreamOutput(() => 'LLM processing...')
      }, 2650),
    )
  }

  const handleGenerate = async () => {
    if (!selectedAddOn) return
    onCodeGenerated('')
    setLoading(true)
    onLoadingChange(true)
    setIsFinished(false)
    onFinishChange(false)
    try {
      mockStreamOutput()
      // console.log('selectedAddOn at genai base', selectedAddOn)
      if (selectedAddOn.isMock) {
        // console.log('Mock generating code...')
        await new Promise((resolve) => setTimeout(resolve, 1000))
        // console.log('Mock generated code:', default_generated_code)
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
          { prompt: inputPrompt },
          { headers: { Authorization: `Bearer ${access?.token}` } },
        )
        onCodeGenerated(response.data.payload.code)
        setWizardGeneratedCode(response.data.payload.code)
      } else {
        response = await axios.post(
          config.genAI.defaultEndpointUrl,
          {
            endpointURL: selectedAddOn.endpointUrl,
            inputPrompt: inputPrompt,
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
      setLoading(false)
      onLoadingChange(false)
      setIsFinished(true)
      onFinishChange(true)
      setStreamOutput('Received response')
    }
  }

  useEffect(() => {
    if (isWizard) {
      return
    }
    if (isFinished) {
      const timeout = setTimeout(() => {
        setStreamOutput('')
      }, 3000)
      timeouts.current.push(timeout)
    }
    return () => {
      timeouts.current.forEach((timeout) => clearTimeout(timeout))
      timeouts.current = []
    }
  }, [isFinished, isWizard])

  useEffect(() => {
    return () => {
      timeouts.current.forEach((timeout) => clearTimeout(timeout))
    }
  }, [])

  useClickOutside(dropdownRef, () => {
    setShowDropdown(false)
  })

  useEffect(() => {
    if (isWizard) {
      setSelectedAddOn(builtInAddOns.find((addOn) => addOn.isMock) || undefined)
    }
  }, [isWizard])

  useEffect(() => {
    if (isWizard) {
      setWizardPrompt(inputPrompt)
      registerWizardGenerateCodeAction(handleGenerate)
    }
  }, [inputPrompt, selectedAddOn])

  useEffect(() => {
    if (isWizard) {
      setWizardLog(streamOutput)
    }
  }, [streamOutput])

  return (
    <div className={cn('flex h-full w-full rounded', className)}>
      <div
        className={cn(
          'flex h-full w-full flex-col overflow-y-auto border-r border-da-gray-light pl-0.5 pr-2',
          isWizard && 'border-none',
        )}
      >
        <div className="flex w-full items-center justify-between">
          {!isWizard ? (
            <DaSectionTitle number={1} title="Prompting" />
          ) : (
            <div className="space-x-2">
              <div className="relative flex">
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

                {showDropdown && (
                  <div
                    ref={dropdownRef}
                    className="absolute top-6 z-10 mt-2 w-full min-w-full rounded-lg border border-gray-300 bg-white shadow-lg"
                  >
                    {promptTemplates.map((template) => (
                      <div
                        key={template.title}
                        className="da-txt-small flex w-full min-w-full shrink-0 cursor-pointer border-b p-2 hover:bg-da-gray-light"
                        onClick={() => {
                          setInputPrompt(template.prompt)
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
                  onClick={() => setInputPrompt('')}
                >
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
          )}

          <DaSpeechToText onRecognize={setInputPrompt} />
        </div>
        <div className="mt-1 flex h-fit w-full">
          <DaTextarea
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            rows={isWizard ? 12 : 7}
            placeholder={placeholderText}
            className="w-full"
            textareaClassName={cn(
              'resize-none !bg-gray-50 text-da-gray-dark',
              isWizard && '!text-lg',
            )}
          />
        </div>

        {!isWizard && (
          <>
            <DaSectionTitle
              number={2}
              title="Select Generator"
              className="mt-4"
            />
            <DaGeneratorSelector
              builtInAddOns={builtInAddOns}
              marketplaceAddOns={
                marketplaceAddOns ? (canUseGenAI ? marketplaceAddOns : []) : []
              }
              onSelectedGeneratorChange={setSelectedAddOn}
            />
          </>
        )}

        {(streamOutput || isWizard) && (
          <>
            <div className="da-label-small-medium mb-1 mt-2">Status</div>
            <div
              className={cn(
                'mt-2 flex h-10 rounded-md bg-da-gray-dark p-3',
                isWizard && 'mb-2 mt-0 h-full',
              )}
            >
              <p className="da-label-small font-mono text-white">
                {streamOutput ? streamOutput : 'Log messages...'}
              </p>
            </div>
          </>
        )}
        {!isWizard && (
          <>
            {!inputPrompt && (
              <div className="mt-auto flex w-full select-none justify-center text-sm text-gray-400">
                You need to enter prompt and select generator
              </div>
            )}

            <DaButton
              variant="solid"
              disabled={!inputPrompt || loading}
              className={`mt-auto !h-8 w-full ${!inputPrompt ? '!mt-1' : 'mt-auto'}`}
              onClick={handleGenerate}
            >
              <BsStars
                className={`mb-0.5 mr-1 inline-block ${loading ? 'animate-pulse' : ''}`}
              />
              {!loading && <div>{buttonText}</div>}
            </DaButton>
          </>
        )}
      </div>

      {isWizard && (
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
            onSelectedGeneratorChange={setSelectedAddOn}
            onClick={() => setOpenSelectorPopup(false)}
          />
        </DaPopup>
      )}
    </div>
  )
}
export default DaGenAI_Base
