import React, { useState } from 'react'
import {
  TbArrowLeft,
  TbArrowRight,
  TbArrowsHorizontal,
  TbPlus,
  TbTrash,
} from 'react-icons/tb'
import DaTooltip from '@/components/atoms/DaTooltip'
import { FlowStep, Direction, SignalFlow } from '@/types/flow.type'
import { DaSelect, DaSelectItem } from '@/components/atoms/DaSelect'
import { DaButton } from '@/components/atoms/DaButton'
import { DaInput } from '@/components/atoms/DaInput'
import { DaTextarea } from '@/components/atoms/DaTextarea'
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuItem,
  ContextMenuContent,
} from '@/components/atoms/context-menu'

interface TextCellProps {
  value: string
  onChange: (value: string) => void
}

const TextCell = ({ value, onChange }: TextCellProps) => (
  <DaTextarea
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="w-full h-full text-center resize-none"
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
  return (
    <DaSelect
      value={value}
      onValueChange={(value) => onChange(value as Direction)}
      className="h-9 border"
    >
      <DaSelectItem value="left">
        <TbArrowLeft className="mx-auto size-4" />
      </DaSelectItem>
      <DaSelectItem value="right">
        <TbArrowRight className="mx-auto size-4" />
      </DaSelectItem>
      <DaSelectItem value="bi-direction">
        <TbArrowsHorizontal className="mx-auto size-4" />
      </DaSelectItem>
    </DaSelect>
  )
}

interface SignalFlowEditorProps {
  flow: SignalFlow | null
  onChange: (flow: SignalFlow | null) => void
}

const SignalFlowEditor = ({ flow, onChange }: SignalFlowEditorProps) => {
  if (!flow) {
    return (
      <div className="flex min-h-[75px]">
        <button
          className="flex w-full items-center justify-center text-xs  p-2 text-da-primary-500 hover:bg-da-primary-100 border border-dashed border-da-primary-500 rounded"
          onClick={() => onChange({ direction: 'right', signal: '' })}
        >
          <TbPlus className="size-3 mr-1 hidden xl:flex" /> Add Signal
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1 ">
      <DirectionSelect
        value={flow.direction}
        onChange={(direction) => onChange({ ...flow, direction })}
      />
      <input
        value={flow.signal}
        onChange={(e) => onChange({ ...flow, signal: e.target.value })}
        className="w-full rounded-md h-9 border p-1 ring-0 outline-none"
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

  return (
    <div className="flex flex-col w-full h-full">
      <table className=" table-fixed w-full">
        <colgroup>
          <col className="w-[16%]" />
          <col className="w-[8%]" />
          <col className="w-[16%]" />
          <col className="w-[8%]" />
          <col className="w-[16%]" />
          <col className="w-[8%]" />
          <col className="w-[16%]" />
          <col className="w-[8%]" />
          <col className="w-[16%]" />
        </colgroup>
        <thead>
          <tr className="text-sm text-white uppercase">
            <th
              colSpan={3}
              className="bg-da-primary-100 text-da-primary-500 border border-r-transparent font-semibold p-2 "
            >
              Off-board
            </th>
            <th className="border border-r-transparent"></th>
            <th
              colSpan={5}
              className="bg-da-primary-500 border font-semibold p-2"
            >
              On-board
            </th>
          </tr>
          <tr className="text-xs text-da-gray-dark uppercase">
            <th className="border p-2">Smart Phone</th>

            <th className="border p-2">
              <DaTooltip content="Phone to Cloud" className="normal-case">
                <div className="cursor-pointer">p2c</div>
              </DaTooltip>
            </th>

            <th className="border p-2">Cloud</th>
            <th className="border p-2">
              <DaTooltip content="Vehicle to Cloud" className="normal-case">
                <div className="cursor-pointer">v2c</div>
              </DaTooltip>
            </th>
            <th className="border p-2">SDV Runtime</th>
            <th className="border p-2">
              <DaTooltip content="System to System" className="normal-case">
                <div className="cursor-pointer">s2s</div>
              </DaTooltip>
            </th>
            <th className="border p-2">Embedded</th>
            <th className="border p-2">
              <DaTooltip content="System to ECU" className="normal-case">
                <div className="cursor-pointer">s2e</div>
              </DaTooltip>
            </th>
            <th className="border p-2">Sensors/Actuators</th>
          </tr>
        </thead>

        <tbody>
          {data.map((step, stepIndex) => (
            <React.Fragment key={stepIndex}>
              <tr>
                <td colSpan={9} className="border p-2">
                  <DaInput
                    type="text"
                    value={step.title}
                    onChange={(e) => {
                      const newData = [...data]
                      newData[stepIndex].title = e.target.value
                      setData(newData)
                    }}
                    className="w-full rounded !text-xs"
                    inputClassName="text-sm font-medium text-da-primary-500"
                  />
                </td>
              </tr>
              {step.flows.map((flow, flowIndex) => (
                <tr key={flowIndex}>
                  {FLOW_CELLS.map((cell) => (
                    <td
                      key={cell.key}
                      className={`border p-2 ${cell.key === 'v2c' ? '' : ''}`}
                    >
                      {cell.isSignalFlow ? (
                        <ContextMenu>
                          <ContextMenuTrigger>
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
                          </ContextMenuTrigger>
                          <ContextMenuContent className="bg-white z-100">
                            <ContextMenuItem
                              className="cursor-pointer hover:text-red-500"
                              onClick={() => console.log('Delete item index')}
                            >
                              <TbTrash className="size-4 mr-1" />
                              Delete
                            </ContextMenuItem>
                          </ContextMenuContent>
                        </ContextMenu>
                      ) : (
                        <TextCell
                          value={getNestedValue(flow, cell.path)}
                          onChange={(value) =>
                            updateFlow(stepIndex, flowIndex, cell.path, value)
                          }
                        />
                      )}
                    </td>
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
          <tr>
            <td colSpan={9} className="px-2">
              <DaButton onClick={addStep} className="w-full" size="sm">
                <TbPlus className="size-4 mr-2" /> Add Step
              </DaButton>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export default DaPrototypeFlowEditor
