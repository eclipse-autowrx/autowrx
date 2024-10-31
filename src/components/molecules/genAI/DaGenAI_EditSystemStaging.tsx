import DaText from '@/components/atoms/DaText'
import { useEffect, useState, useRef } from 'react'
import useModelStore from '@/stores/modelStore'
import { Prototype } from '@/types/model.type'
import { DaButton } from '@/components/atoms/DaButton'
import DaStageComponent from '../staging/DaStageComponent'
import { IoMdArrowRoundBack } from 'react-icons/io'
import config from '@/configs/config'
import DaGenAI_RuntimeConnector from './DaGenAI_RuntimeConnector'
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

const DaGenAI_EditSystemStaging = ({
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

  // Timeout effect to handle server response delay
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
        <div className="flex mb-2 justify-between mt-4">
          <div className=" bg-gray-100 rounded w-[32%] border border-gray-300 p-3">
            <DaText variant="sub-title" className="text-da-primary-500">
              System
            </DaText>
            <div className="flex mt-2">
              <div className="w-[80px]">Name:</div>
              <div className="grow">{system && system.name}</div>
            </div>
            <div className="flex mt-2">
              <div className="w-[80px]">Version:</div>
              <div className="grow text-da-black">
                <b>{system && system.version}</b>
              </div>
            </div>
          </div>

          <div className=" bg-gray-100 rounded w-[32%] border border-gray-300 p-3">
            <DaText variant="sub-title" className="text-da-primary-500">
              Stage
            </DaText>
            <div className="flex mt-2">
              <div className="w-[80px]">Name:</div>
              <div className="grow">{target && target.name}</div>
            </div>
            <div className="flex mt-2">
              <div className="w-[80px]">Version:</div>
              <div className="grow text-da-gray-dark">
                <b>{target && target.version}</b>
              </div>
            </div>
            <div className="mt-2">
              {target && (
                <DaGenAI_RuntimeConnector
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
                  <div className="da-small-medium mr-2 line-clamp-3">
                    Response:
                  </div>
                  <div className="ml-2 bg-da-black text-da-white px-2 py-1.5 rounded da-label-tiny grow leading-tight">
                    {log.map((entry, index) => (
                      <div key={index}>{entry}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className=" bg-gray-100 rounded w-[32%] border border-gray-300 p-3">
            <DaText variant="sub-title" className="text-da-primary-500">
              Update
            </DaText>
            <div className="flex mt-2">
              <div className="w-[80px]">Date:</div>
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
              <div className="w-[80px]">By:</div>
              <div className="grow text-da-gray-dark">
                <b>{profile ? profile.name : 'John Doe'}</b>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-[400px] overflow-y-auto mt-4 xl:mt-6">
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

          {define && (
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
            />
          )}
        </div>
      </div>

      {!onTargetMode && (
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
    </div>
  )
}

export default DaGenAI_EditSystemStaging
