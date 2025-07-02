// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useEffect, useState } from 'react'
import CustomDialog from '../flow/CustomDialog'
import { useRequirementStore } from './hook/useRequirementStore'
import { markdownAIEvaluate } from './mockup_requirements'
import { DaButton } from '@/components/atoms/DaButton'
import RiskAssessmentMarkdown from '../flow/RiskAssessmentMarkdown'

interface RequirementEvaluationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const RequirementEvaluationDialog: React.FC<
  RequirementEvaluationDialogProps
> = ({ open, onOpenChange }) => {
  const { toggleScanning, applyAISuggestions } = useRequirementStore()
  const [applied, setApplied] = useState(false)

  // Handle dialog close
  const handleClose = () => {
    onOpenChange(false)
  }

  // Reset applied state when dialog opens
  useEffect(() => {
    if (open) {
      setApplied(false)
    }
  }, [open])

  // Handle applying suggestions
  const handleApplySuggestions = () => {
    applyAISuggestions()
    setApplied(true)
    // Optional: Close dialog after a delay
    setTimeout(() => {
      handleClose()
    }, 500)
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      dialogTitle="AI Requirements Evaluation"
      className="w-[90vw] max-w-4xl"
      childrenWrapperClassName=""
      showCloseButton={true}
      onClose={() => {
        toggleScanning()
      }}
    >
      <div className="flex flex-col w-full h-full space-y-4">
        <div className="flex flex-col w-full h-full overflow-y-auto scroll">
          <RiskAssessmentMarkdown markdownText={markdownAIEvaluate} />
        </div>

        <div className="flex justify-end mt-auto">
          <DaButton
            onClick={handleApplySuggestions}
            size="sm"
            variant="solid"
            disabled={applied}
          >
            {applied ? 'Suggestions Applied' : 'Apply Suggestions'}
          </DaButton>
        </div>
      </div>
    </CustomDialog>
  )
}

export default RequirementEvaluationDialog
