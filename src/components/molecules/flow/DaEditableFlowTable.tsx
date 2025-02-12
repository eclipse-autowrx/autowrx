import React, { useEffect, useState } from 'react'
import {
  TbArrowLeft,
  TbArrowRight,
  TbPlus,
  TbTrash,
  TbChevronCompactRight,
  TbArrowsLeftRight,
  TbCornerDownLeft,
  TbCornerDownRight,
  TbArrowsRightLeft,
} from 'react-icons/tb'
import DaTooltip from '@/components/atoms/DaTooltip'
import { FlowStep, Direction, SignalFlow } from '@/types/flow.type'
import { DaButton } from '@/components/atoms/DaButton'
import { DaTextarea } from '@/components/atoms/DaTextarea'
import { cn } from '@/lib/utils'
import { DaSelect, DaSelectItem } from '@/components/atoms/DaSelect'
import FlowItemEditor from './FlowItemEditor'
import FlowItem from './FlowItem'
interface TextCellProps {
  value: string
  onChange: (value: string) => void
}

interface FlowCell {
  key: string
  title: string
  tooltip?: string
  isSignalFlow?: boolean
  path: string[]
}

// Define the flow structure configuration
const FLOW_CELLS: FlowCell[] = [
  {
    key: 'smartPhone',
    title: 'Smart Phone',
    path: ['offBoard', 'smartPhone'],
  },
  {
    key: 'p2c',
    title: 'p2c',
    tooltip: 'Phone to Cloud',
    isSignalFlow: true,
    path: ['offBoard', 'p2c'],
  },
  {
    key: 'cloud',
    title: 'Cloud',
    path: ['offBoard', 'cloud'],
  },
  {
    key: 'v2c',
    title: 'v2c',
    tooltip: 'Vehicle to Cloud',
    isSignalFlow: true,
    path: ['v2c'],
  },
  {
    key: 'sdvRuntime',
    title: 'SDV Runtime',
    path: ['onBoard', 'sdvRuntime'],
  },
  {
    key: 's2s',
    title: 's2s',
    tooltip: 'System to System',
    isSignalFlow: true,
    path: ['onBoard', 's2s'],
  },
  {
    key: 'embedded',
    title: 'Embedded',
    path: ['onBoard', 'embedded'],
  },
  {
    key: 's2e',
    title: 's2e',
    tooltip: 'System to ECU',
    isSignalFlow: true,
    path: ['onBoard', 's2e'],
  },
  {
    key: 'sensors',
    title: 'Sensors/Actuators',
    path: ['onBoard', 'sensors'],
  },
]

interface DirectionSelectProps {
  value: Direction
  onChange: (value: Direction) => void
}

const DirectionSelect = ({ value, onChange }: DirectionSelectProps) => {
  const directionOptions = [
    {
      value: 'left',
      icon: <TbArrowLeft className="size-5" />,
    },
    {
      value: 'right',
      icon: <TbArrowRight className="size-5" />,
    },
    {
      value: 'bi-direction',
      icon: <TbArrowsRightLeft className="size-5" />,
    },
    {
      value: 'reverse-bi-direction',
      icon: <TbArrowsLeftRight className="size-5" />,
    },
    {
      value: 'down-left',
      icon: <TbCornerDownLeft className="size-5" />,
    },
    {
      value: 'down-right',
      icon: <TbCornerDownRight className="size-5" />,
    },
  ] as const

  const handleValueChange = (newValue: string) => {
    onChange(newValue as Direction)
  }

  return (
    <DaSelect
      className="h-9 rounded-md"
      value={value}
      onValueChange={handleValueChange}
      placeholderClassName="flex justify-center items-center w-full"
    >
      {directionOptions.map((direction, index) => (
        <DaSelectItem
          className="flex w-full justify-center items-center"
          value={direction.value}
          key={index}
        >
          {direction.icon}
        </DaSelectItem>
      ))}
    </DaSelect>
  )
}

interface SignalFlowEditorProps {
  flow: SignalFlow | null
  onChange: (flow: SignalFlow | null) => void
}

