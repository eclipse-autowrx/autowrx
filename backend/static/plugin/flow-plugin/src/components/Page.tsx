// Copyright (c) 2025 Eclipse Foundation.
// SPDX-License-Identifier: MIT

import React, { useEffect, useState } from 'react'
import {
  TbArrowsMaximize,
  TbArrowsMinimize,
  TbEdit,
  TbLoader,
  TbChevronCompactRight,
} from 'react-icons/tb'
import { cn } from '../lib/utils'
import { flowPluginStyles } from '../flow-styles'
import type { FlowStep } from '../types/flow.type'
import FlowItem from '../flow/FlowItem'
import FlowInterface from '../flow/FlowInterface'
import DaFlowEditor from '../flow/DaFlowEditor'
import FlowItemEditor from '../flow/FlowItemEditor'
import {
  FLOW_CELLS,
  setNestedValue,
  getNestedValue,
  headerGroups,
  createEmptyFlow,
} from '../flow/flow.utils'
import type { Interface } from '../types/flow.type'

type PluginAPI = {
  updatePrototype?: (updates: { flow?: string }) => Promise<any>
}

type PageProps = {
  data?: { prototype?: any; model?: any }
  config?: any
  api?: PluginAPI
}

/** Parsed Customer Journey step (same format as DaCustomerJourneyTable: #StepName, Who:, What:, Customer TouchPoints:) */
export type JourneyStepData = {
  stepTitle: string
  who: string
  what: string
  customerTouchPoints: string
}

function getTableColumns(tableString: string | undefined): string[] {
  if (!tableString || tableString.length < 10) return []
  const lines = tableString.split('\n')
  const columnNames: string[] = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line.startsWith('#')) {
      const columnName = line.slice(1).trim()
      if (columnName) columnNames.push(columnName)
    }
  }
  return columnNames
}

function parseTableData(tableString: string | undefined): { rowName: string; [col: string]: string }[] {
  if (!tableString) return []
  const lines = tableString.split('\n')
  const tableData: { rowName: string; [col: string]: string }[] = []
  let currentColumnName: string | null = null
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line.startsWith('#')) {
      currentColumnName = line.slice(1).trim()
    } else if (line.includes(':')) {
      const colonIndex = line.indexOf(':')
      const rowName = line.slice(0, colonIndex).trim()
      const cellValue = line.slice(colonIndex + 1).trim()
      const rowIndex = tableData.findIndex((row) => row.rowName === rowName)
      if (rowIndex === -1) {
        const newRow: { rowName: string; [col: string]: string } = { rowName }
        if (currentColumnName) newRow[currentColumnName] = cellValue
        tableData.push(newRow)
      } else if (currentColumnName) {
        tableData[rowIndex][currentColumnName] = cellValue
      }
    }
  }
  return tableData
}

/** Parse customer_journey into steps with Who / What / Customer TouchPoints (same format as Customer Journey tab). */
function parseCustomerJourneyFull(journeyText: string | undefined): JourneyStepData[] {
  if (!journeyText || journeyText.length < 10) return []
  const columnNames = getTableColumns(journeyText)
  const tableData = parseTableData(journeyText)
  const getCell = (rowName: string, colName: string): string =>
    (tableData.find((r) => r.rowName === rowName)?.[colName] as string) ?? ''
  return columnNames.map((stepTitle) => ({
    stepTitle,
    who: getCell('Who', stepTitle),
    what: getCell('What', stepTitle),
    customerTouchPoints: getCell('Customer TouchPoints', stepTitle),
  }))
}

/** Fallback: only step titles (first line after each #). */
function parseCustomerJourneySteps(journeyText: string | undefined): string[] {
  if (!journeyText) return []
  return journeyText
    .split('#')
    .filter((step) => step.trim())
    .map((step) => step.split('\n')[0].trim())
}

