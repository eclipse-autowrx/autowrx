import DaText from '@/components/atoms/DaText'
import DaRuntimeConnector from '../DaRuntimeConnector'
import { useEffect, useState } from 'react'
import useRuntimeStore from '@/stores/runtimeStore'
import { shallow } from 'zustand/shallow'
import useCurrentPrototype from '@/hooks/useCurrentPrototype'
import useModelStore from '@/stores/modelStore'
import { Prototype } from '@/types/model.type'
import { DaButton } from '@/components/atoms/DaButton'
import DaEditSystemStaging from './DaEditSystemStaging'

interface DaStagingProps {
  onCancel?: () => void
  loading?: boolean
  onClose?: () => void
  isWizard?: boolean
}

const DEFAULT_KIT_SERVER = 'https://kit.digitalauto.tech'

const TARGETS = [
  {
    name: 'Virtual WS',
    icon: '/imgs/targets/vm.png',
    prefix: 'Runtime-',
    version: 'v.0.10',
    state: {
      '3.1.1.1.1.1': '2.3.2',
    },
  },
  // {
  //   name: 'Education Kit: MakerKit',
  //   short_name: 'MaketKit',
  //   icon: '/imgs/targets/edukit.png',
  //   prefix: 'Runtime-', // "Kit-"
  //   version: 'v.0.9',
  //   state: {
  //     '3.1.1.1.1.1': '2.3.1',
  //   },
  // },
  {
    name: 'Automation Kit',
    short_name: 'Runtime-',
    icon: '/imgs/targets/automationKit.png',
    prefix: 'Runtime-', // "Kit-"
    version: 'v.0.9',
    state: {
      '3.1.1.1.1.1': '2.3.1',
    },
  },
  {
    name: 'Test Fleet',
    short_name: 'XSPACE',
    icon: '/imgs/targets/pilotCar.png',
    prefix: 'PilotCar-', // "PilotCar-"
    version: 'v.0.8',
    state: {
      '3.1.1.1.1.1': '2.3.0',
    },
  },
]

const SYSTEM = {
  name: 'Concept Car 2024',
  icon: '/imgs/targets/targetSystem.png',
  version: 'v.0.11',
}

