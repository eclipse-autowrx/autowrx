import { useEffect, useRef, useState } from 'react'
import LoadingLineAnimation from '../../components/molecules/genAI/DaGenAI_LoadingLineAnimation.tsx'
import { cn } from '@/lib/utils.ts'
import CodeEditor from '../../components/molecules/CodeEditor.tsx'
import useWizardGenAIStore from '@/pages/wizard/useGenAIWizardStore.ts'
import DaGenAI_WizardBase from './DaGenAI_WizardBase.tsx'
import DaGenAI_WizardPrototypeSignal from './DaGenAI_WizardPrototypeSignal.tsx'
import DaText from '@/components/atoms/DaText.tsx'
import { TbMaximize, TbMinimize } from 'react-icons/tb'

type DaGenAI_WizardProps = {
  onCodeGenerated?: (code: string) => void
  pythonCode?: string
}

const DaGenAI_Wizard = ({ onCodeGenerated }: DaGenAI_WizardProps) => {
  const { wizardPrototype, setPrototypeData, codeGenerating } =
    useWizardGenAIStore()
  const [isExpandCodeTab, setIsExpandCodeTab] = useState(false)

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
            <div className="font-semibold text-da-gray-dark border-b py-[9.51px] px-3">
              Studio
            </div>
            {wizardPrototype.code ? (
              <div className="flex flex-col mt-1 w-full h-full rounded-md overflow-hidden">
                {wizardPrototype && wizardPrototype.model_id && (
                  <div
                    className={cn(
                      'h-1/2 border-b',
                      isExpandCodeTab && 'hidden',
                    )}
                  >
                    <DaGenAI_WizardPrototypeSignal
                      modelId={wizardPrototype.model_id}
                      code={wizardPrototype.code || ''}
                    />
                  </div>
                )}
                <div className={isExpandCodeTab ? 'h-full' : 'h-1/2 mt-1'}>
                  <div className="flex mx-4 py-1 justify-between items-center">
                    <DaText
                      variant="small-bold"
                      className="text-da-primary-500 mx-4 pb-1"
                    >
                      Code
                    </DaText>
                    <div onClick={() => setIsExpandCodeTab(!isExpandCodeTab)}>
                      {isExpandCodeTab ? (
                        <TbMinimize className="size-4 text-da-gray-medium cursor-pointer hover:text-da-primary-500" />
                      ) : (
                        <TbMaximize className="size-4 text-da-gray-medium cursor-pointer hover:text-da-primary-500" />
                      )}
                    </div>
                  </div>
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
