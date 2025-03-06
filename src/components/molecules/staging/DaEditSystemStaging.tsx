import DaText from '@/components/atoms/DaText'
import DaRuntimeConnector from '../DaRuntimeConnector'
import { useEffect, useState, useRef } from 'react'
import useRuntimeStore from '@/stores/runtimeStore'
import { shallow } from 'zustand/shallow'
import useCurrentPrototype from '@/hooks/useCurrentPrototype'
import useModelStore from '@/stores/modelStore'
import { Prototype } from '@/types/model.type'
import { DaButton } from '@/components/atoms/DaButton'
import DaStageComponent from './DaStageComponent'
import { IoMdArrowRoundBack } from 'react-icons/io'
import config from '@/configs/config'
import useSelfProfileQuery from '@/hooks/useSelfProfile'

const DEFAULT_KIT_SERVER = 'https://kit.digitalauto.tech'

interface DaEditSystemStagingProps {
  onTargetMode: boolean
  stageDefine: any
  system: any
  target: any
  onFinish?: (data: any) => void
  onCancel?: () => void
}

const DaEditSystemStaging = ({
  stageDefine,
  onTargetMode,
  system,
  target,
  onFinish,
  onCancel,
}: DaEditSystemStagingProps) => {
  const [define, setDefine] = useState<any>(null)
  const [activeRtId, setActiveRtId] = useState<string>('')
  const [isUpdating, setIsUpdating] = useState<boolean>(false)
  const [activeId, setActiveId] = useState<string>('')
  const runTimeRef = useRef<any>()
  const [log, setLog] = useState<string[]>([])
  const { data: profile } = useSelfProfileQuery()

  const [prototype] = useModelStore((state) => [state.prototype as Prototype])

  useEffect(() => {
    setDefine(stageDefine)
  }, [])

  const updateDefineAtId = (id: string, value: string) => {
    let tmpDefine = JSON.parse(JSON.stringify(stageDefine))
    childUpdate(tmpDefine.children, id, value)
    setDefine(tmpDefine)
  }
  const childUpdate = (items: any[], id: string, value: string) => {
    if (items && items.length > 0) {
      items.forEach((item) => {
        if (item.id == id) {
          item.version = value
          return
        }
        if (item.children && item.children.length > 0) {
          childUpdate(item.children, id, value)
        }
      })
    }
  }

  useEffect(() => {
    if (isUpdating) {
      const timeoutDuration = 10000 // 10 seconds

      const timer = setTimeout(() => {
        // If still updating and no new log messages were received in 10s, mark timeout
        if (isUpdating && log.length === 0) {
          setLog([
            'Request timeout, please try again as the runtime may be busy or experiencing issues.',
          ])
          setIsUpdating(false)

          // Clear log after 3 seconds
          setTimeout(() => {
            setLog([])
          }, 3000)
        }
      }, timeoutDuration)

      return () => clearTimeout(timer) // Clear timeout if updating finishes early or log changes
    }
  }, [isUpdating, log])

  return (
    <div className="w-full h-full">
      <div className="w-full flex items-center">
        <IoMdArrowRoundBack
          className="mr-2 cursor-pointer hover:opacity-50"
          size={26}
          onClick={() => {
            if (onCancel) {
              onCancel()
            }
          }}
        />
        <DaText variant="title" className="text-da-gray-dark">
          {!onTargetMode && 'Edit System Definition'}
          {onTargetMode && 'Update Stage'}
        </DaText>
      </div>

      {onTargetMode && (
        <div className=" mb-2 justify-between mt-4 grid grid-cols-12 gap-3">
          <div className=" bg-gray-100 rounded col-span-3 border border-gray-300 p-3">
            <DaText variant="sub-title" className="text-da-primary-500">
              System
            </DaText>
            <div className="flex mt-2">
              <div className="w-[80px] text-da-gray-dark font-medium">
                Name:
              </div>
              <div className="grow">{system && system.name}</div>
            </div>
            <div className="flex mt-2">
              <div className="w-[80px] text-da-gray-dark font-medium">
                Version:
              </div>
              <div className="grow text-da-gray-dark">
                <b>{system && system.version}</b>
              </div>
            </div>
          </div>

          <div className=" bg-gray-100 rounded col-span-6 border border-gray-300 p-3">
            <DaText variant="sub-title" className="text-da-primary-500">
              Stage
            </DaText>
            <div className="flex mt-2">
              <div className="w-[100px] text-da-gray-dark font-medium">
                Name:
              </div>
              <div className="grow">{target && target.name}</div>
            </div>
            <div className="flex mt-2">
              <div className="w-[100px] text-da-gray-dark font-medium">
                Version:
              </div>
              <div className="grow text-da-gray-dark">
                <b>{target && target.version}</b>
              </div>
            </div>
            <div className="mt-2">
              {target && (
                <DaRuntimeConnector
                  isDeployMode={true}
                  targetPrefix={target.prefix || 'runtime-'}
                  kitServerUrl={config?.runtime?.url || DEFAULT_KIT_SERVER}
                  ref={runTimeRef}
                  usedAPIs={[]}
                  onActiveRtChanged={(rtId: string | undefined) => {
                    setActiveRtId(rtId || '')
                  }}
                  onDeployResponse={(newLog: string, isDone: boolean) => {
                    if (newLog) {
                      // Append new log to the log state, keeping only the last 3 logs
                      setLog((prevLog) => {
                        const updatedLog = [...prevLog, newLog].slice(-3)
                        return updatedLog
                      })
                    }
                    if (isDone) {
                      setIsUpdating(false)
                      setTimeout(() => {
                        setLog([]) // Optionally reset the log after a delay
                      }, 2000)
                    }
                  }}
                />
              )}
              {log.length > 0 && (
                <div className="mt-2 flex">
                  <div className="w-[100px] font-medium text-da-gray-dark line-clamp-3">
                    Response:
                  </div>
                  <div className="min-h-8 bg-da-black text-da-white px-2 py-1.5 rounded da-label-tiny grow leading-tight">
                    {log.map((entry, index) => (
                      <div key={index}>{entry}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className=" bg-gray-100 rounded col-span-3 border border-gray-300 p-3">
            <DaText variant="sub-title" className="text-da-primary-500">
              Update
            </DaText>
            <div className="flex mt-2">
              <div className="w-[80px] font-medium text-da-gray-dark">
                Date:
              </div>
              <div className="grow">
                {new Date().toLocaleString('en-GB', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                })}
              </div>
            </div>
            <div className="flex mt-2">
              <div className="w-[80px] font-medium text-da-gray-dark">By:</div>
              <div className="grow text-da-gray-dark">
                <b>{profile ? profile.name : 'John Doe'}</b>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col max-h-[50vh] overflow-y-auto mt-3">
        <div className="w-full rounded border">
          <div className="flex h-[40px] w-full border-b text-da-gray-dark rounded-t font-bold">
            <div className="h-full px-4 flex items-center grow">
              System Elements
            </div>
            <div className="h-full px-2 flex items-center justify-center w-24 border-l">
              Version
            </div>
            {!onTargetMode && (
              <div className="h-full px-2 flex items-center justify-center w-24 border-l">
                Actions
              </div>
            )}
            {onTargetMode && (
              <>
                <div className="h-full px-2 flex items-center justify-center w-24 border-l">
                  Update
                </div>
                <div className="h-full px-2 flex items-center justify-center w-32 border-l text-base">
                  {target.short_name || target.name}
                </div>
              </>
            )}
          </div>

          {/* {define && (
            <DaStageComponent
              onTargetMode={onTargetMode}
              id="none"
              prototype={prototype}
              isTargetConnected={!!activeRtId}
              activeId={activeId}
              isUpdating={isUpdating}
              editMode={true}
              item={define}
              level={-1}
              targetState={target && target.state}
              onRequestUpdate={(id: string, data: string) => {
                if (activeRtId && runTimeRef && runTimeRef.current) {
                  runTimeRef.current.deploy()
                  setActiveId(id)
                  setIsUpdating(true)
                }
              }}
              onItemEditFinished={(id, data) => {
                updateDefineAtId(id, data)
              }}
              expandedIds={['3', '3.1', '3.1.1', '3.1.1.1', '3.1.1.1.1']}
            ></DaStageComponent>
          )} */}
        </div>
      </div>

      {/* {!onTargetMode && (
        <div className="flex mt-2">
          <div className="grow"></div>
          <DaButton
            className="w-20 ml-2"
            variant="outline"
            onClick={() => {
              if (onCancel) {
                onCancel()
              }
            }}
          >
            Cancel
          </DaButton>
          <DaButton
            className="w-20 ml-2"
            onClick={() => {
              if (onFinish) {
                onFinish(define)
              }
            }}
          >
            Save
          </DaButton>
        </div>
      )}

      {onTargetMode && (
        <div className="flex mt-2">
          <DaButton
            className="w-20 ml-2"
            variant="outline"
            onClick={() => {
              if (onCancel) {
                onCancel()
              }
            }}
          >
            Go back
          </DaButton>
          <div className="grow"></div>
        </div>
      )} */}
    </div>
  )
}

export default DaEditSystemStaging
