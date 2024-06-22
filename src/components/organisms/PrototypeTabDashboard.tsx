import { FC } from 'react'
import DaDashboard from '../molecules/dashboard/DaDashboard'
import DaRuntimeControl from '../molecules/dashboard/DaRuntimeControl'

const PrototypeTabDashboard: FC = ({}) => {
  return (
    <div className="relative w-full h-full flex items-center justify-center bg-slate-300">
      <div className="absolute left-0 bottom-0 top-0 right-16 grow h-full z-0">
        <DaDashboard/>
      </div>
      <DaRuntimeControl/>
    </div>
  )
}

export default PrototypeTabDashboard