import { useState } from 'react'
import { DaInput } from '@/components/atoms/DaInput'
import { TbTrash } from 'react-icons/tb'
import { cn } from '@/lib/utils'
import { CustomRequirement } from '@/types/model.type'
import DaText from '@/components/atoms/DaText'

interface RequirementItemProps {
  requirement: CustomRequirement
  index: number
  onUpdate: (updateRequirement: CustomRequirement) => void
  onDelete: () => void
  isAuthorized?: boolean
}
const DaRequirementItem = ({
  requirement,
  index,
  onUpdate,
  onDelete,
  isAuthorized,
}: RequirementItemProps) => {
  const [showTrashButton, setShowTrashButton] = useState(false)

  const handleChange = (key: keyof CustomRequirement) => (value: string) => {
    onUpdate({ ...requirement, [key]: value })
  }

  return (
    <div
      className="flex w-full"
      onMouseEnter={() => setShowTrashButton(true)}
      onMouseLeave={() => setShowTrashButton(false)}
    >
      <div className="flex flex-col w-full">
        <DaText variant="small-bold" className="text-da-primary-500">
          Requirement {index}
        </DaText>
        <DaInput
          type="textarea"
          value={requirement.text}
          onChange={(e) => {
            handleChange('text')(e.target.value)
          }}
          placeholder="Property Name"
          wrapperClassName="!bg-gray-100"
          inputClassName="!bg-gray-100"
          className="mt-1"
          disabled={!isAuthorized}
        />
        <DaText variant="small-bold" className="text-gray-500 mt-2">
          URL:
        </DaText>
        <DaInput
          type="text"
          value={String(requirement.url)}
          onChange={(e) => {
            handleChange('url')(e.target.value)
          }}
          placeholder="Value"
          wrapperClassName="!bg-gray-100"
          inputClassName="!bg-gray-100 w-full"
          className="mt-1"
          disabled={!isAuthorized}
        />
      </div>

      {isAuthorized && (
        <div
          onClick={onDelete}
          className={cn(
            'mt-6 ml-2 text-red-500 transition-opacity ease-in-out duration-200 cursor-pointer',
            showTrashButton ? 'opacity-100' : 'opacity-100',
          )}
        >
          <TbTrash className="size-6" />
        </div>
      )}
    </div>
  )
}

export default DaRequirementItem
