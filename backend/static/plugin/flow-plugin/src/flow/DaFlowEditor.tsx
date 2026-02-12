// Copyright (c) 2025 Eclipse Foundation.
// SPDX-License-Identifier: MIT

import React, { useEffect, useState } from 'react'
import { TbPlus, TbTrash, TbChevronCompactRight } from 'react-icons/tb'
import { cn } from '../lib/utils'
import type { FlowStep, SignalFlow } from '../types/flow.type'
import FlowItemEditor from './FlowItemEditor'
import FlowDirectionSelector from './FlowDirectionSelector'
import {
  FLOW_CELLS,
  getNestedValue,
  setNestedValue,
  headerGroups,
  createEmptyFlow,
} from './flow.utils'

interface SignalFlowEditorProps {
  flow: SignalFlow | null
  onChange: (flow: SignalFlow | null) => void
}

const SignalFlowEditor = ({ flow, onChange }: SignalFlowEditorProps) => {
  const currentFlow = flow || { direction: 'left' as const, signal: '' }
  return (
    <div className="flex flex-col gap-1 min-h-[75px] p-2">
      <FlowDirectionSelector
        value={currentFlow.direction}
        onChange={(direction) => onChange({ ...currentFlow, direction })}
      />
      <input
        value={currentFlow.signal}
        onChange={(e) => onChange({ ...currentFlow, signal: e.target.value })}
        className="w-full text-xs font-medium rounded-md h-9 border px-2 focus:outline-none focus:ring-1 focus:ring-da-primary-500"
        placeholder="Description"
      />
    </div>
  )
}

interface DaFlowEditorProps {
  initialData: FlowStep[]
  onUpdate: (data: string) => void
}

export default function DaFlowEditor({ initialData, onUpdate }: DaFlowEditorProps) {
  const [data, setData] = useState<FlowStep[]>(initialData)

  const addFlowToStep = (stepIndex: number) => {
    const newData = [...data]
    newData[stepIndex].flows.push(createEmptyFlow())
    setData(newData)
  }

  const addStep = () => {
    setData([
      ...data,
      { title: 'New Step', flows: [createEmptyFlow()] },
    ])
  }

  const isLastFlowInStep = (stepIndex: number, flowIndex: number) =>
    data[stepIndex].flows.length === 1

  const updateFlow = (
    stepIndex: number,
    flowIndex: number,
    path: string[],
    value: any,
  ) => {
    const newData = [...data]
    newData[stepIndex].flows[flowIndex] = setNestedValue(
      newData[stepIndex].flows[flowIndex],
      path,
      value,
    )
    setData(newData)
  }

  const deleteFlow = (stepIndex: number, flowIndex: number) => {
    const newData = [...data]
    if (isLastFlowInStep(stepIndex, flowIndex)) {
      newData[stepIndex].flows[flowIndex] = createEmptyFlow()
    } else {
      newData[stepIndex].flows.splice(flowIndex, 1)
    }
    setData(newData)
  }

  const updateStepTitle = (stepIndex: number, title: string) => {
    const newData = [...data]
    newData[stepIndex] = { ...newData[stepIndex], title }
    setData(newData)
  }

  useEffect(() => {
    const cleanedData = data.filter((step) => step.flows.length > 0)
    onUpdate(JSON.stringify(cleanedData))
  }, [data, onUpdate])

  useEffect(() => {
    if (initialData.length === 0) addStep()
  }, [])

  return (
    <div className={cn('flex w-full h-full flex-col bg-white rounded-md')}>
      <table className="table-fixed w-full border-collapse">
        <colgroup>
          {FLOW_CELLS.map((_, i) => (
            <col key={i} className="w-[11%]" />
          ))}
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
              <th key={cell.key} className="p-2 border border-white" title={cell.tooltip}>
                {cell.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={FLOW_CELLS.length} className="h-3" />
          </tr>
          {data.map((step, stepIndex) => (
            <React.Fragment key={stepIndex}>
              <tr>
                <td
                  colSpan={FLOW_CELLS.length}
                  className="relative text-xs border font-semibold bg-da-primary-500 text-white h-10 px-8"
                >
                  <TbChevronCompactRight className="absolute -left-[12px] top-1/2 -translate-x-1/4 -translate-y-1/2 size-[47px] bg-transparent text-white fill-current" />
                  <input
                    type="text"
                    value={step.title}
                    onChange={(e) => updateStepTitle(stepIndex, e.target.value)}
                    className="step-title-input w-full bg-transparent text-white placeholder-white/70 font-semibold text-xs border-none focus:outline-none"
                    placeholder="Step name"
                  />
                  <TbChevronCompactRight className="absolute -right-px top-1/2 translate-x-1/2 -translate-y-1/2 size-[47px] bg-transparent text-da-primary-500 fill-current" />
                </td>
              </tr>
              {step.flows.map((flow, flowIndex) => (
                <tr key={flowIndex} className="group">
                  {FLOW_CELLS.map((cell, cellIndex) => (
                    <td
                      key={cell.key}
                      className={cn(
                        'border',
                        cellIndex === FLOW_CELLS.length - 1 && 'relative overflow-visible',
                      )}
                    >
                      {cell.isSignalFlow ? (
                        <SignalFlowEditor
                          flow={getNestedValue(flow, cell.path)}
                          onChange={(newFlow) =>
                            updateFlow(stepIndex, flowIndex, cell.path, newFlow)
                          }
                        />
                      ) : (
                        <FlowItemEditor
                          value={getNestedValue(flow, cell.path)}
                          onChange={(value) =>
                            updateFlow(stepIndex, flowIndex, cell.path, value)
                          }
                        >
                            <div className="flex h-[95px] p-2 text-xs justify-center items-center cursor-pointer hover:border-[1.5px] hover:border-da-primary-500">
                            <div className="line-clamp-4">
                              {(() => {
                                const text = getNestedValue(flow, cell.path)
                                try {
                                  const parsed = JSON.parse(text)
                                  return parsed.description || text
                                } catch {
                                  return text
                                }
                              })()}
                            </div>
                          </div>
                        </FlowItemEditor>
                      )}
                      {cellIndex === FLOW_CELLS.length - 1 && (
                        <button
                          type="button"
                          className="absolute -right-6 top-1/2 -translate-y-1/2 text-red-500 hover:text-red-600 cursor-pointer z-10"
                          onClick={() => deleteFlow(stepIndex, flowIndex)}
                          title="Delete flow"
                        >
                          <TbTrash className="size-5 shrink-0" />
                        </button>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td
                  colSpan={FLOW_CELLS.length}
                  className={cn(
                    'border-x p-2',
                    stepIndex === data.length - 1 && 'border-b',
                  )}
                >
                  <button
                    onClick={() => addFlowToStep(stepIndex)}
                    className="w-full flex items-center justify-center gap-2 px-2 py-1.5 text-sm border border-dashed rounded border-da-primary-500 hover:bg-da-primary-100"
                  >
                    <TbPlus className="size-4" /> Add Flow
                  </button>
                </td>
              </tr>
            </React.Fragment>
          ))}
          <tr>
            <td colSpan={FLOW_CELLS.length} className="border-x border-b p-2">
              <button
                type="button"
                onClick={addStep}
                className="w-full flex items-center justify-center gap-2 px-2 py-1.5 text-sm border border-dashed rounded border-da-primary-500 hover:bg-da-primary-100"
              >
                <TbPlus className="size-4" /> Add Step
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
