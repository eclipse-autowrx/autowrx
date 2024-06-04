import { FC } from 'react'
import DaDashboard from '../molecules/dashboard/DaDashboard'
import DaRuntimeControl from '../molecules/dashboard/DaRuntimeControl'

const PrototypeTabDashboard: FC = ({}) => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-slate-300">
      <div className="grow h-full">
        <DaDashboard />
      </div>
      <DaRuntimeControl />
    </div>
  )
}

export default PrototypeTabDashboard
