import { useState, useEffect } from 'react'
import { DaButton } from '@/components/atoms/DaButton'
import { createNewWidgetByProtoPilot } from '@/services/webStudio.service'
import DaGenAI_ResponseDisplay from './DaGenAI_ResponseDisplay'
import LoadingLineAnimation from './DaGenAI_LoadingLineAnimation'
import useSelfProfileQuery from '@/hooks/useSelfProfile.ts'
import DaGenAI_Base from './DaGenAI_Base.tsx'
import DaSectionTitle from '@/components/atoms/DaSectionTitle.tsx'

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
  const [loading, setLoading] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [genCode, setGenCode] = useState('')
  const [iframeSrc, setIframeSrc] = useState('')
  const [isPreviewWidget, setIsPreviewWidget] = useState(false)

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
  }

  useEffect(() => {
    if (!loading && isFinished) {
      handleCreateWidget()
    }
  }, [loading, isFinished, genCode])

  return (
    <div className="flex h-full w-full">
      <DaGenAI_Base
        type="GenAI_Widget"
        buttonText="Generate Widget"
        placeholderText="Enter your prompt to generate an widget"
        onCodeGenerated={(code) => {
          setGenCode(code)
        }}
        onFinishChange={setIsFinished}
        onLoadingChange={setLoading}
        className="w-1/2"
      />
      <div className="flex h-full w-1/2 flex-col pl-2">
        <div className="mb-2 flex select-none items-center justify-between">
          <DaSectionTitle number={3} title="Preview Widget" />
          <DaButton
            variant="plain"
            size="sm"
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
              className="h-full w-full"
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
