// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

// Simplified version - full customer journey editor to be added later
import React from 'react'
import { Prototype } from '@/types/model.type'

interface PrototypeTabJourneyProps {
  prototype: Prototype
}

const PrototypeTabJourney: React.FC<PrototypeTabJourneyProps> = ({
  prototype,
}) => {
  if (!prototype) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No prototype available</p>
      </div>
    )
  }

  const journeyData = prototype.customer_journey
    ? typeof prototype.customer_journey === 'string'
      ? JSON.parse(prototype.customer_journey)
      : prototype.customer_journey
    : null

  return (
    <div className="flex flex-col w-full h-full overflow-y-auto p-6 bg-background">
      <h2 className="text-lg font-semibold text-primary mb-4">
        Customer Journey
      </h2>

      {journeyData && Object.keys(journeyData).length > 0 ? (
        <div className="space-y-4">
          {Object.entries(journeyData).map(([key, value]: [string, any]) => (
            <div key={key} className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold text-primary mb-2 capitalize">
                {key.replace(/_/g, ' ')}
              </h3>
              <div className="text-muted-foreground">
                {typeof value === 'object' ? (
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(value, null, 2)}
                  </pre>
                ) : (
                  <p>{String(value)}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">
            No customer journey data available
          </p>
        </div>
      )}

      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">
          💡 Full customer journey editor coming soon
        </p>
      </div>
    </div>
  )
}

export default PrototypeTabJourney
