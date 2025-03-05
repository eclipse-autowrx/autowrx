import React from 'react'
import DaGenAI_Widget from '../genAI/DaGenAI_Widget'
import { cn } from '@/lib/utils'

type DaWidgetConfigProps = {
  isWidgetGenAI?: boolean
  isCreateMyOwnWidget?: boolean
  optionsStr: string
  setWidgetUrl: React.Dispatch<React.SetStateAction<string>>
}

const DaWidgetSetup = ({
  isWidgetGenAI = false,
  optionsStr,
  setWidgetUrl,
}: DaWidgetConfigProps) => {
  return (
    <div
      className={cn(
        'flex w-full h-full flex-col pt-1 overflow-y-auto',
        !isWidgetGenAI && 'hidden',
      )}
    >
      <div className="flex items-center text-base text-md"></div>
      <div className="flex w-full h-full overflow-y-auto">
        <DaGenAI_Widget
          widgetConfig={optionsStr}
          outerSetiWidgetUrl={setWidgetUrl}
          onDashboardConfigChanged={() => {}}
          onClose={() => {}}
        />
      </div>
    </div>
  )
}

export default DaWidgetSetup
