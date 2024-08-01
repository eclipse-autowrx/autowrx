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

type DaGenAI_DashboardProps = {
  onCodeChanged?: (code: string) => void
  pythonCode?: string
}

const DaGenAI_Dashboard = ({
  onCodeChanged,
  pythonCode,
}: DaGenAI_DashboardProps) => {
  const [inputPrompt, setInputPrompt] = useState<string>('')
  const [selectedAddOn, setSelectedAddOn] = useState<AddOn | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [genCode, setGenCode] = useState<string>('')
  const [isFinished, setIsFinished] = useState<boolean>(false)
  const { data: marketplaceAddOns } =
    useListMarketplaceAddOns('GenAI_Dashboard')
  const [canUseGenAI] = usePermissionHook([PERMISSIONS.USE_GEN_AI])

  useEffect(() => {
    console.log('Permission to use GenAI: ', canUseGenAI)
  }, [canUseGenAI])

  const { data: user } = useSelfProfileQuery()
  const access = useAuthStore((state) => state.access)

  const builtInAddOns =
    config.genAI && config.genAI.dashboard && config.genAI.dashboard.length > 0
      ? config.genAI.dashboard.map((addOn: any) => ({
          ...addOn,
          customPayload: addOn.customPayload(
            inputPrompt + 'With the sdv app python code: ' + pythonCode
              ? pythonCode
              : '',
          ), // Append the customPayload with the inputPrompt
        }))
      : []

  const genDashboardCode = async () => {
    if (!selectedAddOn) return

    setLoading(true)
    setIsFinished(false)
    try {
      let response
      if (selectedAddOn.id.includes(config.instance)) {
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
        addLog({
          name: `User ${user?.name} generated dashboard code`,
          description: `User ${user?.name} with id ${user?.id} generated python code with ${selectedAddOn.name}`,
          create_by: user?.id!,
          type: 'gen-dashboard',
          ref_id: selectedAddOn.id,
          ref_type: 'genai',
        })
      }
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
    <div className="flex w-full h-full rounded">
      <div className="flex flex-col w-[50%] h-full pr-2 pt-3 border-r border-da-gray-light">
        <div>
          <div className="flex select-none">
            <div className="flex w-5 h-5 items-center justify-center font-bold text-xs rounded p-2 bg-da-gray-light ">
              1
            </div>
            <div className="flex ml-1 text-gray-600 font-medium">Prompting</div>
          </div>
          <div className="flex mt-1 mb-4 w-full h-fit">
            <DaTextarea
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              rows={6}
              placeholder="Ask AI to generate code based on this prompt..."
              className="w-full"
            />
          </div>
        </div>
        <div className="flex mt-2 select-none">
          <div className="flex w-5 h-5 items-center justify-center font-bold text-xs rounded p-2 bg-da-gray-light ">
            2
          </div>
          <div className="flex ml-1 text-gray-600 font-medium">
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
          <div className="flex w-full mt-auto justify-center text-gray-400 select-none">
            You need to enter prompt and select generator
          </div>
        )}
        <DaButton
          variant="solid"
          disabled={!inputPrompt}
          className={`!h-8 w-full mt-auto ${!inputPrompt ? '!mt-2' : 'mt-auto'}`}
          onClick={genDashboardCode}
        >
          <BsStars
            className={`inline-block mr-1 mb-0.5 ${loading ? 'animate-pulse' : ''}`}
          />
          {!loading && <div>Generate</div>}
        </DaButton>
      </div>
      <div className="flex flex-col w-1/2 h-full pt-3 pl-2">
        <div className="flex mb-2 select-none">
          <div className="flex w-5 h-5 items-center justify-center font-bold text-xs rounded p-2 bg-da-gray-light ">
            3
          </div>
          <div className="flex ml-1 text-gray-600 font-medium">
            Preview Code
          </div>
        </div>
        <div className="flex w-full h-full overflow-y-auto overflow-x-hidden scroll-gray max-h-[380px]">
          {genCode ? (
            <DaGenAI_ResponseDisplay code={genCode} language={'python'} />
          ) : (
            <LoadingLineAnimation
              loading={loading}
              content={"There's no code here"}
            />
          )}
        </div>
        <div className="flex flex-col w-full mt-auto pt-3 select-none">
          <DaButton
            variant="outline-nocolor"
            className="!h-8 w-full"
            onClick={() => {
              onCodeChanged ? onCodeChanged(genCode) : null
            }}
            disabled={!(genCode && genCode.length > 0) || !isFinished}
          >
            <TbCode className="w-4 h-4 mr-1.5" /> Add new generated code
          </DaButton>
        </div>
      </div>
    </div>
  )
}

export default DaGenAI_Dashboard
