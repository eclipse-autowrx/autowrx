import React, { useEffect, useState } from 'react'
import {
  TbArrowLeft,
  TbArrowRight,
  TbArrowsHorizontal,
  TbArrowsMaximize,
  TbArrowsMinimize,
} from 'react-icons/tb'
import useCurrentPrototype from '@/hooks/useCurrentPrototype'
import { updatePrototypeService } from '@/services/prototype.service'
import DaTooltip from '../atoms/DaTooltip'
import { FlowStep, Direction, SignalFlow } from '@/types/flow.type'
import DaPrototypeFlowEditor from '../molecules/flow/DaEditableFlowTable'
import { DaButton } from '../atoms/DaButton'
import { VscTriangleRight } from 'react-icons/vsc'
import { cn } from '@/lib/utils'
import { useSystemUI } from '@/hooks/useSystemUI'
import DaCheckbox from '../atoms/DaCheckbox'
import { useParams } from 'react-router-dom'

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

const SafetyLevelRenderer: React.FC<{ text: string }> = ({ text }) => {
  const { showPrototypeFlowASIL } = useSystemUI()
  const safetyLevels = ['<ASIL-D>', '<ASIL-C>', '<ASIL-B>', '<ASIL-A>', '<QM>']
  const levelColors: Record<string, string> = {
    '<ASIL-D>': 'bg-red-500 border border-red-700',
    '<ASIL-C>': 'bg-orange-500 border border-orange-700',
    '<ASIL-B>': 'bg-yellow-500 border border-yellow-700',
    '<ASIL-A>': 'bg-green-500 border border-green-700',
    '<QM>': 'bg-blue-500 border border-blue-700',
  }

  const matchedLevel = safetyLevels.find((level) => {
    return text.includes(level)
  })

  if (matchedLevel) {
    const renderedText = text.replace(matchedLevel, '').trim()
    const levelShort = matchedLevel.startsWith('<ASIL-')
      ? matchedLevel.replace(/<ASIL-|>/g, '') // Extract "A", "B", etc.
      : matchedLevel.replace(/[<>]/g, '') // Handle "<QM>"

    return (
      <div className="p-1 flex items-center justify-center gap-1 min-h-7">
        <span className="">{renderedText}</span>
        {showPrototypeFlowASIL && (
          <span
            className={cn(
              'flex px-1 items-center justify-center font-bold rounded-md text-white',
              levelColors[matchedLevel],
            )}
          >
            {levelShort}
          </span>
        )}
      </div>
    )
  }

  return <div className="p-1 font-medium">{text}</div>
}
const SignalFlowCell: React.FC<{ flow: SignalFlow | null }> = ({ flow }) => {
  const { model_id } = useParams()

  if (!flow) return <div className="p-2"></div>

  const isLink = flow.signal?.startsWith('https://')
  const isVehicle = flow.signal?.startsWith('Vehicle.')

  const handleClick = () => {
    if (isVehicle && flow.signal) {
      // Construct the URL with origin
      const url = `${window.location.origin}/model/${model_id}/api/${flow.signal}`
      window.open(url, '_blank')
    }
  }

  const Content = (
    <DaTooltip content={flow.signal}>
      <DirectionArrow direction={flow.direction} />
    </DaTooltip>
  )

  return (
    <div className="flex flex-col items-center gap-1 cursor-pointer min-h-7 justify-center">
      {flow.signal &&
        (isLink ? (
          <a href={flow.signal} target="_blank" rel="noopener noreferrer">
            {Content}
          </a>
        ) : isVehicle ? (
          <div onClick={handleClick}>{Content}</div>
        ) : (
          Content
        ))}
    </div>
  )
}

