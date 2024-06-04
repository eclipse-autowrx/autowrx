import { useEffect, useState } from 'react'
import { DaInput } from '@/components/atoms/DaInput'
import { DaButton } from '@/components/atoms/DaButton'
import _ from 'lodash'
import { AddOn } from '@/types/addon.type'
import { TbCode } from 'react-icons/tb'
import { BsStars } from 'react-icons/bs'
import LoadingLineAnimation from './DaGenAI_LoadingLineAnimation'
import DaGenAI_ResponseDisplay from './DaGenAI_ResponseDisplay'
import axios from 'axios'
import { DaTextarea } from '@/components/atoms/DaTextarea'

type GenAICodeProps = {
  onCodeChanged?: (code: string) => void
}

const DaGenAI_Python = ({ onCodeChanged }: GenAICodeProps) => {
  const [inputPrompt, setInputPrompt] = useState<string>('')
  const [selectedAddOn, setSelectedAddOn] = useState<AddOn | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [genCode, setGenCode] = useState<string>('')
  const [isFinished, setIsFinished] = useState<boolean>(false)

  const genPythonCode = async () => {
    setLoading(true)
    setIsFinished(false)
    try {
      const response = await axios.post(
        'https://backend-core-etas.digital.auto/v2/genai',
        {
          prompt: inputPrompt,
        },
      )
      setGenCode(response.data.payload.code)
    } catch (error) {
      console.error('Error generating AI content:', error)
    } finally {
      setLoading(false)
      setIsFinished(true)
    }
  }

  return (
    <div className="flex w-full h-full rounded">
      <div className="flex flex-col w-[50%] h-full pr-2 pt-3 border-r border-gray-100">
        <div>
          <div className="flex select-none">
            <div className="flex w-5 h-5 items-center justify-center font-bold text-xs rounded p-2 bg-gray-100 ">
              1
            </div>
            <div className="flex ml-1 text-gray-600 font-medium">Prompting</div>
          </div>
          <div className="flex mt-2 mb-4 w-full h-fit">
            <DaTextarea
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Ask AI to generate code based on this prompt..."
              className="w-full"
            ></DaTextarea>
          </div>
        </div>
        <div className="flex mt-2 select-none">
          <div className="flex w-5 h-5 items-center justify-center font-bold text-xs rounded p-2 bg-gray-100 ">
            2
          </div>
          <div className="flex ml-1 text-gray-600 font-medium">
            Select Generator
          </div>
        </div>
        <div className="flex my-2 px-2 h-8 bg-gray-100 items-center rounded border select-none">
          ETAS SDV GenAI
        </div>

        {/* <GeneratorSelector generatorList={marketplaceAddOns} onSelectedGeneratorChange={setSelectedAddOn} /> */}

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
          <div className="flex w-5 h-5 items-center justify-center font-bold text-xs rounded p-2 bg-gray-100 ">
            3
          </div>
          <div className="flex ml-1 text-gray-600 font-medium">
            Preview Code
          </div>
        </div>
        <div className="flex w-full h-full overflow-y-auto overflow-x-hidden scroll-gray max-h-[350px]">
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
