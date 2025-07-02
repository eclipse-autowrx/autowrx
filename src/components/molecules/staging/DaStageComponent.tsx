// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useEffect, useState } from 'react'
import { IoIosArrowForward, IoIosArrowDown } from 'react-icons/io'
import { BsDot } from 'react-icons/bs'
import { cn } from '@/lib/utils'
import { CiEdit } from 'react-icons/ci'
import { IoSaveOutline } from 'react-icons/io5'
import { MdOutlineCancel } from 'react-icons/md'
import DaTooltip from '@/components/atoms/DaTooltip'
import { ItemIndicator } from '@radix-ui/react-select'
import DaMenu from '@/components/atoms/DaMenu'
import { FaCaretDown } from 'react-icons/fa'

interface DaStageComponentProps {
  id: string
  activeId: string
  onTargetMode: boolean
  targets: any
  editMode: boolean
  targetState: any
  item: any
  className?: string
  prototype: any
  level: number
  isUpdating: boolean
  isTargetConnected: boolean
  activeLifeCycle: string
  expandedIds?: string[] // NEW PROP to control expanded items
  onItemEditFinished?: (id: string, data: string) => void
  onRequestUpdate?: (id: string, data: string) => void
}

interface VersionRenderProps {
  target: any
  code: string
  activeLifeCycle: string
  latestVersion: string
}

const InfrastructureMaturity = [
  {
    ID: '1',
    name: 'Planned',
    description: 'Component is conceptualized; requirements are being defined.',
    icon: '📌',
  },
  {
    ID: '2',
    name: 'Prototyped',
    description: 'Initial implementation exists, but not yet integrated.',
    icon: '🛠️',
  },
  {
    ID: '3',
    name: 'Integrated',
    description: 'Available in a development or pre-production environment.',
    icon: '🔗',
  },
  {
    ID: '4',
    name: 'Certified',
    description:
      'Meets infrastructure compliance, security, and performance requirements.',
    icon: '✅',
  },
]

const FunctionalMaturity = [
  {
    ID: '1',
    name: 'Feature Defined',
    description: 'Functional specification is complete.',
    icon: '📝',
  },
  {
    ID: '2',
    name: 'Prototype Available',
    description:
      'Early-stage implementation exists but is not production-ready.',
    icon: '🔬',
  },
  {
    ID: '3',
    name: 'Baseline Established',
    description: 'First stable version with core functionality.',
    icon: '⚙️',
  },
  {
    ID: '4',
    name: 'Feature Complete',
    description: 'Fully functional with all intended features.',
    icon: '🎯',
  },
  {
    ID: '5',
    name: 'Optimized',
    description: 'Performance tuning, efficiency, and robustness improvements.',
    icon: '🚀',
  },
]

const DeploymentVersion = [
  {
    ID: '1',
    name: 'Older version',
    description: 'Work-in-progress; frequent changes.',
    icon: '✗',
  },
  {
    ID: '2',
    name: 'Latest version',
    description: 'Merged into a shared environment with other components.',
    icon: '🗸',
  }
]

const ComplianceReadiness = [
  {
    ID: '1',
    name: 'Regulatory Mapping Complete',
    description: 'Applicable regulations identified.',
    icon: '📜',
  },
  {
    ID: '2',
    name: 'Requirements Implemented',
    description: 'Compliance measures integrated.',
    icon: '🛡',
  },
  {
    ID: '3',
    name: 'Preliminary Assessment',
    description: 'Initial compliance checks completed.',
    icon: '🔍',
  },
  {
    ID: '4',
    name: 'Certified',
    description: 'Passed regulatory audits and certified for use.',
    icon: '✅',
  },
  {
    ID: '5',
    name: 'Maintained',
    description: 'Compliance monitored and updated as regulations evolve.',
    icon: '🔄',
  },
]

