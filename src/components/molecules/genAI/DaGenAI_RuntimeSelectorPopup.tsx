// RuntimeSelectorPopup.tsx
import React from 'react'
import { TbCircleFilled, TbCheck } from 'react-icons/tb'
import DaPopup from '@/components/atoms/DaPopup'
import DaText from '@/components/atoms/DaText'
import { cn } from '@/lib/utils'
import useWizardGenAIStore from '@/pages/wizard/useGenAIWizardStore'

interface RuntimeSelectorPopupProps {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const DaGenAI_RuntimeSelectorPopup = ({
  open,
  setOpen,
}: RuntimeSelectorPopupProps) => {
  const {
    allWizardRuntimes,
    wizardActiveRtId,
    setWizardActiveRtId,
    executeWizardSimulationStop,
  } = useWizardGenAIStore()

  return (
    <DaPopup
      state={[open, setOpen]}
      onClose={() => setOpen(false)}
      trigger={<span></span>}
      className="flex flex-col w-[40vw] lg:w-[30vw] min-w-[600px] max-w-[500px] h-full !max-h-[300px] p-4 bg-da-white"
    >
      <DaText variant="sub-title">Select Runtime Environment</DaText>
      <div className="flex flex-col h-full space-y-1 mt-2 overflow-y-auto">
        {allWizardRuntimes?.map((runtime) => (
          <div
            key={runtime.kit_id}
            className={cn(
              'flex cursor-pointer items-center justify-between rounded hover:bg-da-gray-light',
              wizardActiveRtId === runtime.kit_id && 'bg-gray-100',
            )}
            onClick={() => {
              executeWizardSimulationStop()
              setWizardActiveRtId(runtime.kit_id)
              setOpen(false)
            }}
          >
            <div className="text-[20px] flex items-center text-sm px-2 py-1">
              <TbCircleFilled
                className={`size-3 mr-2 ${
                  runtime.is_online ? 'text-green-500' : 'text-yellow-500'
                }`}
              />
              {runtime.name}
            </div>
            {wizardActiveRtId === runtime.kit_id && (
              <TbCheck className="size-5 text-da-primary-500 mr-2" />
            )}
          </div>
        ))}
      </div>
    </DaPopup>
  )
}

export default DaGenAI_RuntimeSelectorPopup
