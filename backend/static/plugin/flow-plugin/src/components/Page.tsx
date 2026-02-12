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

const parseCustomerJourneySteps = (journeyText: string | undefined): string[] => {
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
  const [customerJourneySteps, setCustomerJourneySteps] = useState<string[]>([])
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
      const steps = parseCustomerJourneySteps(prototype.customer_journey)
      setCustomerJourneySteps(steps)
      try {
        if (prototype.flow) {
          const parsedFlow = JSON.parse(prototype.flow)
          setFlowData(parsedFlow)
          setOriginalFlowData(parsedFlow)
        } else {
          const initialFlows = steps.map((step) => ({
            title: step,
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

  // Only sync step titles from customer journey when there is no saved flow (initial state).
  // When prototype.flow exists, flow is the source of truth and we must not overwrite user-edited titles.
  useEffect(() => {
    if (prototype?.flow) return
    if (flowData.length > 0 && customerJourneySteps.length > 0) {
      const synchronized = customerJourneySteps.map((stepTitle, index) => {
        const existing = flowData[index]
        if (existing) return { ...existing, title: stepTitle }
        return { title: stepTitle, flows: [createEmptyFlow()] }
      })
      setFlowData(synchronized)
    }
  }, [customerJourneySteps, prototype?.flow])

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
                  flowData.map((step, stepIndex) => (
                    <React.Fragment key={stepIndex}>
                      <tr>
                        <td
                          colSpan={FLOW_CELLS.length}
                          className="relative text-xs border font-semibold bg-da-primary-500 text-white h-10 px-8 z-0"
                        >
                          <TbChevronCompactRight className="absolute -left-[12px] top-1/2 -translate-x-1/4 -translate-y-1/2 size-[47px] bg-transparent text-white fill-current" />
                          {step.title}
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
                  ))
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
