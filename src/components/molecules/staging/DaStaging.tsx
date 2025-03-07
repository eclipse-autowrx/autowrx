import DaText from '@/components/atoms/DaText'
import { useState } from 'react'
import { DaButton } from '@/components/atoms/DaButton'
import DaEditSystemStaging from './DaEditSystemStaging'

import {
  TbChevronsRight,
  TbExternalLink,
  TbPlayerPlay,
  TbPlayerPlayFilled,
  TbTriangleFilled,
} from 'react-icons/tb'
import { cn } from '@/lib/utils'
import { TbChevronRight } from 'react-icons/tb'
import DaStageComponent from './DaStageComponent'
import { Prototype } from '@/types/model.type'
import useModelStore from '@/stores/modelStore'

interface DaStagingProps {
  onCancel?: () => void
  loading?: boolean
  onClose?: () => void
  isWizard?: boolean
}

const TARGETS = [
  {
    name: 'SDV Mockup',
    icon: '/imgs/targets/target_mockup.png',
    prefix: 'Runtime-',
    version: 'v.1.0',
    target_document_url: '',
    state: {
      '3.1.1.1.1.1': { version: '1.0', cycle: {"Infrastructure Maturity": "3", "Functional Maturity": "3", "Deployment Version": "2", "Compliance Readiness": "4", "Security Readiness": "4", "Homologation Readiness": "4"}},
      '3.1.1.1.1.2': { version: '1.0.4', cycle: {"Infrastructure Maturity": "5", "Functional Maturity": "2", "Deployment Version": "2", "Compliance Readiness": "4", "Security Readiness": "1", "Homologation Readiness": "3"}},
      '3.1.1.1.1.3': { version: '1.7.4', cycle: {"Infrastructure Maturity": "4", "Functional Maturity": "4", "Deployment Version": "2", "Compliance Readiness": "3", "Security Readiness": "2", "Homologation Readiness": "2"}},
      '2.1.1.1': { version: '1.2.3', cycle: {"Infrastructure Maturity": "2", "Functional Maturity": "2", "Deployment Version": "2", "Compliance Readiness": "3", "Security Readiness": "3", "Homologation Readiness": "3"}},
      '2.1.1.2': { version: '1.2.2', cycle: {"Infrastructure Maturity": "4", "Functional Maturity": "2", "Deployment Version": "1", "Compliance Readiness": "1", "Security Readiness": "2", "Homologation Readiness": "3"}},
      '2.1.1.3': { version: '3.2.3', cycle: {"Infrastructure Maturity": "4", "Functional Maturity": "4", "Deployment Version": "2", "Compliance Readiness": "1", "Security Readiness": "4", "Homologation Readiness": "2"}},
      '3.2.1.1': { version: '7.0.1', cycle: {"Infrastructure Maturity": "2", "Functional Maturity": "2", "Deployment Version": "2", "Compliance Readiness": "2", "Security Readiness": "2", "Homologation Readiness": "2"}},
      '3.2.1.2.1': { version: '8.0.1', cycle: {"Infrastructure Maturity": "4", "Functional Maturity": "4", "Deployment Version": "2", "Compliance Readiness": "3", "Security Readiness": "2", "Homologation Readiness": "1"}},
      '3.2.1.2.1.1': { version: '0.3.2', cycle: {"Infrastructure Maturity": "2", "Functional Maturity": "2", "Deployment Version": "2", "Compliance Readiness": "2", "Security Readiness": "1", "Homologation Readiness": "1"}},
      '3.2.2.1.1': { version: '1.3.4', cycle: {"Infrastructure Maturity": "3", "Functional Maturity": "2", "Deployment Version": "2", "Compliance Readiness": "1", "Security Readiness": "1", "Homologation Readiness": "2"}},
      '3.2.1.2': { version: '7.0.1', cycle: {"Infrastructure Maturity": "1", "Functional Maturity": "1", "Deployment Version": "2", "Compliance Readiness": "2", "Security Readiness": "1", "Homologation Readiness": "2"}},
      '3.2.2.2.1': { version: '8.0.1', cycle: {"Infrastructure Maturity": "2", "Functional Maturity": "1", "Deployment Version": "2", "Compliance Readiness": "1", "Security Readiness": "2", "Homologation Readiness": "1"}},
      '3.2.2.2.1.1': { version: '0.2.1', cycle: {"Infrastructure Maturity": "3", "Functional Maturity": "2", "Deployment Version": "2", "Compliance Readiness": "2", "Security Readiness": "4", "Homologation Readiness": "2"}},
      
    },
  },
  {
    name: 'Virtual Vehicle',
    short_name: 'MakerKit',
    icon: '/imgs/targets/target_3d_car.png',
    prefix: 'makerkit-', // "Kit-"
    version: 'v.1.0',
    target_document_url: '',
    state: {
      '3.1.1.1.1.1': { version: '0.9', cycle: {"Infrastructure Maturity": "4", "Functional Maturity": "3", "Deployment Version": "1", "Compliance Readiness": "4", "Security Readiness": "4", "Homologation Readiness": "5"}},
      '3.1.1.1.1.2': { version: '1.0.4', cycle: {"Infrastructure Maturity": "3", "Functional Maturity": "3", "Deployment Version": "2", "Compliance Readiness": "3", "Security Readiness": "2", "Homologation Readiness": "1"}},
      '3.1.1.1.1.3': { version: '1.6.1', cycle: {"Infrastructure Maturity": "4", "Functional Maturity": "2", "Deployment Version": "1", "Compliance Readiness": "2", "Security Readiness": "1", "Homologation Readiness": "2"}},
      '2.1.1.1': { version: '1.2.3', cycle: {"Infrastructure Maturity": "4", "Functional Maturity": "2", "Deployment Version": "2", "Compliance Readiness": "3", "Security Readiness": "2", "Homologation Readiness": "3"}},
      '2.1.1.2': { version: '2.0.2', cycle: {"Infrastructure Maturity": "2", "Functional Maturity": "1", "Deployment Version": "2", "Compliance Readiness": "3", "Security Readiness": "1", "Homologation Readiness": "2"}},
      '2.1.1.3': { version: '3.2.3', cycle: {"Infrastructure Maturity": "4", "Functional Maturity": "1", "Deployment Version": "2", "Compliance Readiness": "4", "Security Readiness": "5", "Homologation Readiness": "4"}},
      '3.2.1.1': { version: '1.3.4', cycle: {"Infrastructure Maturity": "2", "Functional Maturity": "1", "Deployment Version": "1", "Compliance Readiness": "3", "Security Readiness": "2", "Homologation Readiness": "3"}},
      '3.2.1.2.1': { version: '4.6.1', cycle: {"Infrastructure Maturity": "3", "Functional Maturity": "3", "Deployment Version": "1", "Compliance Readiness": "3", "Security Readiness": "3", "Homologation Readiness": "1"}},
      '3.2.1.2.1.1': { version: '0.3.1', cycle: {"Infrastructure Maturity": "3", "Functional Maturity": "1", "Deployment Version": "1", "Compliance Readiness": "2", "Security Readiness": "2", "Homologation Readiness": "1"}},
      '3.2.2.1.1': { version: '1.3.4', cycle: {"Infrastructure Maturity": "4", "Functional Maturity": "4", "Deployment Version": "2", "Compliance Readiness": "3", "Security Readiness": "4", "Homologation Readiness": "1"}},
      '3.2.1.2': { version: '7.0.1', cycle: {"Infrastructure Maturity": "2", "Functional Maturity": "1", "Deployment Version": "2", "Compliance Readiness": "2", "Security Readiness": "2", "Homologation Readiness": "1"}},
      '3.2.2.2.1': { version: '7.2.1', cycle: {"Infrastructure Maturity": "2", "Functional Maturity": "3", "Deployment Version": "1", "Compliance Readiness": "2", "Security Readiness": "2", "Homologation Readiness": "1"}},
      '3.2.2.2.1.1': { version: '0.2.1', cycle: {"Infrastructure Maturity": "5", "Functional Maturity": "2", "Deployment Version": "1", "Compliance Readiness": "2", "Security Readiness": "4", "Homologation Readiness": "2"}},
    },
  },
  {
    name: 'Lab HW',
    short_name: 'dreamKIT-',
    icon: '/imgs/targets/desktopKit.png',
    prefix: 'dreamkit-', // "Kit-"
    version: 'v.1.0',
    target_document_url: 'https://docs.digital.auto/dreamkit/overview/',
    state: {
      '3.1.1.1.1.1': { version: '0.9', cycle: {"Infrastructure Maturity": "3", "Functional Maturity": "3", "Deployment Version": "1", "Compliance Readiness": "4", "Security Readiness": "4", "Homologation Readiness": "4"}},
      '3.1.1.1.1.2': { version: '0.9.2', cycle: {"Infrastructure Maturity": "3", "Functional Maturity": "2", "Deployment Version": "1", "Compliance Readiness": "1", "Security Readiness": "2", "Homologation Readiness": "1"}},
      '3.1.1.1.1.3': { version: '1.6.2', cycle: {"Infrastructure Maturity": "3", "Functional Maturity": "1", "Deployment Version": "1", "Compliance Readiness": "3", "Security Readiness": "2", "Homologation Readiness": "3"}},
      '2.1.1.1': { version: '1.2.3', cycle: {"Infrastructure Maturity": "3", "Functional Maturity": "3", "Deployment Version": "2", "Compliance Readiness": "2", "Security Readiness": "3", "Homologation Readiness": "3"}},
      '2.1.1.2': { version: '1.2.1', cycle: {"Infrastructure Maturity": "4", "Functional Maturity": "2", "Deployment Version": "1", "Compliance Readiness": "2", "Security Readiness": "2", "Homologation Readiness": "4"}},
      '2.1.1.3': { version: '2.1.4', cycle: {"Infrastructure Maturity": "5", "Functional Maturity": "4", "Deployment Version": "1", "Compliance Readiness": "2", "Security Readiness": "1", "Homologation Readiness": "2"}},
      '3.2.1.1': { version: '1.3.1', cycle: {"Infrastructure Maturity": "2", "Functional Maturity": "2", "Deployment Version": "1", "Compliance Readiness": "2", "Security Readiness": "3", "Homologation Readiness": "1"}},
      '3.2.1.2.1': { version: '4.5.1', cycle: {"Infrastructure Maturity": "3", "Functional Maturity": "2", "Deployment Version": "1", "Compliance Readiness": "1", "Security Readiness": "2", "Homologation Readiness": "2"}},
      '3.2.1.2.1.1': { version: '0.3.1', cycle: {"Infrastructure Maturity": "5", "Functional Maturity": "3", "Deployment Version": "1", "Compliance Readiness": "4", "Security Readiness": "3", "Homologation Readiness": "1"}},
      '3.2.2.1.1': { version: '1.3.2', cycle: {"Infrastructure Maturity": "4", "Functional Maturity": "3", "Deployment Version": "1", "Compliance Readiness": "3", "Security Readiness": "1", "Homologation Readiness": "3"}},
      '3.2.1.2': { version: '7.0.1', cycle: {"Infrastructure Maturity": "2", "Functional Maturity": "2", "Deployment Version": "2", "Compliance Readiness": "1", "Security Readiness": "1", "Homologation Readiness": "1"}},
      '3.2.2.2.1': { version: '7.2.1', cycle: {"Infrastructure Maturity": "5", "Functional Maturity": "1", "Deployment Version": "1", "Compliance Readiness": "1", "Security Readiness": "1", "Homologation Readiness": "1"}},
      '3.2.2.2.1.1': { version: '0.2.1', cycle: {"Infrastructure Maturity": "4", "Functional Maturity": "2", "Deployment Version": "1", "Compliance Readiness": "2", "Security Readiness": "3", "Homologation Readiness": "2"}},
    },
  },
  {
    name: 'Test Fleet',
    short_name: 'XSPACE',
    icon: '/imgs/targets/pilotCar.png',
    prefix: 'PilotCar-', // "PilotCar-"
    version: 'v.1.0',
    target_document_url: 'https://www.digital.auto/#comp-lm8xcdpg',
    state: {
      '3.1.1.1.1.1': { version: '0.9', cycle: {"Infrastructure Maturity": "5", "Functional Maturity": "4", "Deployment Version": "1", "Compliance Readiness": "4", "Security Readiness": "4", "Homologation Readiness": "5"}},
      '3.1.1.1.1.2': { version: '1.0.0', cycle: {"Infrastructure Maturity": "3", "Functional Maturity": "1", "Deployment Version": "1", "Compliance Readiness": "1", "Security Readiness": "3", "Homologation Readiness": "2"}},
      '3.1.1.1.1.3': { version: '1.6.2', cycle: {"Infrastructure Maturity": "4", "Functional Maturity": "3", "Deployment Version": "1", "Compliance Readiness": "3", "Security Readiness": "2", "Homologation Readiness": "3"}},
      '2.1.1.1': { version: '1.2.3', cycle: {"Infrastructure Maturity": "4", "Functional Maturity": "3", "Deployment Version": "2", "Compliance Readiness": "3", "Security Readiness": "3", "Homologation Readiness": "3"}},
      '2.1.1.2': { version: '1.0.6', cycle: {"Infrastructure Maturity": "2", "Functional Maturity": "2", "Deployment Version": "1", "Compliance Readiness": "3", "Security Readiness": "3", "Homologation Readiness": "3"}},
      '2.1.1.3': { version: '2.5.7', cycle: {"Infrastructure Maturity": "2", "Functional Maturity": "2", "Deployment Version": "2", "Compliance Readiness": "3", "Security Readiness": "3", "Homologation Readiness": "3"}},
      '3.2.1.1': { version: '1.3.2', cycle: {"Infrastructure Maturity": "3", "Functional Maturity": "1", "Deployment Version": "1", "Compliance Readiness": "3", "Security Readiness": "3", "Homologation Readiness": "1"}},
      '3.2.1.2.1': { version: '4.3.0', cycle: {"Infrastructure Maturity": "5", "Functional Maturity": "4", "Deployment Version": "1", "Compliance Readiness": "2", "Security Readiness": "2", "Homologation Readiness": "2"}},
      '3.2.1.2.1.1': { version: '0.3.2', cycle: {"Infrastructure Maturity": "4", "Functional Maturity": "2", "Deployment Version": "2", "Compliance Readiness": "3", "Security Readiness": "3", "Homologation Readiness": "1"}},
      '3.2.2.1.1': { version: '1.3.1', cycle: {"Infrastructure Maturity": "4", "Functional Maturity": "1", "Deployment Version": "1", "Compliance Readiness": "2", "Security Readiness": "2", "Homologation Readiness": "3"}},
      '3.2.1.2': { version: '7.0.1', cycle: {"Infrastructure Maturity": "2", "Functional Maturity": "1", "Deployment Version": "2", "Compliance Readiness": "1", "Security Readiness": "2", "Homologation Readiness": "1"}},
      '3.2.2.2.1': { version: '7.2.1', cycle: {"Infrastructure Maturity": "2", "Functional Maturity": "2", "Deployment Version": "1", "Compliance Readiness": "1", "Security Readiness": "2", "Homologation Readiness": "1"}},
      '3.2.2.2.1.1': { version: '0.2.1', cycle: {"Infrastructure Maturity": "4", "Functional Maturity": "2", "Deployment Version": "1", "Compliance Readiness": "2", "Security Readiness": "3", "Homologation Readiness": "2"}},
    },
  },
]

