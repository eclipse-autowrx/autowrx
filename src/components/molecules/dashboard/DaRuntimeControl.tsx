import { DaButton } from '@/components/atoms/DaButton'
import { FC } from 'react'

const DaRuntimeControl: FC = ({}) => {
  return (
    <div className="h-full w-16 text-da-gray-light py-2 px-1 flex flex-col justify-center bg-da-gray-dark">
      <div className="p-2 da-label-regular-bold da-clickable hover:bg-da-gray-medium flex items-center justify-center rounded">
        Run
      </div>

      <div className="grow"></div>
    </div>
  )
}

export default DaRuntimeControl