export default function Page({ data, api }: PageProps) {
  const prototype = data?.prototype
  const model = data?.model
  const modelId = model?.id

  const [isEditing, setIsEditing] = useState(false)
  /** Parsed Customer Journey steps (Who / What / Customer TouchPoints) for display and initial flow. */
  const [journeyStepsData, setJourneyStepsData] = useState<JourneyStepData[]>([])
  const [originalFlowData, setOriginalFlowData] = useState<FlowStep[]>([])
  const [flowData, setFlowData] = useState<FlowStep[]>([])
  const [flowString, setFlowString] = useState('')
  const [showASIL, setShowASIL] = useState(false)
  const [fullScreen, setFullScreen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [flowEditorOpen, setFlowEditorOpen] = useState(false)
  const [currentEditingCell, setCurrentEditingCell] = useState<{
    stepIndex: number
    flowIndex: number
    fieldPath: string[]
    value: string
  } | null>(null)

  useEffect(() => {
    if (prototype) {
      const fullSteps = parseCustomerJourneyFull(prototype.customer_journey)
      setJourneyStepsData(fullSteps)
      const stepTitles =
        fullSteps.length > 0
          ? fullSteps.map((s) => s.stepTitle)
          : parseCustomerJourneySteps(prototype.customer_journey)
      try {
        if (prototype.flow) {
          const parsedFlow = JSON.parse(prototype.flow)
          setFlowData(parsedFlow)
          setOriginalFlowData(parsedFlow)
        } else {
          const initialFlows = (stepTitles.length > 0 ? stepTitles : ['Step 1']).map((title) => ({
            title,
            flows: [createEmptyFlow()],
          }))
          setFlowData(initialFlows)
          setOriginalFlowData(initialFlows)
        }
      } catch (error) {
        console.error('Error parsing flow data:', error)
      }
    }
  }, [prototype])

  // Sync step titles from customer journey when there is no saved flow (initial state).
  useEffect(() => {
    if (prototype?.flow) return
    if (flowData.length > 0 && journeyStepsData.length > 0) {
      const synchronized = journeyStepsData.map((j, index) => {
        const existing = flowData[index]
        if (existing) return { ...existing, title: j.stepTitle }
        return { title: j.stepTitle, flows: [createEmptyFlow()] }
      })
      setFlowData(synchronized)
    }
  }, [journeyStepsData, prototype?.flow])

  const handleSave = async (stringJsonData: string) => {
    if (!prototype?.id || !api?.updatePrototype) return
    try {
      setIsSaving(true)
      const parsedData = JSON.parse(stringJsonData)
      setFlowData(parsedData)
      await api.updatePrototype({ flow: stringJsonData })
    } catch (error) {
      console.error('Error saving flow data:', error)
    } finally {
      setIsSaving(false)
      setIsEditing(false)
    }
  }

  const updateFlowCell = (
    stepIndex: number,
    flowIndex: number,
    path: string[],
    value: any,
  ) => {
    const newData = [...flowData]
    newData[stepIndex].flows[flowIndex] = setNestedValue(
      newData[stepIndex].flows[flowIndex],
      path,
      value,
    )
    setFlowData(newData)
    setFlowString(JSON.stringify(newData))
    handleSave(JSON.stringify(newData))
  }

  const openFlowEditor = (
    stepIndex: number,
    flowIndex: number,
    fieldPath: string[],
    value: string,
  ) => {
    setCurrentEditingCell({ stepIndex, flowIndex, fieldPath, value })
    setFlowEditorOpen(true)
  }

  return (
    <div
      className={cn(
        'flow-plugin-root flex w-full h-full flex-col bg-white rounded-md py-4 px-10',
        fullScreen && 'fixed inset-0 z-50 overflow-auto bg-white',
      )}
    >
      <style>{flowPluginStyles}</style>
      <div className="w-full max-w-[120rem] mx-auto min-w-0 self-center">
        <div className="flex items-center border-b pb-2 mb-4">
          <span className="text-lg font-semibold text-da-primary-500">
            End-to-End Flow: {prototype?.name}
          </span>
          <div className="grow" />
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="btn-outline"
              >
                <TbEdit className="w-4 h-4" /> Edit
              </button>
            ) : isSaving ? (
              <div className="flex items-center text-da-primary-500">
                <TbLoader className="w-4 h-4 mr-1 animate-spin" />
                Saving
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setFlowData(originalFlowData)
                    setFlowString(JSON.stringify(originalFlowData))
                    setIsEditing(false)
                  }}
                  className="btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSave(flowString)}
                  className="btn-primary"
                >
                  Save
                </button>
              </div>
            )}
            <button
              onClick={() => setFullScreen(!fullScreen)}
              className="btn-outline"
              title={fullScreen ? 'Exit full screen' : 'Full screen'}
            >
              {fullScreen ? (
                <TbArrowsMinimize className="size-4" />
              ) : (
                <TbArrowsMaximize className="size-4" />
              )}
            </button>
          </div>
        </div>

        {isEditing ? (
          <DaFlowEditor
            initialData={flowData}
            onUpdate={(jsonData) => setFlowString(jsonData)}
          />
        ) : (
          <>
            <table className="w-full table-fixed border-collapse">
              <colgroup>
                <col className="w-[17.76%]" />
                <col className="w-[2.80%] min-w-[40px]" />
                <col className="w-[17.76%]" />
                <col className="w-[2.80%] min-w-[40px]" />
                <col className="w-[17.76%]" />
                <col className="w-[2.80%] min-w-[40px]" />
                <col className="w-[17.76%]" />
                <col className="w-[2.80%] min-w-[40px]" />
                <col className="w-[17.76%]" />
              </colgroup>
              <thead className="sticky top-0 z-10 bg-gradient-flow-header text-white">
                <tr className="text-sm uppercase">
                  {headerGroups.map((group, idx) => (
                    <th
                      key={idx}
                      colSpan={group.cells.length}
                      className="font-semibold p-2 border border-white text-center"
                    >
                      {group.label}
                    </th>
                  ))}
                </tr>
                <tr className="text-sm uppercase">
                  {FLOW_CELLS.map((cell) => (
                    <th
                      key={cell.key}
                      className={`p-2 text-xs border border-white ${cell.tooltip ? 'bg-opacity-20' : ''}`}
                      title={cell.tooltip}
                    >
                      {cell.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {FLOW_CELLS.map((_, index) => (
                    <td
                      key={index}
                      className={`h-3 ${index % 2 === 0 ? 'bg-white' : 'bg-da-primary-100'}`}
                    />
                  ))}
                </tr>
                {flowData?.length > 0 ? (
                  flowData.map((step, stepIndex) => {
                    const journeyStep = journeyStepsData[stepIndex]
                    return (
                    <React.Fragment key={stepIndex}>
                      <tr>
                        <td
                          colSpan={FLOW_CELLS.length}
                          className="relative text-xs border font-semibold bg-da-primary-500 text-white px-8 py-3 z-0 align-top"
                        >
                          <TbChevronCompactRight className="absolute -left-[12px] top-1/2 -translate-x-1/4 -translate-y-1/2 size-[47px] bg-transparent text-white fill-current" />
                          <div className="flex flex-col gap-0.5">
                            <span>{step.title}</span>
                            {/* {journeyStep && (journeyStep.who || journeyStep.what || journeyStep.customerTouchPoints) && (
                              <div className="font-normal text-white/90 text-[11px] mt-1 space-y-0.5">
                                {journeyStep.who && <div><span className="opacity-80">Who:</span> {journeyStep.who}</div>}
                                {journeyStep.what && <div><span className="opacity-80">What:</span> {journeyStep.what}</div>}
                                {journeyStep.customerTouchPoints && <div><span className="opacity-80">Customer TouchPoints:</span> {journeyStep.customerTouchPoints}</div>}
                              </div>
                            )} */}
                          </div>
                          <TbChevronCompactRight className="absolute -right-px top-1/2 translate-x-1/2 -translate-y-1/2 size-[47px] bg-transparent text-da-primary-500 fill-current" />
                        </td>
                      </tr>
                      {step.flows.map((flow, flowIndex) => (
                        <tr key={flowIndex} className="font-medium text-xs">
                          {FLOW_CELLS.map((cell) => {
                            const cellValue = getNestedValue(flow, cell.path)
                            return (
                              <td
                                key={cell.key}
                                className={`border p-2 text-center ${cell.isSignalFlow ? 'bg-da-primary-100' : ''}`}
                              >
                                {cell.isSignalFlow ? (
                                  <FlowInterface
                                    flow={cellValue}
                                    interfaceType={cell.key as Interface}
                                    modelId={modelId}
                                  />
                                ) : (
                                  <FlowItem
                                    stringData={cellValue}
                                    onEdit={(val) =>
                                      openFlowEditor(
                                        stepIndex,
                                        flowIndex,
                                        cell.path,
                                        val,
                                      )
                                    }
                                    showASIL={showASIL}
                                    isAuthorized={true}
                                  />
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </React.Fragment>
                    )
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={FLOW_CELLS.length}
                      className="border p-2 text-center py-4 text-sm"
                    >
                      No flow available. Please edit to add flow data.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </>
        )}
        {!isEditing && (
          <label className="flex items-center gap-2 mt-2 text-sm cursor-pointer w-fit">
            <input
              type="checkbox"
              checked={showASIL}
              onChange={() => setShowASIL(!showASIL)}
              className="w-4 h-4"
            />
            Show ASIL/QM Levels
          </label>
        )}
      </div>

      {currentEditingCell && (
        <FlowItemEditor
          value={currentEditingCell.value}
          onChange={(updatedValue) => {
            updateFlowCell(
              currentEditingCell.stepIndex,
              currentEditingCell.flowIndex,
              currentEditingCell.fieldPath,
              updatedValue,
            )
            setFlowEditorOpen(false)
            setCurrentEditingCell(null)
          }}
          open={flowEditorOpen}
          onOpenChange={(open) => {
            setFlowEditorOpen(open)
            if (!open) setCurrentEditingCell(null)
          }}
          isSaveMode={true}
        />
      )}
    </div>
  )
}
