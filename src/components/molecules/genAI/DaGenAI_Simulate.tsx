import { useState, useEffect } from 'react'
import DaGenAI_ResponseDisplay from './DaGenAI_ResponseDisplay'
import { cn } from '@/lib/utils'
import DaTabItem from '@/components/atoms/DaTabItem'
import { DaTextarea } from '@/components/atoms/DaTextarea'
import useWizardGenAIStore from '@/stores/genAIWizardStore'

type DaGenAI_SimulateProps = {}

const DaGenAI_Simulate = ({}: DaGenAI_SimulateProps) => {
  const [activeTab, setActiveTab] = useState<'analyze' | 'simulate'>('analyze')
  const { wizardPrompt, wizardGeneratedCode, wizardLog } = useWizardGenAIStore()

  useEffect(() => {
    console.log('DaGenAI_Simulate mounted')
    console.log('wizardPrompt:', wizardPrompt)
    console.log('wizardGeneratedCode:', wizardGeneratedCode)
    console.log('wizardLog:', wizardLog)
  }, [wizardGeneratedCode, wizardLog, wizardPrompt])

  return (
    <div className="flex h-full max-h-[calc(100%-30px)] w-full flex-col">
      <div className="flex">
        <DaTabItem
          onClick={() => setActiveTab('analyze')}
          active={activeTab === 'analyze'}
        >
          Analyze
        </DaTabItem>
        <DaTabItem
          onClick={() => setActiveTab('simulate')}
          active={activeTab === 'simulate'}
        >
          Simulate
        </DaTabItem>
      </div>
      <div className="flex h-full w-full">
        <div className="mb-4 mt-1 flex h-full w-full flex-col">
          <DaTextarea
            value={wizardPrompt}
            onChange={() => {}}
            rows={9}
            placeholder={wizardPrompt}
            className="pointer-events-none w-full"
            textareaClassName="resize-none"
          />
          <div
            className={cn(
              'mb-2 mt-4 flex h-full rounded-md bg-da-gray-dark p-3',
              0,
            )}
          >
            <p className="da-label-small font-mono text-white">{wizardLog}</p>
          </div>
        </div>
        <div
          className={cn(
            'scroll-gray ml-2 flex h-full w-full overflow-y-auto overflow-x-hidden border-l p-2 pb-1',
          )}
        >
          <DaGenAI_ResponseDisplay
            code={wizardGeneratedCode}
            language={'python'}
          />
        </div>
      </div>
    </div>
  )
}

export default DaGenAI_Simulate
