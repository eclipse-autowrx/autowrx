import { useEffect, useRef, useState } from 'react'
import LoadingLineAnimation from './DaGenAI_LoadingLineAnimation.tsx'
import DaGenAI_Base from './DaGenAI_Base.tsx'
import { cn } from '@/lib/utils.ts'
import CodeEditor from '../CodeEditor.tsx'
import useWizardGenAIStore from '@/stores/genAIWizardStore.ts'

type DaGenAI_WizardProps = {
  onCodeGenerated?: (code: string) => void
  pythonCode?: string
}

const DaGenAI_Wizard = ({ onCodeGenerated }: DaGenAI_WizardProps) => {
  const [loading, setLoading] = useState<boolean>(false)
  const [genCode, setGenCode] = useState<string>('')
  const [isFinished, setIsFinished] = useState<boolean>(false)
  const { prototypeData, setPrototypeData } = useWizardGenAIStore()

  return (
    <div className="flex h-full w-full rounded">
      <DaGenAI_Base
        type="GenAI_Python"
        buttonText="Generate SDV App"
        placeholderText="Please describe your vehicle application in human readable language"
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
      <div className="flex h-full w-1/2 flex-1 flex-col pb-2 pl-2">
        <div
          className={cn(
            'scroll-gray mt-2 flex h-full w-full overflow-y-auto overflow-x-hidden',
          )}
        >
          {genCode ? (
            // <DaGenAI_ResponseDisplay code={genCode} language={'python'} />
            <div className="flex w-full h-full rounded-md overflow-hidden border">
              <CodeEditor
                code={genCode}
                setCode={(code) => {
                  onCodeGenerated && onCodeGenerated(code)
                  setPrototypeData({ code })
                }}
                language="python"
                onBlur={() => {}}
                editable={true}
              />
            </div>
          ) : (
            <LoadingLineAnimation
              loading={loading}
              content={"There's no code here"}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default DaGenAI_Wizard
