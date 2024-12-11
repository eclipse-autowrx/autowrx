import React, { useEffect } from 'react'
import { TbArrowLeft, TbArrowRight, TbArrowsHorizontal } from 'react-icons/tb'
import useCurrentPrototype from '@/hooks/useCurrentPrototype'
import { updatePrototypeService } from '@/services/prototype.service'
import DaTooltip from '../atoms/DaTooltip'
import { FlowStep, Direction, SignalFlow } from '@/types/flow.type'
import DaPrototypeFlowEditor from '../molecules/flow/DaEditableFlowTable'
import { DaButton } from '../atoms/DaButton'

const DirectionArrow: React.FC<{ direction: Direction }> = ({ direction }) => {
  switch (direction) {
    case 'left':
      return <TbArrowLeft className="mx-auto size-5 text-da-primary-500" />
    case 'right':
      return <TbArrowRight className="mx-auto size-5 text-da-primary-500" />
    case 'bi-direction':
      return (
        <TbArrowsHorizontal className="mx-auto size-5 text-da-primary-500" />
      )
  }
}

const SignalFlowCell: React.FC<{ flow: SignalFlow | null }> = ({ flow }) => {
  if (!flow) return <div className="p-2"></div>
  return (
    <div className="flex flex-col items-center gap-1 cursor-pointer">
      {flow.signal && (
        <DaTooltip content={flow.signal}>
          <DirectionArrow direction={flow.direction} />
        </DaTooltip>
      )}
    </div>
  )
}

const PrototypeTabFlow = () => {
  const { data: prototype } = useCurrentPrototype()
  const [isEditing, setIsEditing] = React.useState(false)
  const [customerJourneySteps, setCustomerJourneySteps] = React.useState<
    string[]
  >([])
  const [flowData, setFlowData] = React.useState<FlowStep[]>([])

  // Parse customer journey steps
  const parseCustomerJourneySteps = (journeyText: string | undefined) => {
    if (!journeyText) return []
    return journeyText
      .split('#')
      .filter((step) => step.trim())
      .map((step) => step.split('\n')[0].trim())
  }

  // Initialize or update data when prototype changes
  useEffect(() => {
    if (prototype) {
      // console.log('Prototype Flow:', prototype.flow)
      // console.log('Customer Journey:', prototype.customer_journey)

      // Parse customer journey steps
      const steps = parseCustomerJourneySteps(prototype.customer_journey)
      setCustomerJourneySteps(steps)

      // Initialize flow data
      try {
        if (prototype.flow) {
          const parsedFlow = JSON.parse(prototype.flow)
          // console.log('Parsed Flow:', parsedFlow)
          setFlowData(parsedFlow)
        } else {
          // Create initial empty flows for steps
          const initialFlows = steps.map((step) => ({
            title: step,
            flows: [
              {
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
              },
            ],
          }))
          setFlowData(initialFlows)
        }
      } catch (error) {
        console.error('Error parsing flow data:', error)
      }
    }
  }, [prototype])

  // Synchronize flow data with customer journey steps
  useEffect(() => {
    if (flowData.length > 0 && customerJourneySteps.length > 0) {
      const synchronizedFlows = customerJourneySteps.map((stepTitle, index) => {
        // Use index to find existing flow instead of title matching
        const existingFlow = flowData[index]

        if (existingFlow) {
          return {
            ...existingFlow, // Keep ALL existing flow data
            title: stepTitle, // Only update the title from customer journey
          }
        }

        // Create new empty flow for new step
        return {
          title: stepTitle,
          flows: [
            {
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
            },
          ],
        }
      })

      setFlowData(synchronizedFlows)
    }
  }, [customerJourneySteps])

  const handleSave = async (stringJsonData: string) => {
    if (!prototype) return
    try {
      const parsedData = JSON.parse(stringJsonData)
      console.log('Saving flow data:', parsedData)
      setFlowData(parsedData)
      await updatePrototypeService(prototype.id, { flow: stringJsonData })
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
                  End-to-End Flow: {prototype?.name}
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
                  <tr className="text-sm text-white uppercase">
                    <th
                      colSpan={3}
                      className="bg-gray-100 text-da-primary-500 border border-da-primary-500 font-semibold p-2 "
                    >
                      Off-board
                    </th>
                    <th className=""></th>
                    <th
                      colSpan={5}
                      className="bg-gray-100 text-da-primary-500 border border-da-primary-500 font-semibold p-2"
                    >
                      On-board
                    </th>
                  </tr>
                  <tr className="text-xs text-da-gray-dark uppercase">
                    <th className="border p-2">Smart Phone</th>

                    <th className="border p-2 bg-da-primary-100 text-da-primary-500">
                      <DaTooltip
                        content="Phone to Cloud"
                        className="normal-case"
                      >
                        <div className="cursor-pointer">p2c</div>
                      </DaTooltip>
                    </th>

                    <th className="border p-2">Cloud</th>
                    <th className="border p-2 bg-da-primary-100 text-da-primary-500">
                      <DaTooltip
                        content="Vehicle to Cloud"
                        className="normal-case"
                      >
                        <div className="cursor-pointer">v2c</div>
                      </DaTooltip>
                    </th>
                    <th className="border p-2">SDV Runtime</th>
                    <th className="border p-2 bg-da-primary-100 text-da-primary-500">
                      <DaTooltip
                        content="System to System"
                        className="normal-case"
                      >
                        <div className="cursor-pointer">s2s</div>
                      </DaTooltip>
                    </th>
                    <th className="border p-2">Embedded</th>
                    <th className="border p-2 bg-da-primary-100 text-da-primary-500">
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
                  {flowData && flowData.length > 0 ? (
                    flowData.map((step, stepIndex) => (
                      <React.Fragment key={stepIndex}>
                        <tr>
                          <td
                            colSpan={9}
                            className="border p-2 font-semibold bg-da-primary-500 text-white"
                          >
                            {step.title}
                          </td>
                        </tr>
                        {step.flows.map((flow, flowIndex) => (
                          <tr key={flowIndex} className="font-medium">
                            <td className="border p-2 text-center">
                              {flow.offBoard.smartPhone}
                            </td>
                            <td className="border p-2 text-center bg-da-primary-100">
                              <SignalFlowCell flow={flow.offBoard.p2c} />
                            </td>
                            <td className="border p-2 text-center">
                              {flow.offBoard.cloud}
                            </td>
                            <td className="border p-2 text-center bg-da-primary-100">
                              <SignalFlowCell flow={flow.v2c} />
                            </td>
                            <td className="border p-2 text-center">
                              {flow.onBoard.sdvRuntime}
                            </td>
                            <td className="border p-2 text-center bg-da-primary-100">
                              <SignalFlowCell flow={flow.onBoard.s2s} />
                            </td>
                            <td className="border p-2 text-center">
                              {flow.onBoard.embedded}
                            </td>
                            <td className="border p-2 text-center bg-da-primary-100">
                              <SignalFlowCell flow={flow.onBoard.s2e} />
                            </td>
                            <td className="border p-2 text-center">
                              {flow.onBoard.sensors}
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={9}
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
        </div>
      </div>
    </div>
  )
}

export default PrototypeTabFlow
