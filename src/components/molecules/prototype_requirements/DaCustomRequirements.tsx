import React, { useEffect, useState } from 'react'
import { CustomRequirement } from '@/types/model.type'
import DaRequirementItem from './DaRequirementItems'
import * as lodash from 'lodash'
import { DaButton } from '@/components/atoms/DaButton'
import { cn } from '@/lib/utils'
import usePermissionHook from '@/hooks/usePermissionHook'
import { PERMISSIONS } from '@/data/permission'
import useCurrentModel from '@/hooks/useCurrentModel'

interface DaCustomRequirementsProps {
  customRequirements: CustomRequirement[]
  setCustomRequirements: React.Dispatch<
    React.SetStateAction<CustomRequirement[]>
  >
  onSaveRequirements: () => void
  isEditing: boolean
}

const DaCustomRequirements = ({
  customRequirements,
  setCustomRequirements,
  onSaveRequirements,
  isEditing,
}: DaCustomRequirementsProps) => {
  const [initialCustomRequirements, setInitialCustomRequirements] = useState<
    CustomRequirement[]
  >(lodash.cloneDeep(customRequirements))
  const { data: model } = useCurrentModel()
  const [isAuthorized] = usePermissionHook([PERMISSIONS.READ_MODEL, model?.id])

  useEffect(() => {
    setInitialCustomRequirements(lodash.cloneDeep(customRequirements))
  }, [])

  const isEmptyRequirement = (requirement: CustomRequirement) => {
    const text = requirement.text?.trim() ?? ''
    const url = requirement.url?.trim() ?? ''
    return !text && !url
  }

  const addCustomRequirement = () => {
    setCustomRequirements([...customRequirements, { text: '', url: '' }])
  }

  const updateCustomRequirement = (
    index: number,
    updatedRequirement: CustomRequirement,
  ) => {
    const updatedRequirements = [...customRequirements]
    updatedRequirements[index] = updatedRequirement
    setCustomRequirements(updatedRequirements)
  }

  const deleteCustomRequirement = (index: number) => {
    const updatedRequirements = customRequirements.filter((_, i) => i !== index)
    setCustomRequirements(updatedRequirements)
  }

  const handleDiscardChanges = () => {
    setCustomRequirements(lodash.cloneDeep(initialCustomRequirements))
  }

  const handleSaveRequirements = () => {
    const nonEmptyRequirements = customRequirements.filter(
      (requirement) => !isEmptyRequirement(requirement),
    )
    setCustomRequirements(nonEmptyRequirements)
    onSaveRequirements()
    setInitialCustomRequirements(lodash.cloneDeep(nonEmptyRequirements))
  }

  const filteredCurrentRequirements = customRequirements.filter(
    (requirement) => !isEmptyRequirement(requirement),
  )

  const filteredInitialRequirements = initialCustomRequirements.filter(
    (requirement) => !isEmptyRequirement(requirement),
  )

  const hasChanges = !lodash.isEqual(
    filteredCurrentRequirements,
    filteredInitialRequirements,
  )

  return (
    <div className="flex flex-col w-full max-w-5xl">
      <div className="flex flex-col w-full space-y-8">
        {customRequirements && customRequirements.length > 0 ? (
          customRequirements.map((requirement, index) => (
            <DaRequirementItem
              key={index}
              index={index + 1}
              requirement={requirement}
              onUpdate={(updatedRequirement) => {
                updateCustomRequirement(index, updatedRequirement)
              }}
              onDelete={() => {
                deleteCustomRequirement(index)
              }}
              isAuthorized={isAuthorized}
              isEditing={isEditing}
            />
          ))
        ) : (
          <div className="flex h-10 w-full mt-1 px-4 py-2 items-center bg-white border rounded-md">
            There's no custom properties yet.
          </div>
        )}
      </div>
      {isAuthorized && isEditing && (
        <div
          className={cn(
            'flex w-full items-center justify-between mt-6 ',
            customRequirements && customRequirements.length > 0
              ? 'pr-[30px]'
              : '',
          )}
        >
          <DaButton
            size="sm"
            variant="outline-nocolor"
            onClick={addCustomRequirement}
          >
            Add Requirement
          </DaButton>
          <div className="space-x-2">
            <DaButton
              size="sm"
              variant="outline-nocolor"
              onClick={handleDiscardChanges}
              disabled={!hasChanges}
            >
              Cancel
            </DaButton>
            {/* <DaButton
              size="sm"
              variant="solid"
              onClick={handleSaveRequirements}
              disabled={!hasChanges}
            >
              Save Requirements
            </DaButton> */}
          </div>
        </div>
      )}
    </div>
  )
}

export default DaCustomRequirements
