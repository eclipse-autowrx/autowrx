// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React from 'react'
import { Button } from '@/components/atoms/button'
import DynamicSchemaForm from '@/components/molecules/DynamicSchemaForm'
import { TbPencil } from 'react-icons/tb'

interface CustomAPIViewProps {
  item: any
  schema: string | object
  itemId: string
  onEdit?: () => void
  excludeFields?: string[]
}

const CustomAPIView: React.FC<CustomAPIViewProps> = ({
  item,
  schema,
  itemId,
  onEdit,
  excludeFields = ['id', 'path', 'parent_id', 'relationships'],
}) => {
  return (
    <div className="flex flex-col h-full min-h-0 py-2 pl-0">
      {/* Fixed Title */}
      <div className="flex items-center justify-between shrink-0 py-2 border-b border-border">
        <h3 className="text-lg font-semibold">{itemId}</h3>
        {onEdit && (
          <Button variant="outline" size="sm" onClick={onEdit}>
            <TbPencil className="h-4 w-4 mr-1" />
            Edit
          </Button>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 min-h-0 overflow-y-auto py-4">
        <DynamicSchemaForm
          schema={schema}
          data={item}
          onChange={() => {}} // No-op in view mode
          mode="view"
          excludeFields={excludeFields}
        />
      </div>
    </div>
  )
}

export default CustomAPIView

