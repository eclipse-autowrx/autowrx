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
import { TbHistory, TbRotate } from 'react-icons/tb'

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
  const [selectedAddOn, setSelectedAddOn] = useState<AddOn | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [streamOutput, setStreamOutput] = useState<string>('')
  const [isFinished, setIsFinished] = useState<boolean>(false)
  const { data: marketplaceAddOns } = useListMarketplaceAddOns(type)
  const [canUseGenAI] = usePermissionHook([PERMISSIONS.USE_GEN_AI])
  const access = useAuthStore((state) => state.access)
  const timeouts = useRef<NodeJS.Timeout[]>([])

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

      if (selectedAddOn.isMock) {
        await new Promise((resolve) => setTimeout(resolve, 5000))
        onCodeGenerated && onCodeGenerated(default_generated_code || '')
        return
      }

      let response
      if (selectedAddOn.endpointUrl) {
        response = await axios.post(
          selectedAddOn.endpointUrl,
          { prompt: inputPrompt },
          { headers: { Authorization: `Bearer ${access?.token}` } },
        )
        onCodeGenerated(response.data.payload.code)
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
  }, [isFinished])

  useEffect(() => {
    return () => {
      timeouts.current.forEach((timeout) => clearTimeout(timeout))
    }
  }, [])

  return (
    <div className={cn('flex h-full w-full rounded', className)}>
      <div
        className={cn(
          'flex h-full w-full flex-col border-r border-da-gray-light pr-2 pt-3',
          isWizard && 'border-none',
        )}
      >
        <div className="flex w-full items-center justify-between">
          {!isWizard ? (
            <DaSectionTitle number={1} title="Prompting" />
          ) : (
            <div className="space-x-2">
              <DaButton variant="plain" size="sm" onClick={() => {}}>
                <TbHistory className="mr-1 size-4 rotate-[0deg]" />
                History
              </DaButton>
              <DaButton variant="plain" size="sm" onClick={() => {}}>
                <TbRotate className="mr-1 size-4 rotate-[270deg]" />
                Undo
              </DaButton>
            </div>
          )}

          <DaSpeechToText onRecognize={setInputPrompt} />
        </div>
        <div className="mb-4 mt-1 flex h-fit w-full">
          <DaTextarea
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            rows={9}
            placeholder={placeholderText}
            className="w-full"
            textareaClassName="resize-none"
          />
        </div>

        {!isWizard && (
          <>
            <DaSectionTitle number={2} title="Select Generator" />
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
          <div
            className={cn(
              'mt-2 flex h-10 rounded-md bg-da-gray-dark p-3',
              isWizard && 'mt-0 min-h-36',
              0,
            )}
          >
            <p className="da-label-small font-mono text-white">
              {streamOutput ? streamOutput : 'Log message ...'}
            </p>
          </div>
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
    </div>
  )
}
export default DaGenAI_Base
