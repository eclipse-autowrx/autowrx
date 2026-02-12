// Copyright (c) 2025 Eclipse Foundation.
// SPDX-License-Identifier: MIT

import React, { useState } from 'react'
import CustomDialog from './CustomDialog'
import ASILSelect from './ASILSelect'
import RiskAssessmentEditor from './RiskAssessmentEditor'
import { TbPlus, TbTrash, TbChevronRight } from 'react-icons/tb'
import type { ASILLevel, FlowItemData } from '../types/flow.type'

export const defaultRiskAssessmentPlaceholder = `# Hazards
- 

# Mitigation
- 

# Risk Classification
- 

# ASIL Rating
- 

# Safety Goals
- `

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

export default function FlowItemEditor({
  value,
  onChange,
  children,
  open,
  onOpenChange,
  isSaveMode,
}: FlowItemEditorProps) {
  const [flowItemData, setFlowItemData] = useState<FlowItemData>(() => {
    try {
      const parsed = JSON.parse(value)
      const newPreAsilLevel = (parsed.preAsilLevel || parsed.asilLevel || 'QM') as ASILLevel
      const newPostAsilLevel = (parsed.postAsilLevel || 'QM') as ASILLevel
      return {
        type: parsed.type || '',
        component: parsed.component || '',
        description: parsed.description || '',
        preAsilLevel: newPreAsilLevel,
        postAsilLevel: newPostAsilLevel,
        riskAssessment:
          parsed.riskAssessment?.trim() ? parsed.riskAssessment : defaultRiskAssessmentPlaceholder,
        riskAssessmentEvaluation: parsed.riskAssessmentEvaluation || '',
        approvedBy: parsed.approvedBy || '',
        approvedAt: parsed.approvedAt || '',
        ...parsed,
      }
    } catch {
      return parseNonJsonFlowItem(value)
    }
  })

  const mandatoryKeys = [
    'type', 'component', 'description', 'preAsilLevel', 'postAsilLevel',
    'riskAssessment', 'approvedBy', 'approvedAt', 'generatedAt', 'riskAssessmentEvaluation',
  ]

  const handleInputChange = (name: keyof FlowItemData, value: string) => {
    setFlowItemData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (onClose: () => void) => {
    onChange(JSON.stringify(flowItemData))
    onOpenChange?.(false)
    onClose()
  }

  const handleCancel = (onClose: () => void) => {
    onOpenChange?.(false)
    onClose()
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
      dialogTitle="Hazard Analysis and Risk Assessment (HARA)"
      className="max-w-[98vw] w-[98vw] xl:w-[80vw] h-[90vh]"
      open={open}
      onOpenChange={onOpenChange}
      trigger={children}
      showCloseButton={false}
    >
      {({ onClose }) => (
      <div className="flex flex-col w-full h-full">
        <div className="flex h-full overflow-auto gap-4 min-w-0">
          <div className="flex flex-col flex-1 min-w-0 h-full pt-2 pr-1.5 overflow-y-auto gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-medium">Type <span className="text-red-500">*</span></label>
              <input
                value={flowItemData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="h-8 text-xs border border-da-gray-light rounded px-2"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-medium">Component <span className="text-red-500">*</span></label>
              <input
                value={flowItemData.component}
                onChange={(e) => handleInputChange('component', e.target.value)}
                className="h-8 text-xs border border-da-gray-light rounded px-2"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-medium">Description <span className="text-red-500">*</span></label>
              <textarea
                value={flowItemData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="h-28 text-xs border border-da-gray-light rounded px-2 py-1"
              />
            </div>
            <div className="flex w-full items-center gap-2 my-2 overflow-visible">
              <div className="flex flex-col items-center flex-1 min-w-0 overflow-visible">
                <label className="text-xs font-medium mb-1.5">Pre-Mitigation ASIL Rating</label>
                <ASILSelect
                  value={flowItemData.preAsilLevel}
                  onChange={(v) => handleInputChange('preAsilLevel', v)}
                />
              </div>
              <TbChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
              <div className="flex flex-col items-center flex-1 min-w-0 overflow-visible">
                <label className="text-xs font-medium mb-1.5">Post-Mitigation ASIL Rating</label>
                <ASILSelect
                  value={flowItemData.postAsilLevel}
                  onChange={(v) => handleInputChange('postAsilLevel', v)}
                  dropdownAlign="right"
                />
              </div>
            </div>
            {customAttributes.map((key) => (
              <div key={key} className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <label className="font-medium text-xs capitalize">{key}</label>
                  <button
                    onClick={() => handleRemoveCustomAttribute(key)}
                    className="text-da-gray-medium hover:opacity-80"
                  >
                    <TbTrash className="size-3.5" />
                  </button>
                </div>
                <input
                  value={(flowItemData[key] as string) || ''}
                  onChange={(e) => handleInputChange(key as keyof FlowItemData, e.target.value)}
                  className="h-8 text-xs border border-da-gray-light rounded px-2"
                />
              </div>
            ))}
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={handleAddCustomAttribute}
                className="btn-dash"
              >
                <TbPlus className="size-4 mr-1" /> Add Custom Attribute
              </button>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <RiskAssessmentEditor
              flowItemData={flowItemData}
              updateFlowItemData={(updates) => setFlowItemData((prev) => ({ ...prev, ...updates }))}
            />
          </div>
        </div>
        <div className="grow" />
        <div className="flex justify-end items-center gap-1 mt-4">
          <div className="grow" />
          <button
            type="button"
            onClick={() => handleCancel(onClose)}
            className="btn-outline"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(onClose)}
            className="btn-primary"
          >
            {isSaveMode ? 'Save' : 'Confirm Change'}
          </button>
        </div>
      </div>
      )}
    </CustomDialog>
  )
}
