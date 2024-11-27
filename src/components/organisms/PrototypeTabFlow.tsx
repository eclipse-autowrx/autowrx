import React from 'react'
import { TbArrowLeft, TbArrowRight, TbArrowsHorizontal } from 'react-icons/tb'
import useCurrentPrototype from '@/hooks/useCurrentPrototype'
import DaTooltip from '../atoms/DaTooltip'
import { FlowStep, Direction, SignalFlow } from '@/types/flow.type'
import {
  objectFlowData,
  stringifiedFlowData,
} from '../molecules/flow/flowMockData'
import DaPrototypeFlowEditor from '../molecules/flow/DaEditableFlowTable'
import { DaButton } from '../atoms/DaButton'

const DirectionArrow: React.FC<{ direction: Direction }> = ({ direction }) => {
  switch (direction) {
    case 'left':
      return <TbArrowLeft className="mx-auto size-4" />
    case 'right':
      return <TbArrowRight className="mx-auto size-4" />
    case 'bi-direction':
      return <TbArrowsHorizontal className="mx-auto size-4" />
  }
}

const SignalFlowCell: React.FC<{ flow: SignalFlow | null }> = ({ flow }) => {
  if (!flow) return null
  return (
    <div className="flex flex-col items-center gap-1 cursor-pointer">
      <DaTooltip content={flow.signal}>
        <DirectionArrow direction={flow.direction} />
      </DaTooltip>
    </div>
  )
}

const PrototypeTabFlow = () => {
  const { data: prototype } = useCurrentPrototype()
  const [isEditing, setIsEditing] = React.useState(false)
  const [flowData, setFlowData] = React.useState<FlowStep[]>(
    JSON.parse(stringifiedFlowData),
  )

  const handleSave = async (stringJsonData: string) => {
    try {
      console.log('Saving flow data:', stringJsonData)
      setFlowData(JSON.parse(stringJsonData))
      setIsEditing(false)
    } catch (error) {
      console.error('Error saving flow data:', error)
    }
  }

  return (
    <div className="flex w-full h-full p-2 gap-2 bg-slate-100 text-xs">
      <div className="flex w-full h-full flex-col bg-white rounded-md p-4">
        <div className="w-full overflow-x-auto">
          {isEditing ? (
            <DaPrototypeFlowEditor
              initialData={flowData}
              onSave={(jsonData) => handleSave(jsonData)}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <>
              <div className="flex items-center justify-between border-b pb-2 mb-4 ">
                <h2 className="text-sm font-semibold text-da-primary-500">
                  End-to-End Flow: Smart Trunk
                </h2>

                <DaButton
                  onClick={() => setIsEditing(!isEditing)}
                  className="w-[60px]"
                  variant="solid"
                  size="sm"
                >
                  {isEditing ? 'Cancel' : 'Edit'}
                </DaButton>
              </div>
              <table className="w-full border-collapse table-fixed">
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
                  <tr className="text-sm bg-da-primary-500 text-white uppercase">
                    <th
                      colSpan={3}
                      className="border border-r-transparent font-semibold p-2 "
                    >
                      Off-board
                    </th>
                    <th className="border border-r-transparent"></th>
                    <th colSpan={5} className="border font-semibold p-2">
                      On-board
                    </th>
                  </tr>
                  <tr className="text-xs text-da-gray-dark uppercase">
                    <th className="border p-2">Smart Phone</th>

                    <th className="border p-2">
                      <DaTooltip
                        content="Phone to Cloud"
                        className="normal-case"
                      >
                        <div className="cursor-pointer">p2c</div>
                      </DaTooltip>
                    </th>

                    <th className="border p-2">Cloud</th>
                    <th className="border p-2 border-x-2 border-x-da-primary-500">
                      <DaTooltip
                        content="Vehicle to Cloud"
                        className="normal-case"
                      >
                        <div className="cursor-pointer">v2c</div>
                      </DaTooltip>
                    </th>
                    <th className="border p-2">SDV Runtime</th>
                    <th className="border p-2">
                      <DaTooltip
                        content="System to System"
                        className="normal-case"
                      >
                        <div className="cursor-pointer">s2s</div>
                      </DaTooltip>
                    </th>
                    <th className="border p-2">Embedded</th>
                    <th className="border p-2">
                      <DaTooltip
                        content="System to ECU"
                        className="normal-case"
                      >
                        <div className="cursor-pointer">s2e</div>
                      </DaTooltip>
                    </th>
                    <th className="border p-2">Sensors/Actuators</th>
                  </tr>
                </thead>
                <tbody>
                  {flowData.map((step, stepIndex) => (
                    <React.Fragment key={stepIndex}>
                      <tr>
                        <td
                          colSpan={9}
                          className="border p-2 font-semibold bg-da-primary-100 text-da-primary-500"
                        >
                          {step.title}
                        </td>
                      </tr>
                      {step.flows.map((flow, flowIndex) => (
                        <tr key={flowIndex}>
                          <td className="border p-2 text-center">
                            {flow.offBoard.smartPhone}
                          </td>
                          <td className="border p-2 text-center">
                            <SignalFlowCell flow={flow.offBoard.p2c} />
                          </td>
                          <td className="border p-2 text-center">
                            {flow.offBoard.cloud}
                          </td>
                          <td className="border border-x-2 border-x-da-primary-500 p-2 text-center">
                            <SignalFlowCell flow={flow.v2c} />
                          </td>
                          <td className="border p-2 text-center">
                            {flow.onBoard.sdvRuntime}
                          </td>
                          <td className="border p-2 text-center">
                            <SignalFlowCell flow={flow.onBoard.s2s} />
                          </td>
                          <td className="border p-2 text-center">
                            {flow.onBoard.embedded}
                          </td>
                          <td className="border p-2 text-center">
                            <SignalFlowCell flow={flow.onBoard.s2e} />
                          </td>
                          <td className="border p-2 text-center">
                            {flow.onBoard.sensors}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default PrototypeTabFlow
