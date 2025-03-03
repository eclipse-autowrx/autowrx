// DaFlowEditor.tsx
import React, { useEffect, useState } from 'react'
import { TbPlus, TbTrash, TbChevronCompactRight } from 'react-icons/tb'
import DaTooltip from '@/components/atoms/DaTooltip'
import { FlowStep, SignalFlow } from '@/types/flow.type'
import { DaButton } from '@/components/atoms/DaButton'
import { cn } from '@/lib/utils'
import FlowItemEditor from './FlowItemEditor'
import FlowDirectionSelector from './FlowDirectionSelector'
import {
  FLOW_CELLS,
  getNestedValue,
  setNestedValue,
  headerGroups,
} from './flow.utils'
import { createEmptyFlow } from './flow.utils'

interface SignalFlowEditorProps {
  flow: SignalFlow | null
  onChange: (flow: SignalFlow | null) => void
}

const SignalFlowEditor = ({ flow, onChange }: SignalFlowEditorProps) => {
  const currentFlow = flow || { direction: 'left', signal: '' }

  return (
    <div className="flex flex-col gap-1 min-h-[75px] p-2">
      <FlowDirectionSelector
        value={currentFlow.direction}
        onChange={(direction) => onChange({ ...currentFlow, direction })}
      />
      <DaTooltip
        content={currentFlow.signal}
        className={cn(currentFlow.signal.length > 0 ? '' : 'bg-transparent')}
        delay={200}
      >
        {' '}
      </DaTooltip>
      <input
        value={currentFlow.signal}
        onChange={(e) => onChange({ ...currentFlow, signal: e.target.value })}
        className="w-full text-xs font-medium rounded-md h-9 border px-2 focus-within:ring-1 outline-none focus-within:ring-da-primary-500"
        placeholder="Description"
      />
    </div>
  )
}

interface DaFlowEditorProps {
  initialData: FlowStep[]
  onUpdate: (data: string) => void
}

const DaFlowEditor = ({ initialData, onUpdate }: DaFlowEditorProps) => {
  const [data, setData] = useState<FlowStep[]>(initialData)

  const clearFlowValues = () => createEmptyFlow()

  const addFlowToStep = (stepIndex: number) => {
    const newData = [...data]
    newData[stepIndex].flows.push(createEmptyFlow())
    setData(newData)
  }

  // Handle adding a new step
  const addStep = () => {
    setData([
      ...data,
      {
        title: 'New Step',
        flows: [createEmptyFlow()],
      },
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
      newData[stepIndex].flows[flowIndex] = clearFlowValues()
    } else {
      newData[stepIndex].flows.splice(flowIndex, 1)
    }

    setData(newData)
  }

  // Update the parent when data changes
  useEffect(() => {
    const cleanedData = data.filter((step) => step.flows.length > 0)
    onUpdate(JSON.stringify(cleanedData))
  }, [data, onUpdate])

  // Ensure at least one step exists
  useEffect(() => {
    if (initialData.length === 0) {
      addStep()
    }
  }, [initialData])

  return (
    <div className={cn('flex w-full h-full flex-col bg-white rounded-md')}>
      <table className="table-fixed w-full border-separate border-spacing-0">
        <colgroup>
          {FLOW_CELLS.map((_, index) => (
            <col key={index} className="w-[11.11%]" />
          ))}
        </colgroup>
        <thead className="sticky top-0 z-10 bg-gradient-to-tr from-da-secondary-500 to-da-primary-500 text-white">
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
              <th key={cell.key} className="p-2 border border-white">
                {cell.tooltip ? (
                  <DaTooltip content={cell.tooltip} className="normal-case">
                    <div className="cursor-pointer">{cell.title}</div>
                  </DaTooltip>
                ) : (
                  cell.title
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={FLOW_CELLS.length} className="h-3"></td>
          </tr>
          {data.map((step, stepIndex) => (
            <React.Fragment key={stepIndex}>
              <tr>
                <td
                  colSpan={FLOW_CELLS.length}
                  className="relative text-xs border font-semibold bg-da-primary-500 text-white h-9 px-8"
                >
                  <TbChevronCompactRight className="absolute -left-[12px] top-[5.5px] -translate-x-1/4 -translate-y-1/4 size-[47px] bg-transparent text-white fill-current" />
                  {step.title}
                  <TbChevronCompactRight className="absolute -right-[1px] top-[5.5px] translate-x-1/2 -translate-y-1/4 size-[47px] bg-transparent text-da-primary-500 fill-current" />
                </td>
              </tr>
              {step.flows.map((flow, flowIndex) => (
                <tr key={flowIndex} className="group">
                  {FLOW_CELLS.map((cell) => (
                    <td key={cell.key} className="border">
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
                          <div className="flex h-[95px] p-2 w-full text-xs justify-center items-center cursor-pointer hover:border-[1.5px] hover:border-da-primary-500">
                            {(() => {
                              const text = getNestedValue(flow, cell.path)
                              try {
                                const parsed = JSON.parse(text)
                                return parsed.description
                              } catch {
                                return text
                              }
                            })()}
                          </div>
                        </FlowItemEditor>
                      )}
                    </td>
                  ))}
                  <td className="min-h-[90px] ml-1">
                    <button
                      className="hover:text-red-500 group-hover:block"
                      onClick={() => deleteFlow(stepIndex, flowIndex)}
                    >
                      <TbTrash className="size-5" />
                    </button>
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={FLOW_CELLS.length} className="border-x p-2">
                  <DaButton
                    onClick={() => addFlowToStep(stepIndex)}
                    size="sm"
                    variant="dash"
                    className="w-full"
                  >
                    <TbPlus className="size-4 mr-2" /> Add Flow
                  </DaButton>
                </td>
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default DaFlowEditor