const PrototypeTabFlow = () => {
  const { data: prototype } = useCurrentPrototype()
  const [isEditing, setIsEditing] = useState(false)
  const [customerJourneySteps, setCustomerJourneySteps] = useState<string[]>([])
  const [flowData, setFlowData] = useState<FlowStep[]>([])
  const [isFullscreen, setFullscreen] = useState(false)
  const { showPrototypeFlowASIL, setShowPrototypeFlowASIL } = useSystemUI()

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
        isFullscreen ? 'fixed inset-0 z-50 overflow-auto bg-white' : '',
      )}
    >
      <div className="w-full ">
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
              <div className="flex space-x-2">
                <DaButton
                  onClick={() => setIsEditing(false)}
                  className={cn(
                    'w-[90px]',
                    !isEditing
                      ? '!border-da-primary-500 !text-da-primary-500 bg-da-primary-100'
                      : 'text-da-gray-medium',
                  )}
                  variant="plain"
                  size="sm"
                >
                  View Mode
                </DaButton>
                <DaButton
                  onClick={() => setIsEditing(true)}
                  className={cn(
                    'w-[90px]',
                    isEditing
                      ? '!border-da-primary-500 !text-da-primary-500 bg-da-primary-100'
                      : 'text-da-gray-medium',
                  )}
                  variant="plain"
                  size="sm"
                >
                  Edit Mode
                </DaButton>
                <DaButton
                  onClick={() => setFullscreen((prev) => !prev)}
                  size="sm"
                  variant="plain"
                >
                  {isFullscreen ? (
                    <TbArrowsMinimize className="w-5 h-5 stroke-[1.5]" />
                  ) : (
                    <TbArrowsMaximize className="w-5 h-5 stroke-[1.5]" />
                  )}
                </DaButton>
              </div>
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
                      content="System2Embedded"
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
                <td colSpan={9} className="h-3"></td>
                {flowData && flowData.length > 0 ? (
                  flowData.map((step, stepIndex) => (
                    <React.Fragment key={stepIndex}>
                      <tr>
                        <td
                          colSpan={9}
                          className="relative text-xs border font-semibold bg-da-primary-500 text-white h-9 px-8"
                        >
                          <VscTriangleRight className="absolute -left-[5px] top-[5.5px] -translate-x-1/4 -translate-y-1/4 size-[47px] bg-transparent text-white" />
                          {step.title}
                          <VscTriangleRight className="absolute -right-[7px] top-[5.5px] translate-x-1/2  -translate-y-1/4 size-[47px] bg-transparent text-da-primary-500" />
                        </td>
                      </tr>
                      {step.flows.map((flow, flowIndex) => (
                        <tr key={flowIndex} className="font-medium text-xs">
                          <td className="border p-2 text-center">
                            <SafetyLevelRenderer
                              text={flow.offBoard.smartPhone}
                              key={`${flowIndex}-smartPhone`}
                            />
                          </td>
                          <td className="border p-2 text-center bg-da-primary-100">
                            <SignalFlowCell flow={flow.offBoard.p2c} />
                          </td>
                          <td className="border p-2 text-center">
                            <SafetyLevelRenderer
                              text={flow.offBoard.cloud}
                              key={`${flowIndex}-cloud`}
                            />
                          </td>
                          <td className="border p-2 text-center bg-da-primary-100">
                            <SignalFlowCell flow={flow.v2c} />
                          </td>
                          <td className="border p-2 text-center">
                            <SafetyLevelRenderer
                              text={flow.onBoard.sdvRuntime}
                              key={`${flowIndex}-sdvRuntime`}
                            />
                          </td>
                          <td className="border p-2 text-center bg-da-primary-100">
                            <SignalFlowCell flow={flow.onBoard.s2s} />
                          </td>
                          <td className="border p-2 text-center">
                            <SafetyLevelRenderer
                              text={flow.onBoard.embedded}
                              key={`${flowIndex}-embedded`}
                            />
                          </td>
                          <td className="border p-2 text-center bg-da-primary-100">
                            <SignalFlowCell flow={flow.onBoard.s2e} />
                          </td>
                          <td className="border p-2 text-center">
                            <SafetyLevelRenderer
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
