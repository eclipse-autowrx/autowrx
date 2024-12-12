import React, { useEffect, useState } from 'react'
import {
  TbAlertCircle,
  TbArrowLeft,
  TbArrowRight,
  TbArrowsHorizontal,
  TbPlus,
  TbTrash,
} from 'react-icons/tb'
import DaTooltip from '@/components/atoms/DaTooltip'
import { FlowStep, Direction, SignalFlow } from '@/types/flow.type'
import { DaButton } from '@/components/atoms/DaButton'
import { DaInput } from '@/components/atoms/DaInput'
import { DaTextarea } from '@/components/atoms/DaTextarea'
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuItem,
  ContextMenuContent,
} from '@/components/atoms/context-menu'
import { cn } from '@/lib/utils'

interface TextCellProps {
  value: string
  onChange: (value: string) => void
}

const TextCell = ({ value, onChange }: TextCellProps) => (
  <DaTextarea
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="font-medium w-full h-full text-center resize-none p-2"
    textareaClassName="resize-none !h-[75px] !text-xs"
  />
)

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
  // Define the order of toggling and map to the corresponding icons
  const directions: Direction[] = ['left', 'right', 'bi-direction']
  const icons = {
    left: <TbArrowLeft className="size-5" />,
    right: <TbArrowRight className="size-5" />,
    'bi-direction': <TbArrowsHorizontal className="size-5" />,
  }

  // Handle button click to toggle to the next direction
  const handleToggle = () => {
    const currentIndex = directions.indexOf(value)
    const nextIndex = (currentIndex + 1) % directions.length
    onChange(directions[nextIndex])
  }

  return (
    <button
      onClick={handleToggle}
      className="h-9 flex justify-center items-center border border-da-primary-500 rounded-md w-full focus:outline-none text-da-primary-500"
    >
      {icons[value]}
    </button>
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
    <div className="flex flex-col gap-1 min-h-[75px] bg-da-primary-100 p-2">
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
        className="w-full font-medium rounded-md h-9 border border-da-primary-500 px-2 ring-0 outline-none bg-da-primary-100 text-da-primary-500 placeholder:text-da-primary-500"
        placeholder="Signal"
      />
    </div>
  )
}

interface DaPrototypeFlowEditorProps {
  initialData: FlowStep[]
  onSave: (data: string) => void
  onCancel: () => void
}

const DaPrototypeFlowEditor = ({
  initialData,
  onSave,
  onCancel,
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
    newData[stepIndex].flows.splice(flowIndex, 1)
    setData(newData)
  }

  const handleSave = () => {
    // Filter out empty steps (steps with no flows)
    const cleanedData = data.filter((step) => step.flows.length > 0)

    // Convert to JSON string
    const jsonString = JSON.stringify(cleanedData)

    // Call the onSave prop with the JSON string
    onSave(jsonString)
  }

  useEffect(() => {
    if (initialData.length === 0) {
      addStep()
    }
  }, [initialData])

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex items-center justify-between border-b pb-2 mb-4 ">
        <h2 className="text-sm font-semibold text-da-primary-500">
          End-to-End Flow: Smart Trunk
        </h2>
        <div className="flex items-center space-x-2">
          <div className="text-sm mr-2">
            Right-click on any row to access delete options
          </div>
          <DaButton
            onClick={onCancel}
            className="w-fit"
            variant="outline-nocolor"
            size="sm"
          >
            Discard Changes
          </DaButton>
          <DaButton
            onClick={handleSave}
            className="w-[60px]"
            variant="solid"
            size="sm"
          >
            Save
          </DaButton>
        </div>
      </div>
      <div className="flex flex-col w-full h-full overflow-y-auto">
        <table className=" table-fixed w-full overflow">
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
          <thead className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
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
            {data.map((step, stepIndex) => (
              <React.Fragment key={stepIndex}>
                <tr>
                  <td
                    colSpan={9}
                    className="border p-2 bg-da-primary-500 text-white font-semibold text-sm"
                  >
                    {step.title}
                  </td>
                </tr>
                {step.flows.map((flow, flowIndex) => (
                  <tr key={flowIndex}>
                    {FLOW_CELLS.map((cell) => (
                      <ContextMenu>
                        <td
                          key={cell.key}
                          className={`border ${cell.key === 'v2c' ? '' : ''}`}
                        >
                          <ContextMenuTrigger>
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
                              <TextCell
                                value={getNestedValue(flow, cell.path)}
                                onChange={(value) =>
                                  updateFlow(
                                    stepIndex,
                                    flowIndex,
                                    cell.path,
                                    value,
                                  )
                                }
                              />
                            )}
                            <ContextMenuContent className="bg-white z-100">
                              {isLastFlowInStep(stepIndex, flowIndex) ? (
                                <ContextMenuItem className="cursor-not-allowed text-gray-400">
                                  <TbAlertCircle className="size-4 mr-1" />
                                  Cannot delete last flow in step
                                </ContextMenuItem>
                              ) : (
                                <ContextMenuItem
                                  className="cursor-pointer hover:text-red-500"
                                  onClick={() =>
                                    deleteFlow(stepIndex, flowIndex)
                                  }
                                >
                                  <TbTrash className="size-4 mr-1" />
                                  Delete Flow
                                </ContextMenuItem>
                              )}
                            </ContextMenuContent>
                          </ContextMenuTrigger>
                        </td>
                      </ContextMenu>
                    ))}
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
      </div>
    </div>
  )
}

export default DaPrototypeFlowEditor
