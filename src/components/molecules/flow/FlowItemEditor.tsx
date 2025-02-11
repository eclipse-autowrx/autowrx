import React, { useState } from 'react'
import { ASILLevel } from './ASILBadge'
import CustomDialog from './CustomDialog'
import { DialogClose } from '@/components/atoms/dialog'
import { DaButton } from '@/components/atoms/DaButton'
import { DaInput } from '@/components/atoms/DaInput'
import ASILSelect from './ASILSelect'
import {
  TbCalendarEvent,
  TbCheck,
  TbPlus,
  TbTrash,
  TbChevronRight,
} from 'react-icons/tb'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import RiskAssessmentEditor from './RiskAssessmentEditor'

interface FlowItemEditorProps {
  value: string
  onChange: (value: string) => void
  children: React.ReactNode
}

export interface FormData {
  type: string
  component: string
  description: string
  preAsilLevel: ASILLevel
  postAsilLevel: ASILLevel
  riskAssessment?: string
  approvedBy?: string
  approvedAt?: string
  generatedAt?: string
  [key: string]: string | ASILLevel | undefined
}

const defaultRiskAssessmentPlaceholder = `# Mitigation
- 

# Risk Classification
-

# ASIL Rating
-

# Safety Goals
-`

const FlowItemEditor = ({ value, onChange, children }: FlowItemEditorProps) => {
  const { data: currentUser } = useSelfProfileQuery()

  const [formData, setFormData] = useState<FormData>(() => {
    try {
      const parsed = JSON.parse(value)
      const { asilLevel, preAsilLevel, postAsilLevel, ...rest } = parsed
      const newPreAsilLevel = preAsilLevel || 'QM'
      const newPostAsilLevel = postAsilLevel || asilLevel || 'QM'
      return {
        type: parsed.type || '',
        component: parsed.component || '',
        description: parsed.description || '',
        preAsilLevel: newPreAsilLevel,
        postAsilLevel: newPostAsilLevel,
        riskAssessment: parsed.riskAssessment || '',
        approvedBy: parsed.approvedBy || '',
        approvedAt: parsed.approvedAt || '',
        ...rest,
      }
    } catch {
      return {
        type: '',
        component: '',
        description: '',
        preAsilLevel: 'QM',
        postAsilLevel: 'QM',
        riskAssessment: '',
        approvedBy: '',
        approvedAt: '',
      }
    }
  })

  // Keys not to be shown as custom attributes
  const mandatoryKeys = [
    'type',
    'component',
    'description',
    'preAsilLevel',
    'postAsilLevel',
    'riskAssessment',
    'approvedBy',
    'approvedAt',
    'generatedAt',
  ]

  const handleInputChange = (name: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = () => {
    const jsonString = JSON.stringify(formData)
    onChange(jsonString)
  }

  const handleAddCustomAttribute = () => {
    const attributeName = prompt('Enter custom attribute name:')
    if (attributeName && !formData.hasOwnProperty(attributeName)) {
      setFormData((prev) => ({ ...prev, [attributeName]: '' }))
    }
  }

  const handleRemoveCustomAttribute = (attributeName: string) => {
    setFormData((prev) => {
      const newData = { ...prev }
      delete newData[attributeName]
      return newData
    })
  }

  const customAttributes = Object.keys(formData).filter(
    (key) => !mandatoryKeys.includes(key),
  )

  return (
    <CustomDialog
      trigger={children}
      dialogTitle="Edit Flow Implementation"
      className="max-w-[95vw] w-[90vw] xl:w-[80vw] h-[90vh] xl:h-[90vh] text-xs"
    >
      <div className="flex flex-col w-full h-full">
        <div className="flex h-full overflow-y-auto space-x-4">
          {/* Left Column: Mandatory Fields and Custom Attributes */}
          <div className="flex flex-col w-1/2 h-full pt-2 pr-1.5 overflow-y-auto scroll-gray gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-medium">
                Type <span className="text-red-500">*</span>
              </label>
              <DaInput
                name="type"
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="h-8 flex"
                inputClassName="h-6 text-xs"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-medium">
                Component <span className="text-red-500">*</span>
              </label>
              <DaInput
                name="component"
                value={formData.component}
                onChange={(e) => handleInputChange('component', e.target.value)}
                className="h-8 flex"
                inputClassName="h-6 text-xs"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-medium">
                Description <span className="text-red-500">*</span>
              </label>
              <DaInput
                name="description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange('description', e.target.value)
                }
                className="h-8 flex"
                inputClassName="h-6 text-xs"
              />
            </div>
            <div className="flex w-full items-center gap-2 my-2">
              <div className="flex w-full flex-col items-center">
                <label className="text-xs font-medium mb-1.5">
                  Pre-Mitigation ASIL Rating
                </label>
                <ASILSelect
                  value={formData.preAsilLevel}
                  onChange={(value) => handleInputChange('preAsilLevel', value)}
                />
              </div>
              <TbChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <div className="flex w-full flex-col items-center">
                <label className="text-xs font-medium mb-1.5">
                  Post-Mitigation ASIL Rating
                </label>
                <ASILSelect
                  value={formData.postAsilLevel}
                  onChange={(value) =>
                    handleInputChange('postAsilLevel', value)
                  }
                />
              </div>
            </div>
            {customAttributes.length > 0 &&
              customAttributes.map((key) => (
                <div key={key} className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <label className="font-medium text-xs capitalize">
                      {key}
                    </label>
                    <TbTrash
                      onClick={() => handleRemoveCustomAttribute(key)}
                      className="size-3.5 text-xs mr-1 text-gray-300 hover:text-red-500 cursor-pointer"
                    />
                  </div>
                  <DaInput
                    name={key}
                    value={formData[key] as string}
                    onChange={(e) =>
                      handleInputChange(key as keyof FormData, e.target.value)
                    }
                    className="h-8 flex"
                    inputClassName="h-6 text-xs"
                  />
                </div>
              ))}
            <div className="flex justify-between items-center">
              <DaButton
                type="button"
                size="sm"
                variant="dash"
                className="text-da-primary-500 !text-xs w-full"
                onClick={handleAddCustomAttribute}
              >
                <TbPlus className="size-4 mr-1" />
                Add Custom Attribute
              </DaButton>
            </div>
          </div>
          {/* Right Column: Risk Assessment Section */}
          <RiskAssessmentEditor
            formData={formData}
            updateFormData={(updates) =>
              setFormData((prev) => ({ ...prev, ...updates }))
            }
            currentUser={currentUser}
          />
        </div>
        <div className="grow" />
        <div className="flex justify-end items-center gap-1 mt-4">
          <div className="grow" />
          <DialogClose asChild>
            <DaButton variant="outline-nocolor" size="sm">
              Cancel
            </DaButton>
          </DialogClose>
          <DialogClose asChild>
            <DaButton size="sm" onClick={handleSubmit}>
              Confirm Change
            </DaButton>
          </DialogClose>
        </div>
      </div>
    </CustomDialog>
  )
}

export default FlowItemEditor
