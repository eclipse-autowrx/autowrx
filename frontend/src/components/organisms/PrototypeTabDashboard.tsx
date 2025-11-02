// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC } from 'react'
import DaDashboard from '../molecules/dashboard/DaDashboard'
import { cn } from '@/lib/utils'
import { useSystemUI } from '@/hooks/useSystemUI'

const PrototypeTabDashboard: FC = ({}) => {
  const { showPrototypeDashboardFullScreen } = useSystemUI()

  return (
    <div
      className={cn(
        'w-full h-full relative border bg-white',
        showPrototypeDashboardFullScreen &&
          'fixed top-0 left-0 w-screen h-screen',
      )}
    >
      <DaDashboard />
    </div>
  )
}

export default PrototypeTabDashboard
