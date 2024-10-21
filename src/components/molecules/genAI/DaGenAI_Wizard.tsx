import { useEffect, useRef, useState } from 'react'
import LoadingLineAnimation from './DaGenAI_LoadingLineAnimation.tsx'
import { cn } from '@/lib/utils.ts'
import CodeEditor from '../CodeEditor.tsx'
import useWizardGenAIStore from '@/stores/genAIWizardStore.ts'
import DaGenAI_WizardBase from './DaGenAI_WizardBase.tsx'

type DaGenAI_WizardProps = {
  onCodeGenerated?: (code: string) => void
  pythonCode?: string
}

const DaGenAI_Wizard = ({ onCodeGenerated }: DaGenAI_WizardProps) => {
  const [loading, setLoading] = useState<boolean>(false)
  const { wizardPrototype, setPrototypeData } = useWizardGenAIStore()

  return (
    <div className="flex h-full w-full rounded">
      <DaGenAI_WizardBase
        type="GenAI_Python"
        onCodeGenerated={(code) => {
          onCodeGenerated && onCodeGenerated(code)
          setPrototypeData({ code })
        }}
        onLoadingChange={(loading) => setLoading(loading)}
        className="w-1/2"
      />

      <div className="flex h-full w-1/2 flex-1 flex-col pb-2 mr-4">
        <div
          className={cn(
            'scroll-gray mt-2 flex h-full w-full overflow-y-auto overflow-x-hidden',
          )}
        >
          {wizardPrototype.code ? (
            <div className="flex w-full h-full rounded-md overflow-hidden border">
              <CodeEditor
                code={wizardPrototype.code || ''} // Change here
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
