import { useEffect, useRef, useState } from 'react'
import { DaButton } from '@/components/atoms/DaButton'
import { TbCode } from 'react-icons/tb'
import LoadingLineAnimation from './DaGenAI_LoadingLineAnimation.tsx'
import DaGenAI_ResponseDisplay from './DaGenAI_ResponseDisplay.tsx'
import DaSectionTitle from '@/components/atoms/DaSectionTitle.tsx'
import DaGenAI_Base from './DaGenAI_Base.tsx'
import { cn } from '@/lib/utils.ts'
import { DaImage } from '@/components/atoms/DaImage.tsx'

type DaGenAI_WizardProps = {
  onCodeChanged?: (code: string) => void
  onCodeGenerated?: (code: string) => void
  pythonCode?: string
}

const DaGenAI_Wizard = ({
  onCodeChanged,
  onCodeGenerated,
}: DaGenAI_WizardProps) => {
  const [loading, setLoading] = useState<boolean>(false)
  const [genCode, setGenCode] = useState<string>('')
  const [isFinished, setIsFinished] = useState<boolean>(false)

  return (
    <div className="flex h-full w-full rounded">
      <DaGenAI_Base
        type="GenAI_Python"
        buttonText="Generate SDV App"
        placeholderText="Please desribe your vehicle application in human readable language"
        onCodeGenerated={(code) => {
          setGenCode(code)
          if (onCodeGenerated) {
            onCodeGenerated(code)
          }
        }}
        onFinishChange={setIsFinished}
        onLoadingChange={setLoading}
        className="w-1/2"
        isWizard={true}
      />
      <div className="flex h-full w-1/2 flex-1 flex-col pl-2 pt-3">
        {/* <div
          className={cn(
            'scroll-gray mt-2 flex h-full max-h-[380px] w-full overflow-y-auto overflow-x-hidden',
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
        </div> */}
        <DaImage
          src="/imgs/default_car.png"
          alt="Prototype Wizard"
          className="h-full w-full object-contain"
        />
      </div>
    </div>
  )
}

export default DaGenAI_Wizard
