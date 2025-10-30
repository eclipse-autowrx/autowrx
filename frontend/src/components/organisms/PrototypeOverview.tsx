// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useState } from 'react'
import PrototypeTabJourney from '@/components/organisms/PrototypeTabJourney'
import PrototypeTabInfo from '@/components/organisms/PrototypeTabInfo'

type Mode = 'overview' | 'customerJourney' | 'requirement'

const modeLabels: Record<Mode, string> = {
  overview: 'Overview',
  customerJourney: 'Customer Journey',
  requirement: 'Requirements',
}

interface PrototypeOverviewProps {
  mode?: Mode
  prototype?: any
  onModeChange?: (mode: Mode) => void
}

const PrototypeOverview: React.FC<PrototypeOverviewProps> = ({
  mode: externalMode,
  prototype,
  onModeChange,
}) => {
  const [internalMode, setInternalMode] = useState<Mode>(
    externalMode ?? 'overview',
  )

  React.useEffect(() => {
    if (externalMode && externalMode !== internalMode) {
      setInternalMode(externalMode)
    }
  }, [externalMode])

  const handleChange = (_: React.SyntheticEvent | null, newValue: Mode) => {
    if (onModeChange) {
      onModeChange(newValue)
    } else {
      setInternalMode(newValue)
    }
  }

  const renderContent = (prototype: any) => {
    switch (internalMode) {
      case 'overview':
        return <PrototypeTabInfo prototype={prototype} />
      case 'customerJourney':
        return <PrototypeTabJourney prototype={prototype} />
      case 'requirement':
        return (
          <div className="flex items-center justify-center h-full p-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-primary mb-2">
                Requirements
              </h3>
              <p className="text-muted-foreground">
                Requirements management coming soon
              </p>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="w-full h-full overflow-y-auto">
      <div
        className="flex border-b border-border mb-2"
        aria-label="Prototype Overview Tabs"
      >
        {(['overview', 'customerJourney', 'requirement'] as Mode[]).map(
          (tab) => (
            <button
              data-id={`prototype-overview-tab-${tab}`}
              key={tab}
              className={`px-4 py-2 -mb-px border-b-2 font-medium text-sm focus:outline-none transition-colors
              ${
                internalMode === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:opacity-80'
              }
            `}
              onClick={() => handleChange(null, tab)}
              type="button"
            >
              {modeLabels[tab]}
            </button>
          ),
        )}
      </div>
      <div className="px-2 py-0 sm:px-2 w-full h-full">
        {renderContent(prototype)}
      </div>
    </div>
  )
}

export default PrototypeOverview
