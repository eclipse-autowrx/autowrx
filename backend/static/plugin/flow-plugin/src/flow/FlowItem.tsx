// Copyright (c) 2025 Eclipse Foundation.
// SPDX-License-Identifier: MIT

import React, { useState, useRef, useEffect } from 'react'
import { TbEdit, TbX } from 'react-icons/tb'
import { ASILBadge } from './ASILBadge'
import RiskAssessmentMarkdown from './RiskAssessmentMarkdown'
import { defaultRiskAssessmentPlaceholder } from './FlowItemEditor'
import type { ASILLevel, FlowItemData } from '../types/flow.type'

const safetyLevels = ['<ASIL-D>', '<ASIL-C>', '<ASIL-B>', '<ASIL-A>', '<QM>']

const isValidASILLevel = (level: string): level is ASILLevel =>
  ['A', 'B', 'C', 'D', 'QM'].includes(level)

const isJsonString = (str: string) => {
  try {
    JSON.parse(str)
    return true
  } catch {
    return false
  }
}

const parseActivityData = (
  input: string,
): {
  displayText: string
  preAsilLevel: ASILLevel | null
  postAsilLevel: ASILLevel | null
  riskAssessment: string
  data: FlowItemData | null
} => {
  if (isJsonString(input)) {
    const jsonData = JSON.parse(input)
    const preAsil = (jsonData.preAsilLevel || jsonData.asilLevel || 'QM') as ASILLevel
    const postAsil = (jsonData.postAsilLevel || 'QM') as ASILLevel
    return {
      displayText: jsonData.description || '',
      preAsilLevel: preAsil,
      postAsilLevel: postAsil,
      riskAssessment: jsonData.riskAssessment || '',
      data: { ...jsonData, preAsilLevel: preAsil, postAsilLevel: postAsil },
    }
  }
  const matchedLevel = safetyLevels.find((level) => input.includes(level))
  let displayText = input
  let extractedLevel: ASILLevel | null = null
  if (matchedLevel) {
    displayText = input.replace(matchedLevel, '').trim()
    const level = matchedLevel.startsWith('<ASIL-')
      ? matchedLevel.replace(/<ASIL-|>/g, '')
      : matchedLevel.replace(/[<>]/g, '')
    if (isValidASILLevel(level)) extractedLevel = level
  }
  return {
    displayText: displayText || input,
    preAsilLevel: extractedLevel,
    postAsilLevel: 'QM',
    riskAssessment: '',
    data: null,
  }
}

const formatFieldLabel = (key: string): string =>
  key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())

interface FlowItemProps {
  stringData: string
  onEdit?: (value: string) => void
  showASIL?: boolean
  isAuthorized?: boolean
}

export default function FlowItem({ stringData, onEdit, showASIL = true, isAuthorized = true }: FlowItemProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const { displayText, preAsilLevel, postAsilLevel, data } = parseActivityData(stringData)
  const content = data !== null ? displayText : displayText || stringData
  const shouldShowBadge =
    preAsilLevel &&
    (data !== null ? displayText.trim() !== '' : stringData.trim() !== '')

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  if (!content && !preAsilLevel) {
    return <div>{stringData}</div>
  }

  return (
    <div ref={ref} className="relative">
      <div
        className="p-1 flex items-center justify-center gap-2.5 min-h-7 cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <span>{content}</span>
        {shouldShowBadge && (
          <ASILBadge
            preAsilLevel={preAsilLevel}
            postAsilLevel={postAsilLevel || 'QM'}
            showBadge={showASIL}
          />
        )}
      </div>

      {open && (
        <div
          className="absolute left-0 top-full mt-1 flex flex-col text-xs bg-white p-3 border rounded-lg overflow-y-auto max-h-[50vh] min-w-[250px] w-[500px] z-50 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-2">
            <div className="font-bold text-da-primary-500">System Activity</div>
            <div className="flex items-center gap-1">
              {isAuthorized && onEdit && (
                <button
                  onClick={() => {
                    setOpen(false)
                    onEdit(stringData)
                  }}
                  className="p-1 rounded text-xs text-da-primary-500"
                >
                  <TbEdit className="size-3.5 mr-1 inline" /> Edit
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-0.5 rounded hover:opacity-80"
              >
                <TbX className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex flex-col overflow-y-auto">
            {data ? (
              <div className="flex flex-col space-y-1.5">
                {data.type && (
                  <div className="flex">
                    <span className="font-semibold text-da-gray-dark mr-1">Type:</span>
                    <span>{data.type}</span>
                  </div>
                )}
                {data.component && (
                  <div className="flex">
                    <span className="font-semibold text-da-gray-dark mr-1">Component:</span>
                    <span>{data.component}</span>
                  </div>
                )}
                {data.description && (
                  <div className="flex">
                    <span className="font-semibold text-da-gray-dark mr-1">Description:</span>
                    <span>{data.description}</span>
                  </div>
                )}
                <div className="flex">
                  <span
                      className="font-semibold mr-1"
                      style={{ color: 'var(--color-da-gray-dark)' }}
                    >Pre-Mitigation ASIL:</span>
                  <span>{data.preAsilLevel === 'QM' ? 'QM' : `ASIL-${data.preAsilLevel}`}</span>
                </div>
                <div className="flex">
                  <span
                      className="font-semibold mr-1"
                      style={{ color: 'var(--color-da-gray-dark)' }}
                    >Post-Mitigation ASIL:</span>
                  <span>{data.postAsilLevel === 'QM' ? 'QM' : `ASIL-${data.postAsilLevel}`}</span>
                </div>
                {data.riskAssessment &&
                  data.riskAssessment !== defaultRiskAssessmentPlaceholder && (
                    <div className="flex flex-col">
                      <span className="font-semibold text-da-gray-dark mr-1">
                        Hazard Analysis and Risk Assessment:
                      </span>
                      <div className="mt-1 ml-4">
                        <RiskAssessmentMarkdown markdownText={data.riskAssessment || ''} />
                      </div>
                    </div>
                  )}
                {data.approvedBy && (
                  <div className="flex">
                    <span className="font-semibold text-da-gray-dark mr-1">Approved By:</span>
                    <span>{data.approvedBy}</span>
                  </div>
                )}
                {data.approvedAt && (
                  <div className="flex">
                    <span className="font-semibold text-da-gray-dark mr-1">Approved At:</span>
                    <span>{new Date(data.approvedAt).toLocaleString()}</span>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="flex">
                  <span
                      className="font-semibold mr-1"
                      style={{ color: 'var(--color-da-gray-dark)' }}
                    >Description:</span>
                  {displayText || stringData}
                </div>
                {preAsilLevel && (
                  <div className="flex">
                    <span className="font-semibold text-da-gray-dark mr-1">ASIL Rating:</span>
                    {preAsilLevel === 'QM' ? 'QM' : `ASIL-${preAsilLevel}`}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