const SignalFlowEditor = ({ flow, onChange }: SignalFlowEditorProps) => {
  // Initialize with default values if flow is null
  const currentFlow = flow || { direction: 'left', signal: '' }

  return (
    <div className="flex flex-col gap-1 min-h-[75px] p-2">
      <DirectionSelect
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

interface DaPrototypeFlowEditorProps {
  initialData: FlowStep[]
  onUpdate: (data: string) => void
}

const DaPrototypeFlowEditor = ({
  initialData,
  onUpdate,
}: DaPrototypeFlowEditorProps) => {
  const [data, setData] = useState<FlowStep[]>(initialData)
  const createEmptyFlow = () => ({
    offBoard: {
      smartPhone: '',
      p2c: null,
      cloud: '',
    },
    v2c: null,
    onBoard: {
      sdvRuntime: '',
      s2s: null,
      embedded: '',
      s2e: null,
      sensors: '',
    },
  })

  const clearFlowValues = (flow: any) => {
    return {
      offBoard: {
        smartPhone: '',
        p2c: null,
        cloud: '',
      },
      v2c: null,
      onBoard: {
        sdvRuntime: '',
        s2s: null,
        embedded: '',
        s2e: null,
        sensors: '',
      },
    }
  }

  const addFlowToStep = (stepIndex: number) => {
    const newData = [...data]
    newData[stepIndex].flows.push(createEmptyFlow())
    setData(newData)
  }

  // Add this function to handle adding a new step
  const addStep = () => {
    setData([
      ...data,
      {
        title: 'New Step',
        flows: [createEmptyFlow()],
      },
    ])
  }

  const isLastFlowInStep = (stepIndex: number, flowIndex: number) => {
    return data[stepIndex].flows.length === 1
  }

  const getNestedValue = (obj: any, path: string[]) => {
    return path.reduce((acc, key) => acc?.[key], obj)
  }
  const setNestedValue = (obj: any, path: string[], value: any) => {
    const newObj = { ...obj }
    let current = newObj
    for (let i = 0; i < path.length - 1; i++) {
      current[path[i]] = { ...current[path[i]] }
      current = current[path[i]]
    }
    current[path[path.length - 1]] = value
    return newObj
  }

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

    // If this is the last flow in the step, clear its values instead of removing it
    if (isLastFlowInStep(stepIndex, flowIndex)) {
      newData[stepIndex].flows[flowIndex] = clearFlowValues(
        newData[stepIndex].flows[flowIndex],
      )
    } else {
      // If there are multiple flows, remove the selected flow
      newData[stepIndex].flows.splice(flowIndex, 1)
    }

    setData(newData)
  }

  const handleSave = () => {
    // Filter out empty steps (steps with no flows)
    const cleanedData = data.filter((step) => step.flows.length > 0)

    // Convert to JSON string
    const jsonString = JSON.stringify(cleanedData)

    // Call the onSave prop with the JSON string
    // onSave(jsonString)
  }

  useEffect(() => {
    const cleanedData = data.filter((step) => step.flows.length > 0)
    onUpdate(JSON.stringify(cleanedData))
  }, [data])

  useEffect(() => {
    if (initialData.length === 0) {
      addStep()
    }
  }, [initialData])

  return (
    <div className={cn('flex w-full h-full flex-col bg-white rounded-md')}>
      <>
        <table className="table-fixed w-full border-separate border-spacing-0">
          <colgroup>
            <col className="w-[11.11%]" />
            <col className="w-[11.11%]" />
            <col className="w-[11.11%]" />
            <col className="w-[11.11%]" />
            <col className="w-[11.11%]" />
            <col className="w-[11.11%]" />
            <col className="w-[11.11%]" />
            <col className="w-[11.11%]" />
            <col className="w-[11.11%]" />
          </colgroup>
          <thead className="sticky top-0 z-10 bg-gradient-to-tr from-da-secondary-500 to-da-primary-500 text-white">
            <tr className="text-sm uppercase">
              <th colSpan={3} className="font-semibold p-2 border border-white">
                Off-board
              </th>
              <th className="border border-white"></th>
              <th colSpan={5} className="font-semibold p-2 border border-white">
                On-board
              </th>
            </tr>
            <tr className="text-xs uppercase">
              <th className="p-2 border border-white">Smart Phone</th>
              <th className="p-2 border border-white bg-opacity-20">
                <DaTooltip content="Phone to Cloud" className="normal-case">
                  <div className="cursor-pointer">p2c</div>
                </DaTooltip>
              </th>
              <th className="p-2 border border-white">Cloud</th>
              <th className="p-2 border border-white bg-opacity-20">
                <DaTooltip content="Vehicle to Cloud" className="normal-case">
                  <div className="cursor-pointer">v2c</div>
                </DaTooltip>
              </th>
              <th className="p-2 border border-white">SDV Runtime</th>
              <th className="p-2 border border-white bg-opacity-20">
                <DaTooltip content="System to System" className="normal-case">
                  <div className="cursor-pointer">s2s</div>
                </DaTooltip>
              </th>
              <th className="p-2 border border-white">Embedded</th>
              <th className="p-2 border border-white bg-opacity-20">
                <DaTooltip content="System to ECU" className="normal-case">
                  <div className="cursor-pointer">s2e</div>
                </DaTooltip>
              </th>
              <th className="p-2 border border-white truncate">
                Sensors/Actuators
              </th>
            </tr>
          </thead>

          <tbody>
            <td colSpan={9} className="h-3"></td>
            {data.map((step, stepIndex) => (
              <React.Fragment key={stepIndex}>
                <tr>
                  <td
                    colSpan={9}
                    className="relative text-xs border font-semibold bg-da-primary-500 text-white h-9 px-8"
                  >
                    <TbChevronCompactRight className="absolute -left-[12px] top-[5.5px] -translate-x-1/4 -translate-y-1/4 size-[47px] bg-transparent text-white fill-current" />
                    {step.title}
                    <TbChevronCompactRight className="absolute -right-[1px] top-[5.5px] translate-x-1/2  -translate-y-1/4 size-[47px] bg-transparent text-da-primary-500 fill-current" />
                  </td>
                </tr>
                {step.flows.map((flow, flowIndex) => (
                  <tr key={flowIndex} className="group">
                    {FLOW_CELLS.map((cell) => (
                      <td
                        key={cell.key}
                        className={`border ${cell.key === 'v2c' ? '' : ''}`}
                      >
                        {cell.isSignalFlow ? (
                          <SignalFlowEditor
                            flow={getNestedValue(flow, cell.path)}
                            onChange={(newFlow) =>
                              updateFlow(
                                stepIndex,
                                flowIndex,
                                cell.path,
                                newFlow,
                              )
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
                                  // Return only the parsed description—even if it's empty.
                                  return parsed.description
                                } catch {
                                  // For plain text input, just return the text.
                                  return text
                                }
                              })()}
                            </div>
                          </FlowItemEditor>
                        )}
                      </td>
                    ))}
                    <button
                      className="min-h-[90px] ml-1 cursor-pointer hover:text-red-500 group-hover:block"
                      onClick={() => deleteFlow(stepIndex, flowIndex)}
                    >
                      <TbTrash className="size-5" />
                    </button>
                  </tr>
                ))}
                <tr>
                  <td colSpan={9} className="border-x p-2">
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
      </>
    </div>
  )
}

export default DaPrototypeFlowEditor
