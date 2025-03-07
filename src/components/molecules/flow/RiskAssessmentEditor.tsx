import React, { useState, useEffect } from 'react'
import { DaButton } from '@/components/atoms/DaButton'
import {
  TbLoader2,
  TbEdit,
  TbTextScan2,
  TbCheck,
  TbX,
  TbCalendarEvent,
} from 'react-icons/tb'
import {
  riskAssessmentGenerationPrompt,
  reEvaluationRiskAssessmentPrompt,
} from './FlowPromptInventory'
import RiskAssessmentMarkdown from './RiskAssessmentMarkdown'
import { FlowItemData } from '@/types/flow.type'
import { ASILLevel } from '@/types/flow.type'

interface RiskAssessmentEditorProps {
  flowItemData: FlowItemData
  updateFlowItemData: (updates: Partial<FlowItemData>) => void
  currentUser: { name: string } | undefined
}

const RiskAssessmentEditor = ({
  flowItemData: flowItemData,
  updateFlowItemData,
  currentUser,
}: RiskAssessmentEditorProps) => {
  // Tab state
  const [activeTab, setActiveTab] = useState<'riskAssessment' | 'feedback'>(
    'riskAssessment',
  )

  const [isEvaluating, setIsEvaluating] = useState(false)
  const [evaluationTime, setEvaluationTime] = useState(0)
  const [evaluationIntervalId, setEvaluationIntervalId] = useState<
    number | null
  >(null)

  // Separate evaluation states for each tab
  const [isRiskAssessmentEvaluated, setIsRiskAssessmentEvaluated] =
    useState(false)
  const [isFeedbackEvaluated, setIsFeedbackEvaluated] = useState(false)

  const [backupRiskAssessment, setBackupRiskAssessment] = useState<string>(
    flowItemData.riskAssessment || '',
  )
  const [isEditingMarkdown, setIsEditingMarkdown] = useState(false)

  // Reset evaluation state when description changes
  useEffect(() => {
    setIsRiskAssessmentEvaluated(false)
    setIsFeedbackEvaluated(false)
  }, [flowItemData.description])

  const generateContent = async () => {
    let systemPrompt: string, message: string
    if (activeTab === 'riskAssessment') {
      systemPrompt = riskAssessmentGenerationPrompt
      message = `Generate risk assessment for action "${flowItemData.description}" <timestamp>${new Date().toLocaleString()}</timestamp>`
      setBackupRiskAssessment(flowItemData.riskAssessment || '')
    } else {
      systemPrompt = reEvaluationRiskAssessmentPrompt
      message = `Generate feedback for risk assessment based on action "${flowItemData.description}" and previous risk assessment: <previous_risk_assessment>${flowItemData.riskAssessment || ''}</previous_risk_assessment> <timestamp>${new Date().toLocaleString()}</timestamp>`
    }

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
          systemMessage: systemPrompt,
          message,
        }),
      })

      const data = await response.json()
      console.log('Content generation response:', data)

      if (activeTab === 'riskAssessment') {
        // Extract pre-/post- ASIL tags if available.
        const preAsilMatch = data.content.match(
          /<preAsilLevel>(.*?)<\/preAsilLevel>/s,
        )
        const postAsilMatch = data.content.match(
          /<postAsilLevel>(.*?)<\/postAsilLevel>/s,
        )

        const newPreAsilLevel = (
          preAsilMatch ? preAsilMatch[1].trim() : flowItemData.preAsilLevel
        ) as ASILLevel
        const newPostAsilLevel = (
          postAsilMatch ? postAsilMatch[1].trim() : flowItemData.postAsilLevel
        ) as ASILLevel

        // Clean the generated content.
        const cleanedContent = data.content
          .replace(/<preAsilLevel>.*?<\/preAsilLevel>/s, '')
          .replace(/<postAsilLevel>.*?<\/postAsilLevel>/s, '')
          .replace(/<\/?risk_assessment>/g, '')
          .trim()

        updateFlowItemData({
          riskAssessment: cleanedContent,
          preAsilLevel: newPreAsilLevel,
          postAsilLevel: newPostAsilLevel,
          approvedBy: '',
          approvedAt: '',
        })
        setIsRiskAssessmentEvaluated(true)
      } else {
        const feedbackMatch = data.content.match(
          /<risk_assessment_feedback>(.*?)<\/risk_assessment_feedback>/s,
        )
        const cleanedFeedback = feedbackMatch
          ? feedbackMatch[1].trim()
          : data.content.trim()

        updateFlowItemData({
          riskAssessmentEvaluation: cleanedFeedback,
        })
        setIsFeedbackEvaluated(true)
      }
    } catch (error) {
      console.error('Error generating content:', error)
    } finally {
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
    updateFlowItemData({
      approvedBy: currentUser.name,
      approvedAt: new Date().toISOString(),
    })
    setBackupRiskAssessment(flowItemData.riskAssessment || '')
    setIsRiskAssessmentEvaluated(false)
  }

  const handleReject = () => {
    updateFlowItemData({
      riskAssessment: backupRiskAssessment,
      approvedBy: '',
      approvedAt: '',
    })
    setIsRiskAssessmentEvaluated(false)
  }

  return (
    <div className="flex flex-col w-1/2 h-full overflow-y-auto gap-2">
      {/* Header with Tab Controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('riskAssessment')}
            className={`font-medium text-xs pb-0.5 border-b-2 ${
              activeTab === 'riskAssessment'
                ? 'text-da-primary-500 border-da-primary-500'
                : 'text-muted-foreground border-transparent'
            }`}
          >
            Risk Assessment
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('feedback')}
            className={`font-medium text-xs pb-0.5 border-b-2 ${
              activeTab === 'feedback'
                ? 'text-da-primary-500 border-da-primary-500'
                : 'text-muted-foreground border-transparent'
            }`}
          >
            Feedback
          </button>
        </div>

        <div className="flex items-center gap-2 mb-1">
          {/* Toggle edit mode (only in Risk Assessment) */}
          {!isEvaluating && activeTab === 'riskAssessment' && (
            <DaButton
              size="sm"
              variant="plain"
              onClick={() => setIsEditingMarkdown((prev) => !prev)}
              className="!text-xs !h-6 -mb-1"
            >
              <TbEdit className="size-3.5 mr-1.5 text-da-primary-500" />
              {isEditingMarkdown ? 'Preview' : 'Edit Assessment'}
            </DaButton>
          )}
          {isEvaluating ? (
            <DaButton
              size="sm"
              variant="plain"
              disabled
              className="!text-xs !h-6 -mb-1"
            >
              <TbLoader2 className="size-3.5 mr-1.5 animate-spin text-da-primary-500" />
              {activeTab === 'riskAssessment'
                ? 'Generating for'
                : 'Evaluating for'}
              &nbsp;
              <span className="w-[30px]">{evaluationTime.toFixed(1)}</span>s
            </DaButton>
          ) : activeTab === 'riskAssessment' && isRiskAssessmentEvaluated ? (
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
          ) : activeTab === 'feedback' && isFeedbackEvaluated ? (
            <DaButton
              size="sm"
              variant="plain"
              onClick={generateContent}
              className="!text-xs !h-6 -mb-1"
            >
              <TbTextScan2 className="size-3.5 mr-1.5 text-da-primary-500" />
              Evaluate with AI
            </DaButton>
          ) : (
            <DaButton
              size="sm"
              variant="plain"
              onClick={generateContent}
              className="!text-xs !h-6 -mb-1"
            >
              <TbTextScan2 className="size-3.5 mr-1.5 text-da-primary-500" />
              {activeTab === 'riskAssessment'
                ? 'Generate with AI'
                : 'Evaluate with AI'}
            </DaButton>
          )}
        </div>
      </div>

      {/* Content container with dashed border */}
      <div className="flex flex-col h-full overflow-y-auto border border-dashed rounded-lg py-1.5 pl-2 border-da-primary-500">
        <div className="flex h-full overflow-auto scroll-gray pr-1">
          {activeTab === 'riskAssessment' ? (
            isEditingMarkdown ? (
              <textarea
                className="w-full h-full bg-transparent border-none focus:outline-none resize-none text-xs text-muted-foreground"
                value={flowItemData.riskAssessment || ''}
                onChange={(e) =>
                  updateFlowItemData({ riskAssessment: e.target.value })
                }
              />
            ) : (
              <RiskAssessmentMarkdown
                markdownText={flowItemData.riskAssessment || ''}
              />
            )
          ) : (
            <RiskAssessmentMarkdown
              markdownText={flowItemData.riskAssessmentEvaluation || ''}
            />
          )}
        </div>
        {/* Approved by / Approved at info (only in Risk Assessment tab) */}
        {activeTab === 'riskAssessment' &&
        flowItemData.approvedBy &&
        flowItemData.approvedAt ? (
          <div className="flex items-center mt-2 space-x-2 text-[11px]">
            <div className="flex items-center">
              <div className="p-0.5 w-fit flex items-center justify-center rounded bg-da-primary-100 mr-1">
                <TbCheck className="size-3 text-da-primary-500" />
              </div>
              Approved by{' '}
              <span className="ml-1 font-semibold">
                {flowItemData.approvedBy}
              </span>
            </div>
            <div className="flex items-center">
              <div className="p-0.5 w-fit flex items-center justify-center rounded bg-da-primary-100 mr-1">
                <TbCalendarEvent className="size-3 text-da-primary-500" />
              </div>
              <span className="ml-1 font-medium">
                {new Date(flowItemData.approvedAt).toLocaleString()}
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default RiskAssessmentEditor
