import { DaButton } from '@/components/atoms/DaButton'
import { FC, useEffect, useRef, useState } from 'react'
import { FaAnglesLeft, FaAnglesRight } from 'react-icons/fa6'
import DaRuntimeConnector from '../DaRuntimeConnector'
import { IoPlay, IoStop } from 'react-icons/io5'
import CodeEditor from '../CodeEditor'
import usePermissionHook from '@/hooks/usePermissionHook'
import { PERMISSIONS } from '@/data/permission'
import useCurrentModel from '@/hooks/useCurrentModel'
import DaApisWatch from '../dashboard/DaApisWatch'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import DaMockManager from '../dashboard/DaMockManager'
import { DaInput } from '@/components/atoms/DaInput'
import { SlOptionsVertical } from 'react-icons/sl'
import { BiSend } from 'react-icons/bi'
import useWizardGenAIStore from '@/stores/genAIWizardStore'

const DEFAULT_KIT_SERVER = 'https://kit.digitalauto.tech'

const AlwaysScrollToBottom = () => {
  const elementRef = useRef<any>(null)
  useEffect(() => {
    if (elementRef && elementRef.current) {
      elementRef.current.scrollIntoView()
    }
  })

  return <div ref={elementRef} />
}

const DaGenAI_RuntimeControl = () => {
  const { data: currentUser } = useSelfProfileQuery()
  const [isExpand, setIsExpand] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [activeRtId, setActiveRtId] = useState<string | undefined>('')
  const [log, setLog] = useState<string>('')
  const runTimeRef = useRef<any>()
  const runTimeRef1 = useRef<any>()

  const [activeTab, setActiveTab] = useState<string>('output')
  const { data: model } = useCurrentModel()
  const [isAuthorized] = usePermissionHook([PERMISSIONS.READ_MODEL, model?.id])

  const [usedApis, setUsedApis] = useState<any[]>([])
  const [code, setCode] = useState<string>('')

  const [mockSignals, setMockSignals] = useState<any[]>([])
  const [customKitServer, setCustomKitServer] = useState<string>(
    localStorage.getItem('customKitServer') || '',
  )
  const [tmpCustomKitServer, setTmpCustomKitServer] = useState<string>(
    localStorage.getItem('customKitServer') || '',
  )
  const [isShowEditKitServer, setIsShowEditKitServer] = useState<boolean>(false)

  useEffect(() => {
    localStorage.setItem('customKitServer', customKitServer.trim())
  }, [customKitServer])

  const { prototypeData, setPrototypeData, activeModelApis } =
    useWizardGenAIStore()

  useEffect(() => {
    if (prototypeData) {
      console.log('prototypeData', prototypeData)
      setCode(prototypeData.code || '')
    } else {
      setCode('')
    }
  }, [prototypeData?.code])

  useEffect(() => {
    if (!code || !activeModelApis || activeModelApis.length === 0) {
      setUsedApis([])
      return
    }
    let apis: any[] = []
    activeModelApis.forEach((item: any) => {
      if (code.includes(item.shortName)) {
        apis.push(item.name)
      }
    })
    setUsedApis(apis)
  }, [code, activeModelApis])

  const appendLog = (content: String) => {
    if (!content) return
    setLog((log) => log + content)
  }

  return (
    <div
      className={`absolute bottom-0 right-0 top-0 z-10 ${isExpand ? 'w-[500px]' : 'w-16'} flex flex-col justify-center bg-da-gray-dark px-1 py-2 text-da-gray-light`}
    >
      {/* <div>{customKitServer}</div> */}
      {isExpand && isShowEditKitServer && (
        <div className="flex mb-2">
          <DaInput
            className="grow text-da-black"
            value={tmpCustomKitServer}
            onChange={(e) => {
              setTmpCustomKitServer(e.target.value)
            }}
          />
          <DaButton
            className="ml-2 w-20"
            onClick={() => {
              setCustomKitServer(tmpCustomKitServer)
              setIsShowEditKitServer(false)
            }}
          >
            Set
          </DaButton>
          <DaButton
            className="ml-2 w-20"
            onClick={() => {
              setIsShowEditKitServer(false)
            }}
          >
            Cancel
          </DaButton>
        </div>
      )}
      <div className="px-1 flex">
        {customKitServer && customKitServer.trim().length > 0 ? (
          <DaRuntimeConnector
            targetPrefix="runtime-"
            kitServerUrl={customKitServer}
            ref={runTimeRef}
            usedAPIs={usedApis}
            onActiveRtChanged={(rtId: string | undefined) =>
              setActiveRtId(rtId)
            }
            onLoadedMockSignals={setMockSignals}
            onNewLog={appendLog}
            onAppExit={() => {
              setIsRunning(false)
            }}
          />
        ) : (
          <DaRuntimeConnector
            targetPrefix="runtime-"
            kitServerUrl={DEFAULT_KIT_SERVER}
            ref={runTimeRef1}
            usedAPIs={usedApis}
            onActiveRtChanged={(rtId: string | undefined) =>
              setActiveRtId(rtId)
            }
            onLoadedMockSignals={setMockSignals}
            onNewLog={appendLog}
            onAppExit={() => {
              setIsRunning(false)
            }}
          />
        )}
        <div className="grow" />

        <SlOptionsVertical
          size={36}
          className="text-da-white cursor-pointer hover:bg-slate-500 p-2 rounded"
          onClick={() => {
            setIsShowEditKitServer((v) => !v)
          }}
        />
      </div>

      <div className={`flex px-1 ${!isExpand && 'flex-col'}`}>
        {activeRtId && (
          <>
            <button
              disabled={isRunning}
              onClick={() => {
                setIsRunning(true)
                setActiveTab('output')
                setLog('')
                if (runTimeRef.current) {
                  runTimeRef.current?.runApp(code || '')
                }
                if (runTimeRef1.current) {
                  runTimeRef1.current?.runApp(code || '')
                }
                const userId = currentUser?.id || 'Anonymous'
              }}
              className="da-label-regular-bold mt-1 flex items-center justify-center rounded border border-da-gray-medium p-2 hover:bg-da-gray-medium disabled:text-da-gray-medium"
            >
              <IoPlay />
            </button>
            <button
              disabled={!isRunning}
              onClick={() => {
                setIsRunning(false)
                if (runTimeRef.current) {
                  runTimeRef.current?.stopApp()
                }
                if (runTimeRef1.current) {
                  runTimeRef1.current?.stopApp()
                }
              }}
              className={`${isExpand && 'mx-2'} da-label-regular-bold mt-1 flex items-center justify-center rounded border border-da-gray-medium p-2 hover:bg-da-gray-medium disabled:text-da-gray-medium`}
            >
              <IoStop />
            </button>
          </>
        )}
        <div className="grow"></div>
        {isExpand && (
          <DaButton
            size="sm"
            variant="outline"
            className="ml-4 mt-1 !text-white hover:!text-da-gray-medium !border-da-white hover:!border-da-gray-medium"
            onClick={() => {
              setLog('')
              if (runTimeRef.current) {
                runTimeRef.current?.deploy()
              }
              if (runTimeRef1.current) {
                runTimeRef1.current?.deploy()
              }
            }}
          >
            Deploy
            <BiSend className="ml-1" size={20} />
          </DaButton>
        )}

        {isExpand && (
          <DaButton
            size="sm"
            variant="plain"
            className="mt-1 ml-2 !text-white hover:!text-da-gray-medium !border-da-white hover:!border-da-gray-medium"
            onClick={() => {
              setLog('')
            }}
          >
            Clear log
          </DaButton>
        )}
      </div>

      <div className="mt-1 grow overflow-y-auto">
        {isExpand && (
          <>
            {activeTab == 'output' && (
              <p className="da-label-tiny h-full overflow-y-auto whitespace-pre-wrap rounded bg-da-black px-2 py-1 text-da-white">
                {log}
                <AlwaysScrollToBottom />
              </p>
            )}

            {activeTab == 'apis' && (
              <DaApisWatch
                requestWriteSignalValue={(obj: any) => {
                  if (runTimeRef.current) {
                    runTimeRef.current?.writeSignalsValue(obj)
                  }
                  if (runTimeRef1.current) {
                    runTimeRef1.current?.writeSignalsValue(obj)
                  }
                }}
              />
            )}

            {activeTab == 'code' && (
              <CodeEditor
                code={code || ''}
                setCode={setCode}
                editable={isAuthorized}
                language="python"
                onBlur={() => {}}
              />
            )}

            {activeTab == 'mock' && (
              <DaMockManager
                mockSignals={mockSignals}
                loadMockSignalsFromRt={() => {
                  if (runTimeRef.current) {
                    runTimeRef.current?.loadMockSignals()
                  }
                  if (runTimeRef1.current) {
                    runTimeRef1.current?.loadMockSignals()
                  }
                }}
                sendMockSignalsToRt={(signals: any[]) => {
                  if (runTimeRef.current) {
                    runTimeRef.current?.setMockSignals(signals)
                  }
                  if (runTimeRef1.current) {
                    runTimeRef1.current?.setMockSignals(signals)
                  }
                }}
              />
            )}
          </>
        )}
      </div>

      <div className="flex">
        <DaButton
          variant="plain"
          onClick={() => {
            setIsExpand((v) => !v)
          }}
        >
          {isExpand ? (
            <FaAnglesRight className="text-da-white" />
          ) : (
            <FaAnglesLeft className="text-da-white" />
          )}
        </DaButton>

        {isExpand && (
          <>
            <div className="grow"></div>
            <div
              className={`da-label-small flex cursor-pointer items-center px-4 py-0.5 text-da-white hover:bg-da-gray-medium ${activeTab == 'output' && 'border-b-2 border-da-white'}`}
              onClick={() => {
                setActiveTab('output')
              }}
            >
              Terminal{' '}
            </div>
            <div
              className={`da-label-small flex cursor-pointer items-center px-4 py-0.5 text-da-white hover:bg-da-gray-medium ${activeTab == 'apis' && 'border-b-2 border-da-white'}`}
              onClick={() => {
                setActiveTab('apis')
              }}
            >
              Signals Watch
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default DaGenAI_RuntimeControl
