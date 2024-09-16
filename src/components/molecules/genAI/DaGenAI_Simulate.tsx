import DaGenAI_SimulateDashboard from './DaGenAI_SimulateDashboard'
import DaGenAI_RuntimeControl from './DaGenAI_RuntimeControl'

type DaGenAI_SimulateProps = {}

const DaGenAI_Simulate = ({}: DaGenAI_SimulateProps) => {
  return (
    <div className="flex h-full w-full flex-col py-2  ">
      <DaGenAI_SimulateDashboard />
      <DaGenAI_RuntimeControl />
    </div>
  )
}

export default DaGenAI_Simulate
