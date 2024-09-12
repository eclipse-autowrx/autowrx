import { DaButton } from '@/components/atoms/DaButton'
import { useEffect, useRef, useState } from 'react'
import { FaAnglesLeft, FaAnglesRight } from 'react-icons/fa6'
import DaRuntimeConnector from '../DaRuntimeConnector'
import { IoPlay, IoStop } from 'react-icons/io5'
import CodeEditor from '../CodeEditor'
import usePermissionHook from '@/hooks/usePermissionHook'
import { PERMISSIONS } from '@/data/permission'
import useCurrentModel from '@/hooks/useCurrentModel'
import DaApisWatch from '../dashboard/DaApisWatch'
import DaMockManager from '../dashboard/DaMockManager'
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
  const [isExpand, setIsExpand] = useState(false)
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

  const {
    prototypeData,
    setPrototypeData,
    activeModelApis,
    registerWizardSimulationRun,
    registerWizardSimulationStop,
    wizardSimulating,
    setWizardSimulating,
  } = useWizardGenAIStore()

  useEffect(() => {
    if (prototypeData) {
      console.log('prototypeData', prototypeData)
      setCode(prototypeData.code || '')
    } else {
      setCode('')
    }
  }, [prototypeData])

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

  const handleRun = () => {
    console.log('Running simulation with code', code)
    setWizardSimulating(true)
    setActiveTab('output')
    setLog('')
    if (runTimeRef.current) {
      runTimeRef.current?.runApp(code || '')
    }
    if (runTimeRef1.current) {
      runTimeRef1.current?.runApp(code || '')
    }
  }

  const handleStop = () => {
    console.log('Stopping simulation')
    setWizardSimulating(false)
    if (runTimeRef.current) {
      runTimeRef.current?.stopApp()
    }
    if (runTimeRef1.current) {
      runTimeRef1.current?.stopApp()
    }
  }

  useEffect(() => {
    registerWizardSimulationRun(handleRun)
    registerWizardSimulationStop(handleStop)
  }, [])

  return (
    <div
      className={`hidden absolute bottom-0 right-0 top-0 z-10 ${isExpand ? 'w-[500px]' : 'w-16'} flex flex-col justify-center bg-da-gray-dark px-1 py-2 text-da-gray-light`}
    >
      <div className="px-1 flex">
        <DaRuntimeConnector
          targetPrefix="runtime-"
          kitServerUrl={DEFAULT_KIT_SERVER}
          ref={runTimeRef1}
          usedAPIs={usedApis}
          onActiveRtChanged={(rtId: string | undefined) => setActiveRtId(rtId)}
          onLoadedMockSignals={setMockSignals}
          onNewLog={appendLog}
          onAppExit={() => {
            setWizardSimulating(false)
          }}
          preferRuntime="RunTime-test-only-34"
        />
      </div>

      <div className={`flex px-1 ${!isExpand && 'flex-col'}`}>
        {activeRtId && (
          <>
            <button
              disabled={wizardSimulating}
              onClick={handleRun}
              className="da-label-regular-bold mt-1 flex items-center justify-center rounded border border-da-gray-medium p-2 hover:bg-da-gray-medium disabled:text-da-gray-medium"
            >
              <IoPlay />
            </button>
            <button
              disabled={!wizardSimulating}
              onClick={handleStop}
              className={`${isExpand && 'mx-2'} da-label-regular-bold mt-1 flex items-center justify-center rounded border border-da-gray-medium p-2 hover:bg-da-gray-medium disabled:text-da-gray-medium`}
            >
              <IoStop />
            </button>
          </>
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
