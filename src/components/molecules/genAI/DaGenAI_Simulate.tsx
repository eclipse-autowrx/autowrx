import { useState, useEffect, useRef } from 'react'
import useWizardGenAIStore from '@/stores/genAIWizardStore'
import DaGenAI_SimulateDashboard from './DaGenAI_SimulateDashboard'

type DaGenAI_SimulateProps = {}

const DaGenAI_Simulate = ({}: DaGenAI_SimulateProps) => {
  const [activeTab, setActiveTab] = useState<'analyze' | 'simulate'>('analyze')
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const { registerWizardSimulationRun } = useWizardGenAIStore()

  const triggerSimulation = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage('run-simulate', '*')
    }
  }

  useEffect(() => {
    registerWizardSimulationRun(triggerSimulation)
  }, [])

  return (
    <div className="flex h-full w-full flex-col py-2  ">
      <DaGenAI_SimulateDashboard />
    </div>
  )
}

export default DaGenAI_Simulate
