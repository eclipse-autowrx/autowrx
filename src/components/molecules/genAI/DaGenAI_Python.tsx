import { useEffect, useState } from 'react'
import { DaInput } from '@/components/atoms/DaInput'
import { DaButton } from '@/components/atoms/DaButton'
import { AddOn } from '@/types/addon.type'
import { TbCode } from 'react-icons/tb'
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

type DaGenAI_PythonProps = {
  onCodeChanged?: (code: string) => void
  pythonCode?: string
}

const DaGenAI_Python = ({ onCodeChanged }: DaGenAI_PythonProps) => {
  const [inputPrompt, setInputPrompt] = useState<string>('')
  const [selectedAddOn, setSelectedAddOn] = useState<AddOn | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [genCode, setGenCode] = useState<string>('')
  const [isFinished, setIsFinished] = useState<boolean>(false)
  const { data: marketplaceAddOns } = useListMarketplaceAddOns('GenAI_Python')
  const [canUseGenAI] = usePermissionHook([PERMISSIONS.USE_GEN_AI])

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

  const genPythonCode = async () => {
    if (!selectedAddOn) return
    setGenCode('')
    setLoading(true)
    setIsFinished(false)
    try {
      let response
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
    }
  }

  return (
    <div className="flex h-full w-full rounded">
      <div className="flex h-full w-[50%] flex-col border-r border-da-gray-light pr-2 pt-3">
        <div>
          <div className="flex select-none">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-da-gray-light p-2 text-xs font-bold">
              1
            </div>
            <div className="ml-1 flex font-medium text-gray-600">Prompting</div>
          </div>
          <div className="mb-4 mt-1 flex h-fit w-full">
            <DaTextarea
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              rows={6}
              placeholder="Ask AI to generate code based on this prompt..."
              className="w-full"
            />
          </div>
        </div>
        <div className="mt-2 flex select-none">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-da-gray-light p-2 text-xs font-bold">
            2
          </div>
          <div className="ml-1 flex font-medium text-gray-600">
            Select Generator
          </div>
        </div>

        <DaGeneratorSelector
          builtInAddOns={builtInAddOns}
          marketplaceAddOns={
            marketplaceAddOns ? (canUseGenAI ? marketplaceAddOns : []) : []
          }
          onSelectedGeneratorChange={setSelectedAddOn}
        />

        {!inputPrompt && (
          <div className="mt-auto flex w-full select-none justify-center text-gray-400">
            You need to enter prompt and select generator
          </div>
        )}
        <DaButton
          variant="solid"
          disabled={!inputPrompt}
          className={`mt-auto !h-8 w-full ${!inputPrompt ? '!mt-2' : 'mt-auto'}`}
          onClick={genPythonCode}
        >
          <BsStars
            className={`mb-0.5 mr-1 inline-block ${loading ? 'animate-pulse' : ''}`}
          />
          {!loading && <div>Generate</div>}
        </DaButton>
      </div>
      <div className="flex h-full w-1/2 flex-col pl-2 pt-3">
        <div className="mb-2 flex select-none">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-da-gray-light p-2 text-xs font-bold">
            3
          </div>
          <div className="ml-1 flex font-medium text-gray-600">
            Preview Code
          </div>
        </div>
        <div className="scroll-gray flex h-full max-h-[380px] w-full overflow-y-auto overflow-x-hidden">
          {genCode ? (
            <DaGenAI_ResponseDisplay code={genCode} language={'python'} />
          ) : (
            <LoadingLineAnimation
              loading={loading}
              content={"There's no code here"}
            />
          )}
        </div>
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
      </div>
    </div>
  )
}

export default DaGenAI_Python
