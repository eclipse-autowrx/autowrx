import { FC, useState } from 'react'
import DaDashboard from '../molecules/dashboard/DaDashboard'
import DaRuntimeControl from '../molecules/dashboard/DaRuntimeControl'



const PrototypeTabDashboard: FC = ({}) => {
  const [isFullscreen, setIsFullScreen] = useState(false)

  return (
    <div className={`${isFullscreen?'w-screen h-screen fixed top-0 bottom-0 left-0 right-0':'w-full h-full'}`}>
      <div className="relative w-full h-full flex items-center justify-center bg-slate-300">
        <div className="absolute left-0 bottom-0 top-0 right-16 grow h-full z-0">
          <DaDashboard setFullScreenMode={setIsFullScreen}/>
        </div>
        <DaRuntimeControl />
      </div>
    </div>
  )
}

export default PrototypeTabDashboard