const SecurityReadiness = [
  {
    ID: '1',
    name: 'Threat Model Defined',
    description: 'Security risks and attack vectors analyzed.',
    icon: '⚠️',
  },
  {
    ID: '2',
    name: 'Security Controls Implemented',
    description: 'Encryption and authentication mechanisms integrated.',
    icon: '🔐',
  },
  {
    ID: '3',
    name: 'Vulnerability Tested',
    description: 'Security testing, including penetration testing, conducted.',
    icon: '🛡',
  },
  {
    ID: '4',
    name: 'Certified Secure',
    description: 'Meets security certification standards.',
    icon: '✅',
  },
  {
    ID: '5',
    name: 'Security Monitoring Active',
    description: 'Continuous monitoring for vulnerabilities and threats.',
    icon: '🔍',
  },
]

const HomologationReadiness = [
  {
    ID: '1',
    name: 'Homologation Impact Assessed',
    description: 'Impact on vehicle-level certification analyzed.',
    icon: '⚖️',
  },
  {
    ID: '2',
    name: 'Certification Strategy Defined',
    description: 'Approach for compliance certification established.',
    icon: '📑',
  },
  {
    ID: '3',
    name: 'Pre-Homologation Tests Passed',
    description:
      'Initial verification against regulatory test cases completed.',
    icon: '🔍',
  },
  {
    ID: '4',
    name: 'Certified for Deployment',
    description: 'Regulatory approval obtained for production release.',
    icon: '✅',
  },
  {
    ID: '5',
    name: 'In-Service Compliance Ensured',
    description:
      'Ongoing adherence to regulatory requirements monitored post-deployment.',
    icon: '🔄',
  },
]

interface LoadingBarProps {
  progress: number
}

const LoadingBar = ({ progress }: LoadingBarProps) => {
  return (
    <div className="mx-8 loading-bar-container">
      <div className="loading-bar" style={{ width: `${progress}%` }}></div>
    </div>
  );
};

const VersionRender = ({
  target,
  code,
  activeLifeCycle,
  latestVersion,
}: VersionRenderProps) => {
  const [item, setItem] = useState<any>(null)
  const [options, setOptions] = useState<any[]>([])
  const [activeOption, setActiveOption] = useState<any>(null)
  const [progress, setProgress] = useState<number>(0)
  const [version, setVersion] = useState<string>("")

  useEffect(() => {
    if (code && target && target.state) {
      setItem(target.state[code])
      setVersion(target.state[code]?.version || '')
      return
    }
    setItem(null)
  }, [code, target])

  useEffect(() => {
    // console.log('activeLifeCycle', activeLifeCycle)
    switch (activeLifeCycle) {
      case 'Infrastructure Maturity':
        setOptions(InfrastructureMaturity)
        break
      case 'Functional Maturity':
        setOptions(FunctionalMaturity)
        break
      case 'Deployment Version':
        setOptions(DeploymentVersion)
        break
      case 'Compliance Readiness':
        setOptions(ComplianceReadiness)
        break
      case 'Security Readiness':
        setOptions(SecurityReadiness)
        break
      case 'Homologation Readiness':
        setOptions(HomologationReadiness)
        break
      default:
        setOptions([])
        break
    }
  }, [activeLifeCycle])

  useEffect(() => {
    if (!options) {
      setActiveOption(null)
      return
    }

    if (item && activeLifeCycle && item.cycle && item.cycle[activeLifeCycle]) {
      setActiveOption(options.find((o) => o.ID == item.cycle[activeLifeCycle]))
    } else {
      setActiveOption(options[0])
    }
  }, [options, item, activeLifeCycle])

  if (!item) return <span></span>

  if(progress) return <LoadingBar progress={progress} />

  return (
    <div className="flex items-center">
      <DaTooltip
        content={
          <div className="text-white fobt-bold text-sm">
            <div className="font-bold text-left">{activeOption?.name}</div>
            <div className="font-light text-left">
              {activeOption?.description}
            </div>
          </div>
        }
        className="normal-case"
      >
        <div className="flex items-center w-20">
          <span className="da-label-tiny w-6">{version || '1.0.0'}</span>
          <span className={`ml-2 mr-2 text-[18px] ${activeOption?.icon=='✗' && 'text-red-500'} ${activeOption?.icon=='🗸' && 'text-green-500'}` }>
            {activeOption?.icon}
          </span>
        </div>
      </DaTooltip>
      <DaMenu
        trigger={<FaCaretDown size={14} />}
      >
        {options &&
          options.map((option: any) => (
            <div className="text-sm py-1 px-2 flex items-center !cursor-pointer hover:bg-slate-200"
              onClick={() => {
                let tick = 150
                if(activeLifeCycle == "Deployment Version") {
                  tick = 400
                }
                const interval = setInterval(() => {
                  setProgress((prevProgress) => {
                    if (prevProgress > 100) {
                      clearInterval(interval);
                      setActiveOption(option)
                      if(activeLifeCycle == "Deployment Version") {
                        setVersion(latestVersion || "9.8.3")
                      }
                      return 0;
                    }
                    return prevProgress + 10;
                  });
                }, tick)
              }}>
              <div className="mr-2 w-8 text-[18px]">{option.icon}</div>
              <div className="">{option.name}</div>
            </div>
          ))}
      </DaMenu>
    </div>
  )
}


