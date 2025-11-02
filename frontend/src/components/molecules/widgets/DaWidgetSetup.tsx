// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React from 'react'
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
  // Placeholder for DaGenAI_Widget
  const DaGenAI_Widget = ({ outerSetiWidgetUrl }: any) => {
    return (
      <div className="flex flex-col w-full h-full p-4">
        <p className="text-muted-foreground">Widget ProtoPilot coming soon</p>
        {/* TODO: Implement DaGenAI_Widget */}
      </div>
    )
  }

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
