import { FC, useState } from 'react'
import DaDashboard from '../molecules/dashboard/DaDashboard'
import DaRuntimeControl from '../molecules/dashboard/DaRuntimeControl'



const PrototypeTabDashboard: FC = ({}) => {
  const [isFullscreen, setIsFullScreen] = useState(false)

  return (
    <div className={`${isFullscreen?'w-screen h-screen fixed top-0 bottom-0 left-0 right-0':'w-full h-full'}`}>
      <DaDashboard setFullScreenMode={setIsFullScreen}/>
    </div>
  )
}

export default PrototypeTabDashboard
