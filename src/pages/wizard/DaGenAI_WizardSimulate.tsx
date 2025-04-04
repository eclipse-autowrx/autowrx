import DaGenAI_WizardSimulateDashboard from './DaGenAI_WizardSimulateDashboard'
import DaGenAI_WizardRuntimeControl from './DaGenAI_WizardRuntimeControl'
import useWizardGenAIStore from '@/pages/wizard/useGenAIWizardStore'
import { useEffect } from 'react'

type DaGenAI_SimulateProps = {}

const DaGenAI_WizardSimulate = ({}: DaGenAI_SimulateProps) => {
  const { wizardActiveRtId, allWizardRuntimes } = useWizardGenAIStore()

  // useEffect(() => {
  //   console.log(
  //     'Runtime at wizard change at dashboard simulate',
  //     wizardActiveRtId,
  //   )
  //   console.log(
  //     'All wizard runtimes at wizard change at dashboard simulate',
  //     allWizardRuntimes,
  //   )
  // }, [wizardActiveRtId, allWizardRuntimes])

  return (
    <div className="flex h-full w-full flex-col p-2">
      <DaGenAI_WizardSimulateDashboard key={wizardActiveRtId} />
      <DaGenAI_WizardRuntimeControl />
    </div>
  )
}

export default DaGenAI_WizardSimulate
