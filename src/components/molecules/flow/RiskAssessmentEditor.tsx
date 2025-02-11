import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { DaButton } from '@/components/atoms/DaButton'
import {
  TbLoader2,
  TbEdit,
  TbTextScan2,
  TbCheck,
  TbX,
  TbHistory,
  TbCalendarEvent,
} from 'react-icons/tb'
import { riskAssessmentGenerationPrompt } from './FlowPromptInventory'
import { ASILLevel } from './ASILBadge'
import { FormData } from './FlowItemEditor'

interface RiskAssessmentEditorProps {
  formData: FormData
  updateFormData: (updates: Partial<FormData>) => void
  currentUser: { name: string } | undefined
}

const RiskAssessmentEditor = ({
  formData,
  updateFormData,
  currentUser,
}: RiskAssessmentEditorProps) => {
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [evaluationTime, setEvaluationTime] = useState(0)
  const [evaluationIntervalId, setEvaluationIntervalId] = useState<
    number | null
  >(null)
  const [isEvaluated, setIsEvaluated] = useState(false)
  const [backupRiskAssessment, setBackupRiskAssessment] = useState<string>(
    formData.riskAssessment || '',
  )
  // Toggle editing mode for the markdown content
  const [isEditingMarkdown, setIsEditingMarkdown] = useState(false)

  const generateRiskAssessment = async () => {
    // Use the entire formData (e.g. description) for the genAI call.
    const action = formData.description
    const message = `Generate Risk Assessment for action "${action}" with <previous_risk_assessment>${formData.riskAssessment}</previous_risk_assessment> `

    // Backup the current risk assessment so the user can revert if needed.
    setBackupRiskAssessment(formData.riskAssessment || '')

    // Start the evaluation timer
    setIsEvaluating(true)
    setEvaluationTime(0)
    const intervalId = window.setInterval(() => {
      setEvaluationTime((prev) => prev + 0.1)
    }, 100)
    setEvaluationIntervalId(intervalId)

    try {
      const response = await fetch('https://digitalauto-ai.com/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemMessage: riskAssessmentGenerationPrompt,
          message,
        }),
      })

      const data = await response.json()
      console.log('Risk assessment generation response:', data)

      // Use regex to extract preAsilLevel and postAsilLevel (in case XML is malformed)
      const preAsilMatch = data.content.match(
        /<preAsilLevel>(.*?)<\/preAsilLevel>/s,
      )
      const postAsilMatch = data.content.match(
        /<postAsilLevel>(.*?)<\/postAsilLevel>/s,
      )

      const newPreAsilLevel = (
        preAsilMatch ? preAsilMatch[1].trim() : formData.preAsilLevel
      ) as ASILLevel
      const newPostAsilLevel = (
        postAsilMatch ? postAsilMatch[1].trim() : formData.postAsilLevel
      ) as ASILLevel

      // Remove the pre/post ASIL tags and any risk_assessment tags to get the markdown content
      const cleanedContent = data.content
        .replace(/<preAsilLevel>.*?<\/preAsilLevel>/s, '')
        .replace(/<postAsilLevel>.*?<\/postAsilLevel>/s, '')
        .replace(/<\/?risk_assessment>/g, '')
        .trim()

      // Update the parent's formData with the cleaned risk assessment, ASIL ratings,
      // and update the generatedAt timestamp (new mandatory field)
      updateFormData({
        riskAssessment: cleanedContent,
        preAsilLevel: newPreAsilLevel,
        postAsilLevel: newPostAsilLevel,
        generatedAt: new Date().toISOString(),
        // Also clear any previous approval so that approval happens separately
        approvedBy: '',
        approvedAt: '',
      })
      setIsEvaluated(true)
    } catch (error) {
      console.error('Error generating risk assessment:', error)
    } finally {
      // Clear the evaluation timer
      if (evaluationIntervalId) {
        clearInterval(evaluationIntervalId)
      } else {
        clearInterval(intervalId)
      }
      setIsEvaluating(false)
    }
  }

  const handleApprove = () => {
    if (!currentUser) return
    updateFormData({
      approvedBy: currentUser.name,
      approvedAt: new Date().toISOString(),
    })
    // Update the backup with the approved risk assessment
    setBackupRiskAssessment(formData.riskAssessment || '')
    setIsEvaluated(false)
  }

  const handleReject = () => {
    // Revert to the backup risk assessment and remove approval info
    updateFormData({
      riskAssessment: backupRiskAssessment,
      approvedBy: '',
      approvedAt: '',
    })
    setIsEvaluated(false)
  }

  return (
    <div className="flex flex-col w-1/2 h-full overflow-y-auto gap-2">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div className="font-medium">Risk Assessment</div>
        <div className="flex items-center gap-2">
          <DaButton
            size="sm"
            variant="plain"
            onClick={() => setIsEditingMarkdown((prev) => !prev)}
            className="!text-xs !h-6 -mb-1"
          >
            <TbEdit className="size-3.5 mr-1.5 text-da-primary-500" />
            {isEditingMarkdown ? 'Preview' : 'Edit Assessment'}
          </DaButton>
          {isEvaluating ? (
            <DaButton
              size="sm"
              variant="plain"
              disabled
              className="!text-xs !h-6 -mb-1"
            >
              <TbLoader2 className="size-3.5 mr-1.5 animate-spin text-da-primary-500" />
              Evaluating for&nbsp;
              <span className="w-[26px]">{evaluationTime.toFixed(1)}</span>s
            </DaButton>
          ) : isEvaluated ? (
            <div className="flex gap-2">
              <DaButton
                size="sm"
                variant="plain"
                onClick={handleReject}
                className="!text-xs !h-6 -mb-1"
              >
                <TbX className="size-3.5 mr-1.5 text-red-500" />
                Reject
              </DaButton>
              <DaButton
                size="sm"
                variant="plain"
                onClick={handleApprove}
                className="!text-xs !h-6 -mb-1"
              >
                <TbCheck className="size-3.5 mr-1.5 text-green-500" />
                Approve
              </DaButton>
            </div>
          ) : (
            <DaButton
              size="sm"
              variant="plain"
              onClick={generateRiskAssessment}
              className="!text-xs !h-6 -mb-1"
            >
              <TbTextScan2 className="size-3.5 mr-1.5 text-da-primary-500" />
              Evaluate with AI
            </DaButton>
          )}
        </div>
      </div>

      {/* Content container with dashed border */}
      <div className="flex flex-col h-full overflow-y-auto border border-dashed rounded-lg py-2 pl-2 border-da-primary-500">
        {/* Display the generation timestamp if available */}
        {formData.generatedAt && formData.riskAssessment && (
          <div className="flex w-full items-center pb-1.5 font-medium">
            <div className="p-0.5 w-fit items-center justify-center flex rounded bg-da-primary-100 mr-1">
              <TbHistory className="size-3.5 text-da-primary-500" />
            </div>
            Generated by AI on
            <span className="ml-1">
              {new Date(formData.generatedAt).toLocaleString()}
            </span>
          </div>
        )}
        <div className="flex h-full overflow-auto scroll-gray pr-1">
          {isEditingMarkdown ? (
            <textarea
              className="w-full h-full bg-transparent border-none focus:outline-none resize-none text-xs text-muted-foreground"
              value={formData.riskAssessment || ''}
              onChange={(e) =>
                updateFormData({ riskAssessment: e.target.value })
              }
            />
          ) : (
            <ReactMarkdown
              className="markdown-content text-muted-foreground text-xs max-w-none"
              components={{
                h1: ({ children }) => (
                  <h1 className="text-xs font-semibold tracking-tight text-da-primary-500 mb-2">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-xs font-semibold text-amber-500 mb-2">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-xs font-medium text-da-gray-medium mb-2">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="text-muted-foreground mb-4">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc mb-2 space-y-2 ml-6">{children}</ul>
                ),
                li: ({ children }) => <li className="mb-1">{children}</li>,
                strong: ({ children }) => (
                  <strong className="font-medium">{children}</strong>
                ),
              }}
            >
              {formData.riskAssessment || ''}
            </ReactMarkdown>
          )}
        </div>
        {/* Approved by / Approved at info (if available) */}
        {formData.approvedBy && formData.approvedAt ? (
          <div className="flex items-center space-x-2">
            <div className="flex items-center mt-2">
              <div className="p-0.5 w-fit items-center justify-center flex rounded bg-da-primary-100 mr-1">
                <TbCheck className="size-3.5 text-da-primary-500" />
              </div>
              Approved by{' '}
              <span className="ml-1 font-semibold">{formData.approvedBy}</span>
            </div>
            <div className="flex items-center mt-2">
              <div className="p-0.5 w-fit items-center justify-center flex rounded bg-da-primary-100 mr-1">
                <TbCalendarEvent className="size-3.5 text-da-primary-500" />
              </div>
              <span className="ml-1 font-medium">
                {new Date(formData.approvedAt).toLocaleString()}
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default RiskAssessmentEditor
