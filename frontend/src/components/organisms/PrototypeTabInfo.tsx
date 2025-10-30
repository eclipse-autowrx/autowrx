// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

// Simplified version - full editing capabilities to be added later
import React from 'react'
import { Prototype } from '@/types/model.type'

interface PrototypeTabInfoProps {
  prototype: Prototype
}

const complexityLevels = ['Lowest', 'Low', 'Medium', 'High', 'Highest']

const PrototypeTabInfo: React.FC<PrototypeTabInfoProps> = ({ prototype }) => {
  if (!prototype) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No prototype available</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col w-full h-full overflow-y-auto p-6 bg-background">
      {/* Header with image */}
      <div className="flex gap-6 mb-6">
        {prototype.image_file && (
          <div className="flex-shrink-0">
            <img
              src={prototype.image_file}
              alt={prototype.name}
              className="w-48 h-32 object-cover rounded-lg border"
            />
          </div>
        )}
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-primary mb-2">
            {prototype.name}
          </h2>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              Complexity:{' '}
              <span className="font-medium text-foreground">
                {
                  complexityLevels[
                    parseInt(prototype.complexity_level || '3') - 1
                  ]
                }
              </span>
            </span>
            <span>
              Status:{' '}
              <span className="font-medium text-foreground capitalize">
                {prototype.state || 'development'}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-4">
        {prototype.description?.problem && (
          <div>
            <h3 className="text-lg font-semibold text-primary mb-2">Problem</h3>
            <p className="text-muted-foreground">
              {prototype.description.problem}
            </p>
          </div>
        )}

        {prototype.description?.says_who && (
          <div>
            <h3 className="text-lg font-semibold text-primary mb-2">
              Says Who?
            </h3>
            <p className="text-muted-foreground">
              {prototype.description.says_who}
            </p>
          </div>
        )}

        {prototype.description?.solution && (
          <div>
            <h3 className="text-lg font-semibold text-primary mb-2">
              Solution
            </h3>
            <p className="text-muted-foreground">
              {prototype.description.solution}
            </p>
          </div>
        )}

        {prototype.tags && prototype.tags.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-primary mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {prototype.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-muted rounded-full text-sm text-foreground"
                >
                  {typeof tag === 'string' ? tag : tag.tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">
          💡 Full editing capabilities coming soon
        </p>
      </div>
    </div>
  )
}

export default PrototypeTabInfo
