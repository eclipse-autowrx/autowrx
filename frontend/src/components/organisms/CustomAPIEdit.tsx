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

interface CustomAPIEditProps {
  item: any
  schema: string | object
  itemId: string
  onChange: (data: any) => void
  onSave?: () => void
  onCancel?: () => void
  excludeFields?: string[]
  isSaving?: boolean
}

const CustomAPIEdit: React.FC<CustomAPIEditProps> = ({
  item,
  schema,
  itemId,
  onChange,
  onSave,
  onCancel,
  excludeFields = ['id', 'path', 'parent_id', 'relationships'],
  isSaving = false,
}) => {
  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Fixed Title */}
      <div className="flex items-center justify-between shrink-0 pb-4 border-b border-border">
        <h3 className="text-lg font-semibold">{itemId || 'New API'}</h3>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 min-h-0 overflow-y-auto py-4">
        <DynamicSchemaForm
          schema={schema}
          data={item}
          onChange={onChange}
          mode="edit"
          excludeFields={excludeFields}
        />
      </div>

      {/* Fixed Footer */}
      {(onSave || onCancel) && (
        <div className="flex items-center justify-end gap-2 shrink-0 pt-4 border-t border-border">
          {onCancel && (
            <Button variant="outline" onClick={onCancel} disabled={isSaving}>
              Cancel
            </Button>
          )}
          {onSave && (
            <Button onClick={onSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export default CustomAPIEdit

