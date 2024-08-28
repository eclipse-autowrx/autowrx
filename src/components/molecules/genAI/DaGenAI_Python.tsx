import { useEffect, useRef, useState } from 'react'
import { DaButton } from '@/components/atoms/DaButton'
import { AddOn } from '@/types/addon.type'
import { TbCode, TbMicrophone } from 'react-icons/tb'
import { BsStars } from 'react-icons/bs'
import LoadingLineAnimation from './DaGenAI_LoadingLineAnimation.tsx'
import DaGenAI_ResponseDisplay from './DaGenAI_ResponseDisplay.tsx'
import axios, { isAxiosError } from 'axios'
import { DaTextarea } from '@/components/atoms/DaTextarea'
import useListMarketplaceAddOns from '@/hooks/useListMarketplaceAddOns'
import DaGeneratorSelector from './DaGeneratorSelector.tsx.tsx'
import config from '@/configs/config.ts'
import usePermissionHook from '@/hooks/usePermissionHook.ts'
import { PERMISSIONS } from '@/data/permission.ts'
import useSelfProfileQuery from '@/hooks/useSelfProfile.ts'
import useAuthStore from '@/stores/authStore'
import { addLog } from '@/services/log.service'
import { toast } from 'react-toastify'
import clsx from 'clsx'
import default_generated_code from '@/data/default_generated_code.ts'
import DaSectionTitle from '@/components/atoms/DaSectionTitle.tsx'
import DaSpeechToText from './DaSpeechToText.tsx'

type DaGenAI_PythonProps = {
  onCodeChanged?: (code: string) => void
  onCodeGenerated?: (code: string) => void
  pythonCode?: string
  hideAddGeneratedCodeButton?: boolean
  codeDisplayClassName?: string
}