const STANDARD_STAGE = {
  isTopMost: true,
  name: '',
  id: '1',
  children: [
    {
      id: '2',
      name: 'Off-Board',
      children: [
        {
          id: '2.1',
          name: 'Cloud',
          children: [
            {
              id: '2.1.1',
              name: 'EZ Instance 4711',
              children: [
                {
                  id: '2.1.1.1',
                  name: 'Sunscription Manager',
                  version: '1.2.3',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: '3',
      name: 'On-Board',
      children: [
        {
          id: '3.1',
          name: 'Central Compute',
          children: [
            {
              id: '3.1.1',
              name: 'VCU',
              children: [
                {
                  id: '3.1.1.1',
                  name: 'Linux Instance eL1',
                  children: [
                    {
                      id: '3.1.1.1.1',
                      name: 'Container 4711',
                      children: [
                        {
                          id: '3.1.1.1.1.1',
                          name: 'Subscription Event Analyzer',
                          version: '2.3.4',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: '3.2',
          name: 'Front Zone',
          children: [
            {
              id: '3.2.1',
              name: 'Zone Gateway FZ1',
              children: [
                {
                  id: '3.2.1.1',
                  name: 'PoSix Instance PL1',
                  version: '1.3.4',
                },
                {
                  id: '3.2.1.2',
                  name: 'ECU E7',
                  version: '7.0.1',
                  children: [
                    {
                      id: '3.2.1.2.1',
                      name: 'Runtime R8',
                      version: '8.0.1',
                      children: [
                        {
                          id: '3.2.1.2.1.1',
                          name: 'ARA:com for wiper fluid Sensor',
                          version: '0.3.2',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: '3.2.2',
          name: 'Rear Zone',
          children: [
            {
              id: '3.2.2.1',
              name: 'Zone Gateway ZR1',
              children: [
                {
                  id: '3.2.2.1.1',
                  name: 'PoSix Instance PL1',
                  version: '1.3.4',
                },
              ],
            },
            {
              id: '3.2.2.2',
              name: 'ECU E7',
              children: [
                {
                  id: '3.2.2.2.1',
                  name: 'Runtime R8',
                  version: '8.0.1',
                  children: [
                    {
                      id: '3.2.2.2.1.1',
                      name: 'ARA:com for Wiper Fluid Sensor',
                      version: '0.3.2',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

const DaStaging = ({
  onCancel,
  loading,
  onClose,
  isWizard,
}: DaStagingProps) => {
  const [system, setSystem] = useState<any>(SYSTEM)
  const [targets, setTargets] = useState<any[]>(TARGETS)
  const [activeTarget, setActiveTarget] = useState<any>(null)
  const [usedApis, setUsedApis] = useState<any[]>([])
  const [code, setCode] = useState<string>('')

  const MODE_OVERVIEW = 'overview'
  const MODE_EDIT_DEFINE = 'edit_define'
  const MODE_ON_TARGET = 'on_target'
  const [mode, setMode] = useState<string>(MODE_OVERVIEW)
  const [stageDefine, setStageDefine] = useState<any>(STANDARD_STAGE)

  const [prototype, setActivePrototype, activeModelApis] = useModelStore(
    (state) => [
      state.prototype as Prototype,
      state.setActivePrototype,
      state.activeModelApis,
    ],
    shallow,
  )

  // useEffect(() => {
  //     if (prototype) {
  //       setCode(prototype.code || '')
  //     } else {
  //       setCode('')
  //     }
  // }, [prototype?.code])

  return (
    <div className="min-h-[400px] w-[90vw] min-w-[400px] max-w-[1200px]">
      {mode == MODE_EDIT_DEFINE && (
        <DaEditSystemStaging
          onTargetMode={false}
          system={system}
          target={null}
          stageDefine={stageDefine}
          onFinish={(data) => {
            setStageDefine(data)
            setMode(MODE_OVERVIEW)
          }}
          onCancel={() => {
            setMode(MODE_OVERVIEW)
          }}
        />
      )}

      {mode == MODE_ON_TARGET && (
        <DaEditSystemStaging
          onTargetMode={true}
          system={system}
          stageDefine={stageDefine}
          target={activeTarget}
          onCancel={() => {
            setMode(MODE_OVERVIEW)
          }}
        />
      )}

      {mode == MODE_OVERVIEW && (
        <div>
          {!isWizard && <DaText variant="huge-bold">Staging</DaText>}
          <div className="mt-4 w-full rounded border">
            {/* Title */}
            <div className="flex h-[40px] w-full rounded-t bg-gradient-to-r from-da-gradient-from to-da-gradient-to text-da-white">
              <div className="flex w-[20%] items-center justify-center border-r border-da-white font-bold">
                System
              </div>
              <div className="flex grow items-center justify-center border-da-white font-bold">
                Stages
              </div>
            </div>
            <div className="flex">
              <div className="flex min-w-[100px] flex-1 flex-col items-center justify-center overflow-x-hidden rounded-s bg-[#DADADA] px-1 py-1">
                <div className="flex h-[140px] w-full items-center justify-center">
                  <img width={150} height={70} src={system.icon} alt="System" />
                </div>
                <DaText variant="small-bold" className="mt-1">
                  {system.name}
                </DaText>
                <DaText variant="small" className="mt-1">
                  {system.version}
                </DaText>
                <DaButton
                  className="my-1 w-[100px]"
                  onClick={() => {
                    setMode(MODE_EDIT_DEFINE)
                  }}
                >
                  Edit
                </DaButton>
              </div>

              {targets &&
                targets.map((target: any) => (
                  <div
                    key={target.name}
                    className="flex min-w-[100px] flex-1 flex-col items-center justify-center overflow-x-hidden border-l px-1 pb-2 pt-1"
                  >
                    <div className="flex h-[140px] w-full items-center justify-center">
                      <img
                        width={120}
                        height={70}
                        src={target.icon}
                        alt={target.name}
                      />
                    </div>
                    <DaText variant="small-bold" className="mt-1">
                      {target.name}
                    </DaText>
                    <DaText variant="small" className="mt-1">
                      {target.version}
                    </DaText>
                    <DaButton
                      variant="outline"
                      className="my-1 w-[100px]"
                      onClick={() => {
                        setActiveTarget(target)
                        setMode(MODE_ON_TARGET)
                      }}
                    >
                      Update
                    </DaButton>
                  </div>
                ))}

              {/* <DaRuntimeConnector
                        targetPrefix={target.prefix}
                        hideLabel={true}
                        kitServerUrl={DEFAULT_KIT_SERVER}
                        usedAPIs={[]}
                        onNewLog={() => {}}/> */}
            </div>

            {/* <div className="my-2 flex min-h-[100px] bg-slate-50">
                <div className="min-w-[100px] w-[100px] flex-shrink-0 flex items-center justify-center px-2">
                    <DaText variant="regular-bold">QM App</DaText>
                </div>
                {targets && targets.map((target: any) => <div key={target.name} className="min-w-[100px] flex-1 flex flex-col items-center justify-center">
                    { prototype && <div className="w-full px-1 flex flex-col">
                        <div className="px-2 py-1 rounded border border-slate-300 text-sm bg-slate-200">
                            <div>App: <b>{prototype.name}</b></div>
                            <div className="flex items-center">
                                <div className="grow">Version: <b>1.0.2</b></div>
                                <div  className="!text-orange-500 hover:underline cursor-pointer">Deploy New Ver</div>
                            </div>
                        </div>
                    </div>
                    }
                </div>
                )}
            </div> */}

            {/*
            <div className="my-2 flex min-h-[100px] bg-slate-50">
                <div className="min-w-[100px] w-[100px] flex-shrink-0 flex items-center justify-center px-2">
                    <DaText variant="regular-bold">VCU</DaText>
                </div>
                {targets && targets.map((target: any) => <div key={target.name} className="min-w-[100px] text-[12px] flex-1 flex flex-col items-start justify-center">
                    <div className="flex"><div className="w-20">Data broker:</div> <div><b>{target.VCU.dataBroker}</b></div></div>
                    <div className="flex"><div className="w-20">API Version:</div> <div><b>{target.VCU.vss}</b></div></div>
                    <div className="flex"><div className="w-20">Device:</div> <div><b>{target.VCU.device}</b></div></div>
                    <div>
                        { usedApis && usedApis.map((api) => <div key={api} className="flex items-center pl-2">
                            <div className="font-bold text-[11px] grow">- {api}</div>
                        </div>)}
                    </div>
                </div>
                )}
            </div>
        */}

            {/* <div className="my-2 flex min-h-[100px] bg-slate-50">
                <div className="min-w-[100px] w-[100px] flex-shrink-0 flex items-center justify-center px-2">
                    <DaText variant="regular-bold">ECU</DaText>
                </div>
                {targets && targets.map((target: any) => <div key={target.name} className="min-w-[100px] flex-1 flex flex-col items-center justify-center">
                    <div className="flex">
                        { target.ECUs && target.ECUs.map((ecu:any, eIndex:number) => <div key={eIndex} className="m-1 px-2 py-1 flex flex-col pl-2 border-2 border-slate-300 rounded">
                            <div className="text-[11px] flex">Name: <b>{ecu.name}</b></div>
                            <div className="text-[11px] flex">App: <b>{ecu.app}</b></div>
                            <div className="text-[11px] flex">
                                <div>Ver: <b>{ecu.version}</b></div>
                                <div className="ml-2 cursor-pointer text-orange-500 hover:underline">Upgrade</div>
                            </div>
                        </div>)}
                    </div>
                </div>
                )}
            </div> */}
          </div>
        </div>
      )}
    </div>
  )
}

export default DaStaging
