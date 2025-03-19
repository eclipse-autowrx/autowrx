import { useEffect, useRef, useState } from 'react'
import LoadingLineAnimation from '../../components/molecules/genAI/DaGenAI_LoadingLineAnimation.tsx'
import { cn } from '@/lib/utils.ts'
import CodeEditor from '../../components/molecules/CodeEditor.tsx'
import useWizardGenAIStore from '@/pages/wizard/useGenAIWizardStore.ts'
import DaGenAI_WizardBase from './DaGenAI_WizardBase.tsx'

type DaGenAI_WizardProps = {
  onCodeGenerated?: (code: string) => void
  pythonCode?: string
}

const DaGenAI_Wizard = ({ onCodeGenerated }: DaGenAI_WizardProps) => {
  const { wizardPrototype, setPrototypeData, codeGenerating } =
    useWizardGenAIStore()

  return (
    <div className="flex h-full w-full rounded bg-slate-200">
      <div className="flex w-full h-full space-x-2 p-2">
        <DaGenAI_WizardBase
          type="GenAI_Python"
          onCodeGenerated={(code) => {
            onCodeGenerated && onCodeGenerated(code)
            setPrototypeData({ code })
          }}
          className="w-1/2 bg-white rounded-lg"
        />

        <div className="flex h-full w-1/2 flex-1 flex-col">
          <div
            className={cn(
              'flex flex-col bg-white h-full w-full overflow-y-auto scroll-gray overflow-x-hidden border rounded-lg',
            )}
          >
            <div className="font-semibold text-da-gray-dark border-b py-[9.51px] mb-1 px-3">
              Studio
            </div>
            {wizardPrototype.code ? (
              <div className="flex w-full h-full rounded-md overflow-hidden">
                <CodeEditor
                  code={wizardPrototype.code || ''}
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
                loading={codeGenerating}
                content={"There's no code here"}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DaGenAI_Wizard
