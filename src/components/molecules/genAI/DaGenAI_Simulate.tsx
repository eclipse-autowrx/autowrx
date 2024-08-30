import { useState, useEffect, useRef } from 'react'
import useWizardGenAIStore from '@/stores/genAIWizardStore'

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
    <div className="flex h-full w-full flex-col py-2">
      <div className="relative flex h-full w-full">
        <iframe
          ref={iframeRef}
          src="http://127.0.0.1:5501/3DCar.html"
          className="h-full w-full rounded-lg"
          title="3D Simulation"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        ></iframe>
      </div>
    </div>
  )
}

export default DaGenAI_Simulate
