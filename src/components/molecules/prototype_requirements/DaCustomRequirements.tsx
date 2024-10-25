import React, { useEffect, useState } from 'react'
import { CustomRequirement } from '@/types/model.type'
import DaRequirementItem from './DaRequirementItems'
import * as lodash from 'lodash'
import { DaButton } from '@/components/atoms/DaButton'

interface DaCustomRequirementsProps {
  customRequirements: CustomRequirement[]
  setCustomRequirements: React.Dispatch<
    React.SetStateAction<CustomRequirement[]>
  >
  onSaveRequirements: () => void
}

const DaCustomRequirements = ({
  customRequirements,
  setCustomRequirements,
  onSaveRequirements,
}: DaCustomRequirementsProps) => {
  const [initialCustomRequirements, setInitialCustomRequirements] = useState<
    CustomRequirement[]
  >(lodash.cloneDeep(customRequirements))

  useEffect(() => {
    setInitialCustomRequirements(lodash.cloneDeep(customRequirements))
  }, [])

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
    setCustomRequirements(initialCustomRequirements)
  }

  return (
    <div className="flex flex-col w-full">
      <div className="flex flex-col w-full space-y-2">
        {customRequirements.map((requirement, index) => (
          <DaRequirementItem
            key={index}
            index={index + 1}
            requirement={requirement}
            onUpdate={(updateRequirement) => {
              updateCustomRequirement(index, updateRequirement)
            }}
            onDelete={() => {
              deleteCustomRequirement(index)
            }}
          />
        ))}
      </div>
      <div className="flex w-full items-center justify-between mt-4 pr-[30px]">
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
            onClick={() => handleDiscardChanges()}
          >
            Discard Changes
          </DaButton>
          <DaButton size="sm" variant="solid" onClick={onSaveRequirements}>
            Save Requirements
          </DaButton>
        </div>
      </div>
    </div>
  )
}

export default DaCustomRequirements
