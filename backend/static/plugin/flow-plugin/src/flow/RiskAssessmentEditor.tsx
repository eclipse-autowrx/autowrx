// Copyright (c) 2025 Eclipse Foundation.
// SPDX-License-Identifier: MIT

import React, { useState, useEffect } from 'react'
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
import type { FlowItemData } from '../types/flow.type'
import type { ASILLevel } from '../types/flow.type'

interface RiskAssessmentEditorProps {
  flowItemData: FlowItemData
  updateFlowItemData: (updates: Partial<FlowItemData>) => void
  currentUser?: { name: string }
}

export default function RiskAssessmentEditor({
  flowItemData,
  updateFlowItemData,
  currentUser,
}: RiskAssessmentEditorProps) {
  const [activeTab, setActiveTab] = useState<'riskAssessment' | 'feedback'>('riskAssessment')
  const [isEditingMarkdown, setIsEditingMarkdown] = useState(false)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [evaluationTime, setEvaluationTime] = useState(0)
  const [evaluationIntervalId, setEvaluationIntervalId] = useState<ReturnType<typeof setInterval> | null>(null)
  const [isRiskAssessmentEvaluated, setIsRiskAssessmentEvaluated] = useState(false)
  const [isFeedbackEvaluated, setIsFeedbackEvaluated] = useState(false)
  const [backupRiskAssessment, setBackupRiskAssessment] = useState(flowItemData.riskAssessment || '')

  useEffect(() => {
    setIsRiskAssessmentEvaluated(false)
    setIsFeedbackEvaluated(false)
  }, [flowItemData.description])

  const generateContent = async () => {
    let systemPrompt: string
    let message: string
    if (activeTab === 'riskAssessment') {
      systemPrompt = riskAssessmentGenerationPrompt
      message = `Generate risk assessment for action "${flowItemData.description}" <timestamp>${new Date().toLocaleString()}</timestamp>`
      setBackupRiskAssessment(flowItemData.riskAssessment || '')
    } else {
      systemPrompt = reEvaluationRiskAssessmentPrompt
      message = `Generate feedback for risk assessment based on action "${flowItemData.description}" and previous risk assessment: <previous_risk_assessment>${flowItemData.riskAssessment || ''}</previous_risk_assessment> <timestamp>${new Date().toLocaleString()}</timestamp>`
    }

    setIsEvaluating(true)
    setEvaluationTime(0)
    const intervalId = setInterval(() => {
      setEvaluationTime((prev) => prev + 0.1)
    }, 100)
    setEvaluationIntervalId(intervalId)
    let intervalIdRef = intervalId

    try {
      const response = await fetch('https://digitalauto-ai.com/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemMessage: systemPrompt, message }),
      })
      const data = await response.json()

      if (activeTab === 'riskAssessment') {
        const preAsilMatch = data.content?.match(/<preAsilLevel>(.*?)<\/preAsilLevel>/s)
        const postAsilMatch = data.content?.match(/<postAsilLevel>(.*?)<\/postAsilLevel>/s)
        const newPreAsilLevel = (preAsilMatch ? preAsilMatch[1].trim() : flowItemData.preAsilLevel) as ASILLevel
        const newPostAsilLevel = (postAsilMatch ? postAsilMatch[1].trim() : flowItemData.postAsilLevel) as ASILLevel
        const cleanedContent = (data.content || '')
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
        const feedbackMatch = data.content?.match(/<risk_assessment_feedback>(.*?)<\/risk_assessment_feedback>/s)
        const cleanedFeedback = feedbackMatch ? feedbackMatch[1].trim() : (data.content || '').trim()
        updateFlowItemData({ riskAssessmentEvaluation: cleanedFeedback })
        setIsFeedbackEvaluated(true)
      }
    } catch (error) {
      console.error('Error generating content:', error)
    } finally {
      clearInterval(intervalIdRef)
      setEvaluationIntervalId(null)
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
    <div className="flex flex-col w-full h-full overflow-y-auto gap-2 min-w-0">
      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('riskAssessment')}
            className={`font-medium text-xs pb-0.5 border-b-2 ${
              activeTab === 'riskAssessment'
                ? 'text-da-primary-500 border-da-primary-500'
                : 'text-da-gray-medium border-transparent'
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
                : 'text-da-gray-medium border-transparent'
            }`}
          >
            Feedback
          </button>
        </div>

        <div className="flex items-center gap-2 mb-1">
          {!isEvaluating && activeTab === 'riskAssessment' && (
            <button
              type="button"
              onClick={() => setIsEditingMarkdown((prev) => !prev)}
              className="flex items-center gap-1.5 text-xs text-da-primary-500 hover:opacity-80"
            >
              <TbEdit className="size-3.5" />
              {isEditingMarkdown ? 'Preview' : 'Edit Assessment'}
            </button>
          )}
          {isEvaluating ? (
            <button type="button" disabled className="flex items-center gap-1.5 text-xs text-da-primary-500">
              <TbLoader2 className="size-3.5 animate-spin" />
              {activeTab === 'riskAssessment' ? 'Generating for' : 'Evaluating for'}
              &nbsp;<span className="w-[30px]">{evaluationTime.toFixed(1)}</span>s
            </button>
          ) : activeTab === 'riskAssessment' && isRiskAssessmentEvaluated ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleReject}
                className="flex items-center gap-1.5 text-xs text-red-500 hover:opacity-80"
              >
                <TbX className="size-3.5" /> Reject
              </button>
              <button
                type="button"
                onClick={handleApprove}
                className="flex items-center gap-1.5 text-xs text-green-600 hover:opacity-80"
              >
                <TbCheck className="size-3.5" /> Approve
              </button>
            </div>
          ) : activeTab === 'feedback' && isFeedbackEvaluated ? (
            <button
              type="button"
              onClick={generateContent}
              className="flex items-center gap-1.5 text-xs text-da-primary-500 hover:opacity-80"
            >
              <TbTextScan2 className="size-3.5" /> Evaluate with AI
            </button>
          ) : (
            <button
              type="button"
              onClick={generateContent}
              className="flex items-center gap-1.5 text-xs text-da-primary-500 hover:opacity-80"
            >
              <TbTextScan2 className="size-3.5" />
              {activeTab === 'riskAssessment' ? 'Generate with AI' : 'Evaluate with AI'}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col h-full overflow-y-auto border border-dashed rounded-lg py-1.5 pl-2 border-da-primary-500">
        <div className="flex h-full overflow-auto pr-1">
          {activeTab === 'riskAssessment' ? (
            isEditingMarkdown ? (
              <textarea
                className="w-full h-full bg-transparent border-none focus:outline-none resize-none text-xs text-da-gray-dark"
                value={flowItemData.riskAssessment || ''}
                onChange={(e) => updateFlowItemData({ riskAssessment: e.target.value })}
              />
            ) : (
              <RiskAssessmentMarkdown markdownText={flowItemData.riskAssessment || ''} />
            )
          ) : (
            <RiskAssessmentMarkdown markdownText={flowItemData.riskAssessmentEvaluation || ''} />
          )}
        </div>
        {activeTab === 'riskAssessment' && flowItemData.approvedBy && flowItemData.approvedAt ? (
          <div className="flex items-center mt-2 space-x-2 text-[11px] flex-wrap gap-x-4">
            <div className="flex items-center">
              <div className="p-0.5 w-fit flex items-center justify-center rounded bg-da-primary-100 mr-1">
                <TbCheck className="size-3 text-da-primary-500" />
              </div>
              Approved by <span className="ml-1 font-semibold">{flowItemData.approvedBy}</span>
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