const SYSTEM = {
  name: 'Concept Car 2024',
  icon: '/imgs/targets/targetSystem.png',
  version: 'v.1.0',
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
                  name: 'Subscription Manager',
                  version: '1.2.3',
                },
                {
                  id: '2.1.1.2',
                  name: 'Access Control',
                  version: "2.0.2"
                },
                {
                  id: '2.1.1.3',
                  name: 'Driver Preferences',
                  version: "3.2.3"
                }
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
                          version: '1.0',
                        },
                        {
                          id: '3.1.1.1.1.2',
                          name: 'Perfectly Keyless',
                          version: '1.0.4',
                        },
                        {
                          id: '3.1.1.1.1.3',
                          name: 'Safe Door Opening',
                          version: '1.7.4',
                        }
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

const LIFECYCLES = [
  "Infrastructure Maturity",
  "Functional Maturity",
  "Deployment Version",
  "Compliance Readiness",
  "Security Readiness",
  "Homologation Readiness"
]

const DaStaging = ({ isWizard }: DaStagingProps) => {
  const [system, setSystem] = useState<any>(SYSTEM)
  const [targets, setTargets] = useState<any[]>(TARGETS)
  const [activeTarget, setActiveTarget] = useState<any>(null)
  const MODE_OVERVIEW = 'overview'
  const MODE_EDIT_DEFINE = 'edit_define'
  const MODE_ON_TARGET = 'on_target'
  const [mode, setMode] = useState<string>(MODE_OVERVIEW)
  const [stageDefine, setStageDefine] = useState<any>(STANDARD_STAGE)
  const [prototype] = useModelStore((state) => [state.prototype as Prototype])
  const [activeLifeCycle, setActiveLifeCycle] = useState<string>("Deployment Version")

  const handleOpenTargetDocs = (url: string): void => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="min-h-[300px] max-h-[90vh] w-[95vw] min-w-[400px] max-w-[1200px]">
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
          {!isWizard && (
            <DaText variant="title" className="text-da-primary-500">
              Staging
            </DaText>
          )}
          <div className="mt-1 w-full rounded border border-gray-300">
            {/* Title */}
            <div className="flex h-[28px] w-full rounded-t bg-gradient-to-r from-da-gradient-from to-da-gradient-to text-da-white">
              <div className="flex w-[340px] items-center justify-center border-r border-da-white font-bold">
                System
              </div>
              <div className="flex grow items-center justify-center border-da-white font-bold">
                Stages
              </div>
            </div>
            <div className="flex">
              <div className="flex min-w-[340px] flex-1 flex-col border-r border-gray-300 
                    items-center justify-center overflow-x-hidden rounded-s px-1 py-1">
                <div className="flex py-1 h-[80px] w-full items-center justify-center">
                  <img
                    src={system.icon}
                    alt="System"
                    className="scale-90 h-full w-full object-contain"
                  />
                </div>
                <div>
                  <div>
                    <select
                      aria-label="deploy-select"
                      className={`border rounded da-label-small px-2 py-1 w-full min-w-[100px] text-da-gray-dark bg-gray-200 !cursor-pointer`}
                      value={activeLifeCycle}
                      onChange={(e) => {
                        // console.log(`setActiveRtId(e.target.value) `, e.target.value)
                        console.log(e.target.value)
                        setActiveLifeCycle(e.target.value)
                      }}
                    >
                      { LIFECYCLES.map((lifecycle: any) => {
                          return (
                            <option
                              value={lifecycle}
                              key={lifecycle}
                            >
                              <div className="text-[20px] flex items-center !cursor-pointer">
                                {lifecycle}
                              </div>
                            </option>
                          )
                        })}
                    </select>
                  </div>
                </div>
                {/* <DaText variant="small-bold" className="mt-1">
                  {system.name}
                </DaText> */}
                {/* <DaText variant="small" className="mt-1">
                  {system.version}
                </DaText> */}
                {/* <DaButton
                  className="my-2 w-[100px]"
                  onClick={() => {
                    // setMode(MODE_EDIT_DEFINE)
                  }}
                  size="sm"
                >
                  Edit
                </DaButton> */}
              </div>

              {targets &&
                targets.map((target: any, index: number) => (
                  <div key={target.name} className="flex flex-1">
                    {index > 0 && (
                      <div className="relative flex items-center">
                        <div className="h-full border-l border-gray-300"></div>
                        <TbChevronRight className="absolute transform -translate-x-1/2  text-da-secondary-500 bg-white rounded-lg size-10" />
                      </div>
                    )}
                    {/* Target content */}
                    <div className="flex min-w-[100px] flex-1 flex-col items-center justify-center overflow-x-hidden px-1 pb-1 pt-1">
                      <div className="flex h-[80px] py-1 w-full items-center justify-center">
                        <img
                          src={target.icon}
                          alt={target.name}
                          className="scale-90 h-full w-full object-contain"
                        />
                      </div>
                      <div
                        className={cn(
                          'flex items-center  px-2 py-1 rounded-lg',
                          target.target_document_url &&
                            'hover:bg-gray-100  cursor-pointer',
                        )}
                        onClick={() => {
                          if (target.target_document_url) {
                            handleOpenTargetDocs(target.target_document_url)
                          }
                        }}
                      >
                        <DaText variant="small-bold" className="">
                          {target.name}
                        </DaText>
                        {target.target_document_url && (
                          <div className="ml-1">
                            <TbExternalLink className="size-4" />
                          </div>
                        )}
                      </div>
                      {/* <DaText variant="small" className="mt-1">
                        {target.version}
                      </DaText> */}
                      {/* <DaButton
                        variant="outline-nocolor"
                        className="my-1 w-[100px]"
                        onClick={() => {
                          // setActiveTarget(target)
                          // setMode(MODE_ON_TARGET)
                        }}
                        size="sm"
                      >
                        Update
                      </DaButton> */}
                    </div>
                  </div>
                ))}
            </div>
            <div className='min-h-[200px] max-h-[340px] h-full overflow-y-auto'>
              <DaStageComponent
                activeLifeCycle={activeLifeCycle}
                onTargetMode={false}
                targets={targets}
                id="none"
                prototype={prototype}
                isTargetConnected={false}
                activeId={""}
                isUpdating={false}
                editMode={true}
                item={stageDefine}
                level={-1}
                targetState={null}
                onRequestUpdate={(id: string, data: string) => { }}
                onItemEditFinished={(id, data) => { }}
                expandedIds={['3', '3.1', '3.1.1', '3.1.1.1', '3.1.1.1.1']}
              ></DaStageComponent>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DaStaging