const DaStageComponent = ({
  id,
  prototype,
  isTargetConnected,
  activeId,
  isUpdating,
  onTargetMode,
  targetState,
  targets,
  editMode,
  item,
  className,
  level,
  expandedIds = [], // Default to an empty array
  onItemEditFinished,
  onRequestUpdate,
  activeLifeCycle
}: DaStageComponentProps) => {
  // Initialize expansion state based on whether the item's id is in expandedIds
  const [isExpanded, setIsExpanded] = useState<boolean>(
    expandedIds.includes(item?.id), // Check if the item should be expanded by default
  )
  const [inEditMode, setInEditMode] = useState<boolean>(false)
  const [editVersion, setEditVersion] = useState<string>(item.version || '')

  return (
    <>
      {!item.isTopMost && (
        <div
          className={cn(
            'h-[28px] text-xs w-full border-y flex items-center',
            className,
          )}
        >
          <div className="flex min-w-[340px] max-w-[340px] flex-1 items-center leading-none">
            <div className={`h-full grow flex items-center`}>
              <div className="w-2"></div>
              {level >= 0 &&
                [...Array(level)].map((x, i) => (
                  <div key={i} className="w-2" />
                ))}
              {item.children && item.children.length > 0 ? (
                <>
                  {!isExpanded && (
                    <IoIosArrowForward
                      className="cursor-pointer mr-1"
                      size={16}
                      onClick={() => setIsExpanded(true)} // Toggle expansion
                    />
                  )}
                  {isExpanded && (
                    <IoIosArrowDown
                      className="cursor-pointer mr-1"
                      size={16}
                      onClick={() => setIsExpanded(false)} // Toggle collapse
                    />
                  )}
                </>
              ) : (
                <BsDot size={16} className="mr-1"></BsDot>
              )}
              {item.id === '3.1.1.1.1.1' ? (
                prototype && prototype.name ? (
                  prototype.name
                ) : (
                  item.name
                )
              ) : (
                item.name
              )}
            </div>

            <div className="h-full px-2 flex items-center justify-center w-24 border-l">
              {!inEditMode && (item.version || '')}
              {inEditMode && (
                <input
                  className={cn(
                    `grow bg-da-white rounded flex px-2 py-1 h-6 w-full placeholder:text-da-gray-dark focus-visible:ring-0 focus-visible:outline-none border border-da-gray-medium disabled:cursor-not-allowed`,
                  )}
                  value={editVersion}
                  onChange={(e) => setEditVersion(e.target.value)}
                  onKeyPress={(event) => {
                    if (event.key === 'Enter') {
                      if (editVersion.trim().length > 0) {
                        if (onItemEditFinished) {
                          onItemEditFinished(item.id, editVersion.trim())
                        }
                        setInEditMode(false)
                      }
                    }
                  }}
                />
              )}
            </div>
          </div>


          { !onTargetMode &&
            <div className="grow flex items-center">
              {targets &&
                targets.map((target: any, index: number) => (
                  <div
                    key={target.name}
                    className="flex flex-1 justify-center items-center"
                  >
                    <VersionRender
                      target={target}
                      code={item.id}
                      activeLifeCycle={activeLifeCycle}
                      latestVersion={item.version||''}
                    />
                  </div>
                ))}
            </div>
          }

          {/* {!onTargetMode && (
            <div className="h-full px-2 flex items-center justify-center w-24 border-l">
              {item.version && (
                <>
                  {!inEditMode && (
                    <CiEdit
                      size={26}
                      className="cursor-pointer hover:opacity-50"
                      onClick={() => setInEditMode(true)}
                    />
                  )}
                  {inEditMode && (
                    <>
                      <MdOutlineCancel
                        size={24}
                        className="cursor-pointer hover:opacity-50"
                        onClick={() => setInEditMode(false)}
                      />
                      <IoSaveOutline
                        size={24}
                        className={cn(
                          'ml-4 cursor-pointer hover:opacity-50',
                          editVersion.trim().length < 0 && 'text-da-gray-light',
                        )}
                        onClick={() => {
                          if (editVersion.trim().length < 0) {
                            return
                          }
                          if (onItemEditFinished) {
                            onItemEditFinished(item.id, editVersion.trim())
                          }
                          setInEditMode(false)
                        }}
                      />
                    </>
                  )}
                </>
              )}
            </div>
          )} */}

          {onTargetMode && (
            <>
              <div className="h-full px-2 flex items-center justify-center w-24 border-l">
                {isTargetConnected &&
                  item.version &&
                  targetState &&
                  targetState[item.id] &&
                  item.version !== targetState[item.id] && (
                    <>
                      {isUpdating && activeId == item.id && (
                        <div>Updating...</div>
                      )}
                      {!isUpdating && (
                        <button
                          className="rounded px-2 py-0 da-btn-solid"
                          onClick={() => {
                            if (onRequestUpdate) {
                              onRequestUpdate(item.id, item.version)
                            }
                          }}
                        >
                          Update
                        </button>
                      )}
                    </>
                  )}
              </div>
              {/* <div className="h-full px-2 flex items-center justify-center w-32 border-l">
                {isTargetConnected && (
                  <>
                    {item.version &&
                      targetState &&
                      item.version != targetState[item.id] && (
                        <span className="font-bold text-red-500">
                          {targetState[item.id]}
                        </span>
                      )}
                    {item.version &&
                      targetState &&
                      (!targetState[item.id] ||
                        item.version == targetState[item.id]) && (
                        <span className="">{item.version}</span>
                      )}
                  </>
                )}
              </div> */}
            </>
          )} 
        </div>
      )}

      {/* Recursively render child components */}
      {(isExpanded || item.isTopMost) &&
        item.children.map((it: any, index: number) => (
          <DaStageComponent
            key={index}
            activeLifeCycle={activeLifeCycle}
            prototype={prototype}
            onTargetMode={onTargetMode}
            onItemEditFinished={onItemEditFinished}
            onRequestUpdate={onRequestUpdate}
            targetState={targetState}
            isUpdating={isUpdating}
            targets={targets}
            isTargetConnected={isTargetConnected}
            id={item.id}
            activeId={activeId}
            level={level + 1}
            editMode={editMode}
            className=""
            item={it}
            expandedIds={expandedIds} // Pass down expandedIds to child components
          />
        ))}
    </>
  )
}

export default DaStageComponent
