import React, { useEffect, useState } from 'react'
import { TbArrowsMaximize, TbArrowsMinimize, TbEdit } from 'react-icons/tb'
import useCurrentPrototype from '@/hooks/useCurrentPrototype'
import { updatePrototypeService } from '@/services/prototype.service'
import DaTooltip from '../atoms/DaTooltip'
import { FlowStep } from '@/types/flow.type'
import DaPrototypeFlowEditor from '../molecules/flow/DaEditableFlowTable'
import { DaButton } from '../atoms/DaButton'
import { TbChevronCompactRight } from 'react-icons/tb'
import { cn } from '@/lib/utils'
import { useSystemUI } from '@/hooks/useSystemUI'
import DaCheckbox from '../atoms/DaCheckbox'
import FlowSystemInterface from '../molecules/flow/FlowSystemInterface'
import FlowSystemActivity from '../molecules/flow/FlowSystemActivity'
import DaText from '../atoms/DaText'

const PrototypeTabFlow = () => {
  const { data: prototype } = useCurrentPrototype()
  const [isEditing, setIsEditing] = useState(false)
  const [customerJourneySteps, setCustomerJourneySteps] = useState<string[]>([])
  const [flowData, setFlowData] = useState<FlowStep[]>([])
  const [flowString, setFlowString] = useState('')
  const {
    showPrototypeFlowASIL,
    setShowPrototypeFlowASIL,
    showPrototypeFlowFullScreen,
    setShowPrototypeFlowFullScreen,
  } = useSystemUI()

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
    <div
      className={cn(
        'flex w-full h-full flex-col bg-white rounded-md py-4 px-8',
        showPrototypeFlowFullScreen
          ? 'fixed inset-0 z-50 overflow-auto bg-white'
          : '',
      )}
    >
      <div className="w-full ">
        <div className="flex items-center border-b pb-2 mb-4 ">
          <DaText variant="title" className="text-da-primary-500">
            End-to-End Flow: {prototype?.name}
          </DaText>
          <div className="grow" />

          {!isEditing ? (
            <DaButton
              onClick={() => setIsEditing(true)}
              className="!justify-start"
              variant="editor"
              size="sm"
            >
              <TbEdit className="w-4 h-4 mr-1" /> Edit
            </DaButton>
          ) : (
            <div className="flex space-x-2 mr-2">
              <DaButton
                variant="outline-nocolor"
                onClick={() => setIsEditing(false)}
                className="w-16 text-da-white px-4 py-2 rounded"
                size="sm"
              >
                Cancel
              </DaButton>
              <DaButton
                onClick={() => handleSave(flowString)}
                className="w-16 text-white px-4 py-2 rounded"
                size="sm"
              >
                Save
              </DaButton>
            </div>
          )}
          <DaButton
            onClick={() =>
              setShowPrototypeFlowFullScreen(!showPrototypeFlowFullScreen)
            }
            size="sm"
            variant="editor"
          >
            {showPrototypeFlowFullScreen ? (
              <TbArrowsMinimize className="size-4" />
            ) : (
              <TbArrowsMaximize className="size-4" />
            )}
          </DaButton>
        </div>
        {isEditing ? (
          <DaPrototypeFlowEditor
            initialData={flowData}
            onUpdate={(jsonData) => setFlowString(jsonData)}
          />
        ) : (
          <>
            <table className="w-full border-collapse table-fixed">
              <colgroup>
                <col className="w-[19%]" />
                <col className="w-[3%]" />
                <col className="w-[19%]" />
                <col className="w-[3%]" />
                <col className="w-[19%]" />
                <col className="w-[3%]" />
                <col className="w-[19%]" />
                <col className="w-[3%]" />
                <col className="w-[19%]" />
              </colgroup>
              <thead className="bg-gradient-to-tr from-da-secondary-500 to-da-primary-500 text-white">
                <tr className="text-sm uppercase">
                  <th
                    colSpan={3}
                    className="font-semibold p-2 border border-white"
                  >
                    Off-board
                  </th>
                  <th className="border border-white"></th>
                  <th
                    colSpan={5}
                    className="font-semibold p-2 border border-white"
                  >
                    On-board
                  </th>
                </tr>
                <tr className="text-xs uppercase">
                  <th className="p-2 border border-white">Smart Phone</th>

                  <th className="p-2 border border-white bg-opacity-20">
                    <DaTooltip content="Phone2Cloud" className="normal-case">
                      <div className="cursor-pointer">p2c</div>
                    </DaTooltip>
                  </th>

                  <th className="p-2 border border-white">Cloud</th>
                  <th className="p-2 border border-white bg-opacity-20">
                    <DaTooltip content="Vehicle2Cloud" className="normal-case">
                      <div className="cursor-pointer">v2c</div>
                    </DaTooltip>
                  </th>
                  <th className="p-2 border border-white">SDV Runtime</th>
                  <th className="p-2 border border-white bg-opacity-20">
                    <DaTooltip content="Signal2Service" className="normal-case">
                      <div className="cursor-pointer">s2s</div>
                    </DaTooltip>
                  </th>
                  <th className="p-2 border border-white">Embedded</th>
                  <th className="p-2 border border-white bg-opacity-20">
                    <DaTooltip
                      content="Signal2Embedded"
                      className="normal-case"
                    >
                      <div className="cursor-pointer">s2e</div>
                    </DaTooltip>
                  </th>
                  <th className="p-2 border border-white truncate">
                    Sensors/Actuators
                  </th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  {[...Array(9)].map((_, index) => (
                    <td
                      key={index}
                      className={`h-3 ${index % 2 === 0 ? 'bg-white' : 'bg-da-primary-100'}`}
                    ></td>
                  ))}
                </tr>
                {flowData && flowData.length > 0 ? (
                  flowData.map((step, stepIndex) => (
                    <React.Fragment key={stepIndex}>
                      <tr>
                        <td
                          colSpan={9}
                          className="relative text-xs border font-semibold bg-da-primary-500 text-white h-9 px-8 z-0"
                        >
                          <TbChevronCompactRight className="absolute -left-[12px] top-[5.5px] -translate-x-1/4 -translate-y-1/4 size-[47px] bg-transparent text-white fill-current" />
                          {step.title}
                          <TbChevronCompactRight className="absolute -right-[1px] top-[5.5px] translate-x-1/2  -translate-y-1/4 size-[47px] bg-transparent text-da-primary-500 fill-current" />
                        </td>
                      </tr>
                      {step.flows.map((flow, flowIndex) => (
                        <tr key={flowIndex} className="font-medium text-xs">
                          <td className="border p-2 text-center">
                            <FlowSystemActivity
                              text={flow.offBoard.smartPhone}
                              key={`${flowIndex}-smartPhone`}
                            />
                          </td>
                          <td className="border p-2 text-center bg-da-primary-100">
                            <FlowSystemInterface
                              flow={flow.offBoard.p2c}
                              interfaceType="p2c"
                            />
                          </td>
                          <td className="border p-2 text-center">
                            <FlowSystemActivity
                              text={flow.offBoard.cloud}
                              key={`${flowIndex}-cloud`}
                            />
                          </td>
                          <td className="border p-2 text-center bg-da-primary-100">
                            <FlowSystemInterface
                              flow={flow.v2c}
                              interfaceType="v2c"
                            />
                          </td>
                          <td className="border p-2 text-center">
                            <FlowSystemActivity
                              text={flow.onBoard.sdvRuntime}
                              key={`${flowIndex}-sdvRuntime`}
                            />
                          </td>
                          <td className="border p-2 text-center bg-da-primary-100">
                            <FlowSystemInterface
                              flow={flow.onBoard.s2s}
                              interfaceType="s2s"
                            />
                          </td>
                          <td className="border p-2 text-center">
                            <FlowSystemActivity
                              text={flow.onBoard.embedded}
                              key={`${flowIndex}-embedded`}
                            />
                          </td>
                          <td className="border p-2 text-center bg-da-primary-100">
                            <FlowSystemInterface
                              flow={flow.onBoard.s2e}
                              interfaceType="s2e"
                            />
                          </td>
                          <td className="border p-2 text-center">
                            <FlowSystemActivity
                              text={flow.onBoard.sensors}
                              key={`${flowIndex}-sensors`}
                            />
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
        {!isEditing && (
          <DaCheckbox
            checked={showPrototypeFlowASIL}
            onChange={() => setShowPrototypeFlowASIL(!showPrototypeFlowASIL)}
            label={'Show ASIL/QM Levels'}
            className="text-sm mt-2"
          />
        )}
      </div>
    </div>
  )
}

export default PrototypeTabFlow