const DaGenAI_Python = ({
  onCodeChanged,
  onCodeGenerated,
  hideAddGeneratedCodeButton,
  codeDisplayClassName,
}: DaGenAI_PythonProps) => {
  const [inputPrompt, setInputPrompt] = useState<string>('')
  const [selectedAddOn, setSelectedAddOn] = useState<AddOn | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [genCode, setGenCode] = useState<string>('')
  const [isFinished, setIsFinished] = useState<boolean>(false)
  const { data: marketplaceAddOns } = useListMarketplaceAddOns('GenAI_Python')
  const [canUseGenAI] = usePermissionHook([PERMISSIONS.USE_GEN_AI])

  const [streamOutput, setStreamOutput] = useState<string>('')
  const timeouts = useRef<NodeJS.Timeout[]>([])

  useEffect(() => {}, [canUseGenAI])

  const { data: user } = useSelfProfileQuery()
  const access = useAuthStore((state) => state.access)

  const builtInAddOns: AddOn[] =
    config.genAI && config.genAI.sdvApp && config.genAI.sdvApp.length > 0
      ? config.genAI.sdvApp.map((addOn: any) => ({
          ...addOn,
          customPayload: addOn.customPayload(inputPrompt), // Append the customPayload with the inputPrompt
        }))
      : []

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

  const genPythonCode = async () => {
    if (!selectedAddOn) return
    setGenCode('')
    setLoading(true)
    setIsFinished(false)
    try {
      let response

      mockStreamOutput()
      if (selectedAddOn.isMock) {
        await new Promise((resolve) => setTimeout(resolve, 5000))
        setGenCode(default_generated_code)
        onCodeGenerated && onCodeGenerated(default_generated_code)
        return
      }

      if (selectedAddOn?.endpointUrl) {
        response = await axios.post(
          selectedAddOn.endpointUrl,
          {
            prompt: inputPrompt,
          },
          {
            headers: {
              Authorization: `Bearer ${access?.token}`,
            },
          },
        )
        setGenCode(response.data.payload.code)
        onCodeGenerated && onCodeGenerated(response.data.payload.code)
      } else {
        response = await axios.post(
          config.genAI.defaultEndpointUrl,
          {
            endpointURL: selectedAddOn.endpointUrl,
            inputPrompt: inputPrompt,
            systemMessage: selectedAddOn.samples || '',
          },
          {
            headers: {
              Authorization: `Bearer ${access?.token}`,
            },
          },
        )
        setGenCode(response.data)
        onCodeGenerated && onCodeGenerated(response.data)
      }

      addLog({
        name: `User ${user?.name} generated python code`,
        description: `User ${user?.name} with id ${user?.id} generated python code with ${selectedAddOn.name}`,
        create_by: user?.id!,
        type: 'gen-python',
        ref_id: selectedAddOn.id,
        ref_type: 'genai',
      })
    } catch (error) {
      timeouts.current.forEach((timeout) => clearTimeout(timeout))
      timeouts.current = []
      console.error('Error generating AI content:', error)
      if (isAxiosError(error)) {
        toast.error(
          error.response?.data?.message || 'Error generating AI content',
        )
      } else {
        toast.error('Error generating AI content')
      }
    } finally {
      setLoading(false)
      setIsFinished(true)
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

  return (
    <div className="flex h-full w-full rounded">
      <div className="flex h-full w-[50%] flex-col border-r border-da-gray-light pr-2 pt-3">
        <div className="flex w-full items-center justify-between">
          <DaSectionTitle number={1} title="Prompting" />
          <DaSpeechToText onRecognize={setInputPrompt} />
        </div>
        <div className="mb-4 mt-1 flex h-fit w-full">
          <DaTextarea
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            rows={9}
            placeholder="Ask AI to generate code based on this prompt..."
            className="w-full"
            textareaClassName="resize-none"
          />
        </div>

        <DaSectionTitle number={2} title="Select Generator" />

        <DaGeneratorSelector
          builtInAddOns={builtInAddOns}
          marketplaceAddOns={
            marketplaceAddOns ? (canUseGenAI ? marketplaceAddOns : []) : []
          }
          onSelectedGeneratorChange={setSelectedAddOn}
        />
        {streamOutput && (
          <div className="mt-2 flex h-10 items-center rounded-md bg-da-gray-dark px-4">
            <p className="da-label-small font-mono text-white">
              {streamOutput}
            </p>
          </div>
        )}

        {!inputPrompt && (
          <div className="mt-auto flex w-full select-none justify-center text-gray-400">
            You need to enter prompt and select generator
          </div>
        )}
        <DaButton
          variant="solid"
          disabled={!inputPrompt}
          className={`mt-auto !h-8 w-full ${!inputPrompt ? '!mt-1' : 'mt-auto'}`}
          onClick={genPythonCode}
        >
          <BsStars
            className={`mb-0.5 mr-1 inline-block ${loading ? 'animate-pulse' : ''}`}
          />
          {!loading && <div>Generate</div>}
        </DaButton>
      </div>
      <div className="flex h-full w-1/2 flex-col pl-2 pt-3">
        <DaSectionTitle number={3} title="Preview Code" />
        <div
          className={clsx(
            'scroll-gray mt-2 flex h-full max-h-[380px] w-full overflow-y-auto overflow-x-hidden',
            codeDisplayClassName,
          )}
        >
          {genCode ? (
            <DaGenAI_ResponseDisplay code={genCode} language={'python'} />
          ) : (
            <LoadingLineAnimation
              loading={loading}
              content={"There's no code here"}
            />
          )}
        </div>
        {!hideAddGeneratedCodeButton && (
          <div className="mt-auto flex w-full select-none flex-col pt-3">
            <DaButton
              variant="outline-nocolor"
              className="!h-8 w-full"
              onClick={() => {
                onCodeChanged ? onCodeChanged(genCode) : null
              }}
              disabled={!(genCode && genCode.length > 0) || !isFinished}
            >
              <TbCode className="mr-1.5 h-4 w-4" /> Add new generated code
            </DaButton>
          </div>
        )}
      </div>
    </div>
  )
}

export default DaGenAI_Python
