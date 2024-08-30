import { useState, useEffect } from 'react'
import DaGenAI_ResponseDisplay from './DaGenAI_ResponseDisplay'
import { cn } from '@/lib/utils'
import DaTabItem from '@/components/atoms/DaTabItem'
import { DaTextarea } from '@/components/atoms/DaTextarea'
import useWizardGenAIStore from '@/stores/genAIWizardStore'
import { DaButton } from '@/components/atoms/DaButton'
import { TbPlayerPlay, TbPlayerPlayFilled } from 'react-icons/tb'

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
    <div className="flex h-full w-full flex-col py-2">
      <div className="relative flex h-full w-full">
        <iframe
          src="http://127.0.0.1:5501/3DCar.html"
          className="h-full w-full rounded-lg"
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        ></iframe>
      </div>
    </div>
  )
}

export default DaGenAI_Simulate
