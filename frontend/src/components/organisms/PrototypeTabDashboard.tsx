// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

// Stub - full dashboard to be implemented later
import { FC } from 'react'

const PrototypeTabDashboard: FC = () => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-6 bg-background">
      <div className="text-center max-w-md">
        <h2 className="text-lg font-semibold text-primary mb-4">Dashboard</h2>
        <p className="text-muted-foreground mb-4">
          The interactive dashboard for visualizing vehicle signals and
          prototype runtime data will be implemented here.
        </p>
        <p className="text-sm text-muted-foreground">
          💡 Coming soon: Real-time signal visualization, widget configuration,
          and runtime controls
        </p>
      </div>
    </div>
  )
}

export default PrototypeTabDashboard
