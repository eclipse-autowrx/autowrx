// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useState } from 'react'
import { Prototype } from '@/types/model.type'
import { updatePrototypeService } from '@/services/prototype.service'
import {
  TbEdit,
  TbLoader,
} from 'react-icons/tb'
import useCurrentModel from '@/hooks/useCurrentModel'
import useListModelPrototypes from '@/hooks/useListModelPrototypes'
import useCurrentPrototype from '@/hooks/useCurrentPrototype'
import usePermissionHook from '@/hooks/usePermissionHook'
import { PERMISSIONS } from '@/data/permission'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { addLog } from '@/services/log.service'
import { Button } from '@/components/atoms/button'

interface PrototypeTabFlowProps {
  prototype: Prototype
}

const PrototypeTabFlow: React.FC<PrototypeTabFlowProps> = ({
  prototype,
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [localPrototype, setLocalPrototype] = useState(prototype)
  const { data: model } = useCurrentModel()
  const { refetch: refetchModelPrototypes } = useListModelPrototypes(
    model?.id || '',
  )
  const { refetch: refetchCurrentPrototype } = useCurrentPrototype()
  const [isAuthorized] = usePermissionHook(
    [PERMISSIONS.READ_MODEL, model?.id],
  )
  const [isSaving, setIsSaving] = useState(false)

  const { data: currentUser } = useSelfProfileQuery()

  if (!prototype) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No prototype available</p>
      </div>
    )
  }

  const handleSave = async () => {
    if (!localPrototype) return
    setIsEditing(false)
    setIsSaving(true)
    const updateData = {
      flow: localPrototype.flow,
    }
    try {
      await updatePrototypeService(prototype.id, updateData)
      await refetchModelPrototypes()
      addLog({
        name: `User ${currentUser?.email} updated prototype ${localPrototype.name}`,
        description: `User ${currentUser?.email} updated Prototype ${localPrototype.name} with id ${localPrototype?.id} of model ${localPrototype.model_id}`,
        type: 'update-prototype',
        create_by: currentUser?.id!,
        parent_id: localPrototype.model_id,
        ref_id: localPrototype.id,
        ref_type: 'prototype',
      })
      await refetchCurrentPrototype()
    } catch (error) {
      console.error('Error updating prototype:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setLocalPrototype(prototype)
    setIsEditing(false)
  }

  const handleChange = (field: keyof Prototype, value: any) => {
    setLocalPrototype((prevPrototype) => {
      if (!prevPrototype) return prevPrototype
      return {
        ...prevPrototype,
        [field]: value,
      }
    })
  }

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex flex-col h-full w-full bg-background overflow-y-auto">
        <div className="flex flex-col h-full w-full pt-6 bg-background px-6">
          {/* Header */}
          <div className="flex mb-3 justify-between items-center">
            {isEditing ? (
              <>
                <h2 className="text-lg font-semibold text-primary">
                  Editing Flow
                </h2>
                <div className="flex space-x-2">
                  <Button
                    data-id='flow-cancel-button'
                    variant="outline"
                    onClick={handleCancel}
                    size="sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    data-id="flow-save-button"
                    onClick={handleSave}
                    size="sm"
                  >
                    Save
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center w-full">
                <h2 className="text-lg font-semibold text-primary">
                  End-to-End Flow: {localPrototype.name}
                </h2>
                <div className="grow" />
                {isAuthorized && (
                  <>
                    <Button
                      onClick={() => setIsEditing(true)}
                      variant="outline"
                      size="sm"
                      data-id='flow-edit-button'
                    >
                      {isSaving ? (
                        <>
                          <TbLoader className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <TbEdit className="w-4 h-4" /> Edit
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
          {/* Content - TODO: Thêm component hiển thị flow diagram ở đây */}
          <div className="flex flex-col w-full items-center justify-center py-8 space-y-8">
            <h3 className="text-lg font-semibold text-primary">
              Flow Diagram
            </h3>
            {/* TODO: Thêm component render flow từ autowrx2 vào đây */}
            <div className="text-muted-foreground">
              Flow content will be displayed here
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrototypeTabFlow