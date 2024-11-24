import React from 'react'
import { TbArrowLeft, TbArrowRight, TbArrowsHorizontal } from 'react-icons/tb'
import useCurrentPrototype from '@/hooks/useCurrentPrototype'
import DaTooltip from '../atoms/DaTooltip'

type Direction = 'left' | 'right' | 'bi-direction'

interface SignalFlow {
  direction: Direction
  signal: string
}

interface FlowStep {
  title: string
  flows: {
    offBoard: {
      smartPhone: string
      p2c: SignalFlow | null
      cloud: string
    }
    v2c: SignalFlow | null
    onBoard: {
      sdvRuntime: string
      s2s: SignalFlow | null
      embedded: string
      s2e: SignalFlow | null
      sensors: string
    }
  }[]
}

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
  const flowData: FlowStep[] = [
    {
      title: 'Step 1: Detect Person Behind Vehicle',
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
            embedded: 'Initialize Sensors',
            s2e: {
              direction: 'bi-direction',
              signal: 'Vehicle.ADAS.Proximity.Rear.IsActive',
            },
            sensors: 'Start Monitoring',
          },
        },
        {
          offBoard: {
            smartPhone: '',
            p2c: null,
            cloud: 'Process Detection',
          },
          v2c: {
            direction: 'left',
            signal: 'Vehicle.ADAS.HumanDetection.IsDetected',
          },
          onBoard: {
            sdvRuntime: 'Person Detected',
            s2s: {
              direction: 'left',
              signal: 'Vehicle.ADAS.Proximity.Rear.IsWarning',
            },
            embedded: 'Process Proximity Data',
            s2e: {
              direction: 'left',
              signal: 'Vehicle.ADAS.Proximity.Rear.Distance',
            },
            sensors: 'Distance Reading',
          },
        },
      ],
    },
    {
      title: 'Step 2: Analyze Person with Heavy Load',
      flows: [
        {
          offBoard: {
            smartPhone: '',
            p2c: null,
            cloud: 'Start Analysis',
          },
          v2c: {
            direction: 'right',
            signal: 'Vehicle.Cabin.Camera.Rear.IsActive',
          },
          onBoard: {
            sdvRuntime: 'Activate Camera',
            s2s: {
              direction: 'right',
              signal: 'Vehicle.Cabin.Camera.Rear.IsStreaming',
            },
            embedded: 'Configure Camera',
            s2e: {
              direction: 'right',
              signal: 'Vehicle.Cabin.Camera.Rear.IsPowered',
            },
            sensors: 'Capture Image',
          },
        },
        {
          offBoard: {
            smartPhone: 'Popup Quick Access Request',
            p2c: {
              direction: 'left',
              signal: 'User.Notification.QuickAccess',
            },
            cloud: 'Heavy Load Detected',
          },
          v2c: {
            direction: 'left',
            signal: 'Vehicle.ADAS.LoadDetection.IsConfirmed',
          },
          onBoard: {
            sdvRuntime: 'Send Detection Result',
            s2s: {
              direction: 'left',
              signal: 'Vehicle.ADAS.LoadDetection.Confidence',
            },
            embedded: 'Process Image Analysis',
            s2e: {
              direction: 'left',
              signal: 'Vehicle.Cabin.Camera.Rear.Quality',
            },
            sensors: 'Raw Image Data',
          },
        },
      ],
    },
    {
      title: 'Step 3: Open Trunk Automatically',
      flows: [
        {
          offBoard: {
            smartPhone: 'Quick Access Granted',
            p2c: {
              direction: 'right',
              signal: 'User.Authorization.Granted',
            },
            cloud: 'Authorize Opening',
          },
          v2c: {
            direction: 'right',
            signal: 'Vehicle.Body.Trunk.IsLocked',
          },
          onBoard: {
            sdvRuntime: 'Unlock Trunk',
            s2s: {
              direction: 'right',
              signal: 'Vehicle.Body.Trunk.IsOpen',
            },
            embedded: 'Control Motor',
            s2e: {
              direction: 'right',
              signal: 'Vehicle.Body.Trunk.Position',
            },
            sensors: 'Actuate Trunk',
          },
        },
        {
          offBoard: {
            smartPhone: 'Show Status',
            p2c: {
              direction: 'left',
              signal: 'User.Notification.Status',
            },
            cloud: 'Operation Complete',
          },
          v2c: {
            direction: 'left',
            signal: 'Vehicle.Body.Trunk.IsOpen',
          },
          onBoard: {
            sdvRuntime: 'Verify Status',
            s2s: {
              direction: 'left',
              signal: 'Vehicle.Body.Trunk.Position',
            },
            embedded: 'Monitor Position',
            s2e: {
              direction: 'left',
              signal: 'Vehicle.Body.Trunk.IsOpen',
            },
            sensors: 'Position Reading',
          },
        },
      ],
    },
  ]

  return (
    <div className="flex w-full h-full p-2 gap-2 bg-slate-100 text-xs">
      <div className="flex w-full h-full flex-col bg-white rounded-md p-4">
        <h2 className="text-sm font-semibold border-b pb-2 mb-4 text-da-primary-500">
          End-to-End Flow: Smart Trunk
        </h2>

        <div className="w-full overflow-x-auto">
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
                  <DaTooltip content="Phone to Cloud" className="normal-case">
                    <div className="cursor-pointer">p2c</div>
                  </DaTooltip>
                </th>

                <th className="border p-2">Cloud</th>
                <th className="border p-2 border-x-2 border-x-da-primary-500">
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
        </div>
      </div>
    </div>
  )
}

export default PrototypeTabFlow
