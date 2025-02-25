import DaGenAI_WizardSimulateDashboard from './DaGenAI_WizardSimulateDashboard'
import DaGenAI_WizardRuntimeControl from './DaGenAI_WizardRuntimeControl'
import useWizardGenAIStore from '@/pages/wizard/useGenAIWizardStore'
import { useEffect } from 'react'

type DaGenAI_SimulateProps = {}

const DaGenAI_WizardSimulate = ({}: DaGenAI_SimulateProps) => {
  const { wizardActiveRtId } = useWizardGenAIStore()

  useEffect(() => {
    console.log(
      'Runtime at wizard change at dashboard simulate',
      wizardActiveRtId,
    )
  }, [wizardActiveRtId])

  return (
    <div className="flex h-full w-full flex-col py-2 px-4">
      <DaGenAI_WizardSimulateDashboard key={wizardActiveRtId} />
      <DaGenAI_WizardRuntimeControl />
    </div>
  )
}

export default DaGenAI_WizardSimulate
