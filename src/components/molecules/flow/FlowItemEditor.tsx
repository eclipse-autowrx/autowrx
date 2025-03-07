import React, { useState } from 'react'
import CustomDialog from './CustomDialog'
import { DialogClose } from '@/components/atoms/dialog'
import { DaButton } from '@/components/atoms/DaButton'
import { DaInput } from '@/components/atoms/DaInput'
import ASILSelect from './ASILSelect'
import { TbPlus, TbTrash, TbChevronRight } from 'react-icons/tb'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import RiskAssessmentEditor from './RiskAssessmentEditor'
import { DaTextarea } from '@/components/atoms/DaTextarea'
import { ASILLevel } from '@/types/flow.type'
import { FlowItemData } from '@/types/flow.type'

export const defaultRiskAssessmentPlaceholder = `# Hazards
- 

# Mitigation
- 

# Risk Classification
- 

# ASIL Rating
- 

# Safety Goals
-`

// Helper to handle legacy plain text values.
const parseNonJsonFlowItem = (value: string): FlowItemData => {
  const ratingRegex = /<(?:ASIL-)?(A|B|C|D|QM)>/
  const match = value.match(ratingRegex)
  let extractedRating: ASILLevel = 'QM'
  let description = value
  if (match) {
    extractedRating = match[1] as ASILLevel
    description = value.replace(ratingRegex, '').trim()
  }
  return {
    type: '',
    component: '',
    description,
    preAsilLevel: extractedRating,
    postAsilLevel: 'QM',
    riskAssessment: defaultRiskAssessmentPlaceholder,
    riskAssessmentEvaluation: '',
    approvedBy: '',
    approvedAt: '',
    generatedAt: '',
  }
}

interface FlowItemEditorProps {
  value: string
  onChange: (value: string) => void
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (value: boolean) => void
  isSaveMode?: boolean
}

const FlowItemEditor = ({
  value,
  onChange,
  children,
  open,
  onOpenChange,
  isSaveMode,
}: FlowItemEditorProps) => {
  const { data: currentUser } = useSelfProfileQuery()

  const [flowItemData, setFlowItemData] = useState<FlowItemData>(() => {
    try {
      const parsed = JSON.parse(value)
      const { asilLevel, preAsilLevel, postAsilLevel, ...rest } = parsed
      const newPreAsilLevel = preAsilLevel || asilLevel || 'QM'
      const newPostAsilLevel = postAsilLevel || 'QM'
      return {
        type: parsed.type || '',
        component: parsed.component || '',
        description: parsed.description || '',
        preAsilLevel: newPreAsilLevel,
        postAsilLevel: newPostAsilLevel,
        riskAssessment:
          parsed.riskAssessment && parsed.riskAssessment.trim() !== ''
            ? parsed.riskAssessment
            : defaultRiskAssessmentPlaceholder,
        riskAssessmentEvaluation: parsed.riskAssessmentEvaluation || '',
        approvedBy: parsed.approvedBy || '',
        approvedAt: parsed.approvedAt || '',
        // generatedAt: parsed.generatedAt || '',
        ...rest,
      }
    } catch {
      return parseNonJsonFlowItem(value)
    }
  })

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
    'riskAssessmentEvaluation',
  ]

  const handleInputChange = (name: keyof FlowItemData, value: string) => {
    setFlowItemData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = () => {
    const jsonString = JSON.stringify(flowItemData)
    onChange(jsonString)
  }

  const handleAddCustomAttribute = () => {
    const attributeName = prompt('Enter custom attribute name:')
    if (attributeName && !flowItemData.hasOwnProperty(attributeName)) {
      setFlowItemData((prev) => ({ ...prev, [attributeName]: '' }))
    }
  }

  const handleRemoveCustomAttribute = (attributeName: string) => {
    setFlowItemData((prev) => {
      const newData = { ...prev }
      delete newData[attributeName]
      return newData
    })
  }

  const customAttributes = Object.keys(flowItemData).filter(
    (key) => !mandatoryKeys.includes(key),
  )

  return (
    <CustomDialog
      trigger={children}
      dialogTitle="Hazard Analysis and Risk Assessment (HARA)"
      className="max-w-[98vw] w-[98vw] xl:w-[80vw] h-[90vh] xl:h-[90vh] text-xs"
      open={open}
      onOpenChange={onOpenChange}
    >
      <div className="flex flex-col w-full h-full">
        <div className="flex h-full overflow-y-auto space-x-4">
          {/* Left Column: Mandatory Fields & Custom Attributes */}
          <div className="flex flex-col w-1/2 h-full pt-2 pr-1.5 overflow-y-auto scroll-gray gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-medium">
                Type <span className="text-red-500">*</span>
              </label>
              <DaInput
                name="type"
                value={flowItemData.type}
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
                value={flowItemData.component}
                onChange={(e) => handleInputChange('component', e.target.value)}
                className="h-8 flex"
                inputClassName="h-6 text-xs"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-medium">
                Description <span className="text-red-500">*</span>
              </label>
              <DaTextarea
                name="description"
                value={flowItemData.description}
                onChange={(e) =>
                  handleInputChange('description', e.target.value)
                }
                className="h-28 p-0.5 "
                textareaClassName="!text-xs"
              />
            </div>
            <div className="flex w-full items-center gap-2 my-2">
              <div className="flex w-full flex-col items-center">
                <label className="text-xs font-medium mb-1.5">
                  Pre-Mitigation ASIL Rating
                </label>
                <ASILSelect
                  value={flowItemData.preAsilLevel}
                  onChange={(value) => handleInputChange('preAsilLevel', value)}
                />
              </div>
              <TbChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <div className="flex w-full flex-col items-center">
                <label className="text-xs font-medium mb-1.5">
                  Post-Mitigation ASIL Rating
                </label>
                <ASILSelect
                  value={flowItemData.postAsilLevel}
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
                    value={flowItemData[key] as string}
                    onChange={(e) =>
                      handleInputChange(
                        key as keyof FlowItemData,
                        e.target.value,
                      )
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
            flowItemData={flowItemData}
            updateFlowItemData={(updates) =>
              setFlowItemData((prev) => ({ ...prev, ...updates }))
            }
            currentUser={currentUser}
          />
        </div>
        <div className="grow" />
        <div className="flex justify-end items-center gap-1 mt-4">
          <div className="grow" />
          <DialogClose asChild>
            <DaButton variant="outline-nocolor" className="min-w-20" size="sm">
              Cancel
            </DaButton>
          </DialogClose>
          <DialogClose asChild>
            <DaButton size="sm" className="min-w-20" onClick={handleSubmit}>
              {isSaveMode ? 'Save' : 'Confirm Change'}
            </DaButton>
          </DialogClose>
        </div>
      </div>
    </CustomDialog>
  )
}

export default FlowItemEditor
