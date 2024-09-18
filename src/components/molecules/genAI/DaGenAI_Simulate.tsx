import DaGenAI_SimulateDashboard from './DaGenAI_SimulateDashboard'
import DaGenAI_RuntimeControl from './DaGenAI_RuntimeControl'
import useWizardGenAIStore from '@/stores/genAIWizardStore'
import { useEffect } from 'react'

type DaGenAI_SimulateProps = {}

const DaGenAI_Simulate = ({}: DaGenAI_SimulateProps) => {
  const { wizardActiveRtId } = useWizardGenAIStore()

  useEffect(() => {
    console.log(
      'Runtime at wizard change at dashboard simulate',
      wizardActiveRtId,
    )
  }, [wizardActiveRtId])

  return (
    <div className="flex h-full w-full flex-col py-2 ">
      <DaGenAI_SimulateDashboard key={wizardActiveRtId} />
      <DaGenAI_RuntimeControl />
    </div>
  )
}

export default DaGenAI_Simulate
