import { useState, useEffect, useRef } from 'react'
import { DaButton } from '@/components/atoms/DaButton'
import { createNewWidgetByProtoPilot } from '@/services/webStudio.service'
import { Model } from '@/types/model.type'
import { AddOn } from '@/types/addon.type'
import { BsStars } from 'react-icons/bs'
import { fetchMarketAddOns } from '@/services/widget.service'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { DaInput } from '@/components/atoms/DaInput'
import DaGenAI_ResponseDisplay from './DaGenAI_ResponseDisplay'
import LoadingLineAnimation from './DaGenAI_LoadingLineAnimation'
import DaGeneratorSelector from './DaGeneratorSelector.tsx'
import config from '@/configs/config.ts'
import useListMarketplaceAddOns from '@/hooks/useListMarketplaceAddOns'
import axios from 'axios'

interface DaGenAIWidgetProps {
  widgetConfig?: any
  onDashboardConfigChanged?: (config: any) => void
  onClose: () => void
  outerSetiWidgetUrl?: React.Dispatch<React.SetStateAction<string>>
  modalRef?: React.RefObject<HTMLDivElement>
}

const DaGenAIWidget = ({
  modalRef,
  outerSetiWidgetUrl,
}: DaGenAIWidgetProps) => {
  const { data: user } = useSelfProfileQuery()
  const [inputPrompt, setInputPrompt] = useState('')
  const [isValid, setIsValid] = useState(true)
  const [loading, setLoading] = useState(false)
  const [isFinished, setIsFinished] = useState(false)

  // State related to generated widget code
  const [genCode, setGenCode] = useState('')
  const [finalCode, setFinalCode] = useState('')
  const [iframeSrc, setIframeSrc] = useState('')
  const [selectedAddOn, setSelectedAddOn] = useState<AddOn | null>(null)
  const [isPreviewWidget, setIsPreviewWidget] = useState(false)

  const { data: marketplaceAddOns } = useListMarketplaceAddOns('GenAI_Widget')

  const builtInAddOns: AddOn[] =
    config.genAI && config.genAI.widget && config.genAI.widget.length > 0
      ? config.genAI.widget.map((addOn) => ({
          ...addOn,
          customPayload: addOn.customPayload(inputPrompt), // Append the customPayload with the inputPrompt
        }))
      : []

  // Check if the prompt is valid
  useEffect(() => {
    if (inputPrompt) {
      setIsValid(true)
    } else {
      setIsValid(false)
    }
  }, [inputPrompt])

  // Update the iframe source with the generated widget code
  useEffect(() => {
    // Update the iframe source whenever genCode changes
    if (genCode) {
      const htmlStartIndex = genCode.indexOf('<html')
      const htmlEndIndex = genCode.lastIndexOf('</html>') + 7 // 7 is the length of "</html>"
      let finalResult =
        htmlStartIndex !== -1 && htmlEndIndex > htmlStartIndex
          ? genCode.substring(htmlStartIndex, htmlEndIndex)
          : genCode
      const blob = new Blob([finalResult], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      setIframeSrc(url)
      // Clean up the blob URL after the component unmounts
      return () => {
        URL.revokeObjectURL(url)
      }
    }
  }, [genCode])

  const handleCreateWidget = async () => {
    const [linkUrl, linkStudio] = await createNewWidgetByProtoPilot(
      'ProtoPilot',
      user?.id || '',
      genCode,
    )
    outerSetiWidgetUrl && outerSetiWidgetUrl(linkUrl)
    // console.log("linkUrl: ", linkUrl);
    // console.log("linkStudio: ", linkStudio);
  }

  useEffect(() => {
    if (!loading && isFinished) {
      handleCreateWidget()
    }
  }, [loading, isFinished, genCode])

  const genWidget = async () => {
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
        setGenCode(response.data.code)
      }
    } catch (error) {
      console.error('Error generating AI content:', error)
    } finally {
      setLoading(false)
      setIsFinished(true)
    }
  }

  return (
    <div className="flex w-full h-full rounded min-h-[500px]">
      <div className="flex flex-col w-1/2 h-full border-r pr-2 border-gray-100">
        <div className="flex select-none items-center">
          <div className="flex w-5 h-5 items-center justify-center font-bold text-xs rounded p-2 bg-gray-100 ">
            1
          </div>
          <div className="flex ml-1 text-gray-600 font-bold">Prompting</div>
        </div>
        <div className="flex mt-3 w-full mb-4" ref={modalRef}>
          <DaInput
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            inputClassName=""
            className="w-full"
            placeholder="Ask AI to generate a widget based on this prompt..."
          ></DaInput>
        </div>
        <div className="flex flex-col select-none mb-2 border-gray-100 pt-2">
          <div className="flex w-full items-center">
            <div className="flex w-5 h-5 items-center justify-center font-bold text-xs rounded p-2 bg-gray-100">
              2
            </div>
            <div className="flex ml-1 mb-1 text-gray-600 font-bold">
              {' '}
              Select Generator
            </div>
          </div>

          <DaGeneratorSelector
            builtInAddOns={builtInAddOns}
            marketplaceAddOns={marketplaceAddOns ? marketplaceAddOns : []}
            onSelectedGeneratorChange={setSelectedAddOn}
          />
        </div>
        <div className="flex flex-grow"></div>
        <div className="flex flex-col relative w-full h-full justify-end">
          <DaButton
            variant="solid"
            className={`flex w-full mt-1 h-8 ${!isValid ? 'opacity-50 pointer-events-none' : ''} `}
            onClick={() => {
              genWidget()
            }}
          >
            <BsStars
              className={`inline-block mr-1 mb-0.5 ${loading ? 'animate-pulse' : ''}`}
            />
            {!loading && <div>Generate</div>}
          </DaButton>
        </div>
      </div>
      <div className="flex flex-col w-1/2 h-full pl-2">
        <div className="flex select-none mb-2 items-center justify-between">
          <div className="flex items-center">
            <div className="flex w-5 h-5 items-center justify-center font-bold text-xs rounded p-2 bg-gray-100 ">
              3
            </div>
            <div className="flex ml-1 text-gray-600 font-bold">
              {' '}
              Preview Widget
            </div>
          </div>
          <DaButton
            variant="plain"
            onClick={() => {
              setIsPreviewWidget(!isPreviewWidget)
            }}
            className="bg-transparent !shadow-none"
          >
            {isPreviewWidget ? 'View code' : 'Preview widget'}
          </DaButton>
        </div>

        {genCode ? (
          isPreviewWidget ? (
            <iframe
              src={iframeSrc}
              title="Widget Preview"
              className="w-full h-full"
              sandbox="allow-scripts allow-same-origin"
            ></iframe>
          ) : (
            <DaGenAI_ResponseDisplay code={genCode} language="htmlbars" />
          )
        ) : (
          <LoadingLineAnimation
            loading={loading}
            content={"There's no widget here"}
          />
        )}
      </div>
    </div>
  )
}

export default DaGenAIWidget
