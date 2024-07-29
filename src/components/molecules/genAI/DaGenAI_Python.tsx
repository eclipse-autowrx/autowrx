import { useEffect, useState } from 'react'
import { DaInput } from '@/components/atoms/DaInput'
import { DaButton } from '@/components/atoms/DaButton'
import _ from 'lodash'
import { AddOn } from '@/types/addon.type'
import { TbCode } from 'react-icons/tb'
import { BsStars } from 'react-icons/bs'
import LoadingLineAnimation from './DaGenAI_LoadingLineAnimation.tsx'
import DaGenAI_ResponseDisplay from './DaGenAI_ResponseDisplay.tsx'
import axios from 'axios'
import { DaTextarea } from '@/components/atoms/DaTextarea'
import useListMarketplaceAddOns from '@/hooks/useListMarketplaceAddOns'
import DaGeneratorSelector from './DaGeneratorSelector.tsx.tsx'
import config from '@/configs/config.ts'

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

  const builtInAddOns: AddOn[] =
    config.genAI && config.genAI.sdvApp && config.genAI.sdvApp.length > 0
      ? config.genAI.sdvApp.map((addOn) => ({
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
      if (selectedAddOn.id.includes(config.instance)) {
        response = await axios.post(selectedAddOn.endpointUrl, {
          prompt: inputPrompt,
        })
        setGenCode(response.data.payload.code)
      } else {
        response = await axios.post(config.genAI.defaultEndpointUrl, {
          endpointURL: selectedAddOn.endpointUrl,
          inputPrompt: inputPrompt,
          systemMessage: selectedAddOn.samples || '',
        })
        setGenCode(response.data)
      }
    } catch (error) {
      console.error('Error generating AI content:', error)
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
          <div className="flex mt-2 mb-4 w-full h-fit">
            <DaTextarea
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              rows={4}
              placeholder="Ask AI to generate code based on this prompt..."
              className="w-full"
            ></DaTextarea>
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
          marketplaceAddOns={marketplaceAddOns ? marketplaceAddOns : []}
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
          onClick={genPythonCode}
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

export default DaGenAI_Python
