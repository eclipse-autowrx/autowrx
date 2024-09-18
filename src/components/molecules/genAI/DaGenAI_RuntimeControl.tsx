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
import useRuntimeStore from '@/stores/runtimeStore'
import config from '@/configs/config'
import DaGenAI_RuntimeConnector from './DaGenAI_RuntimeConnector'

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
  const runTimeRef1 = useRef<any>()

  const [activeTab, setActiveTab] = useState<string>('output')
  const { data: model } = useCurrentModel()
  const [isAuthorized] = usePermissionHook([PERMISSIONS.READ_MODEL, model?.id])

  const [usedApis, setUsedApis] = useState<any[]>([])

  const [mockSignals, setMockSignals] = useState<any[]>([])

  const { apisValue } = useRuntimeStore()

  const {
    wizardPrototype: prototypeData,
    setPrototypeData,
    activeModelApis,
    registerWizardSimulationRun,
    registerWizardSimulationStop,
    wizardSimulating,
    setWizardSimulating,
  } = useWizardGenAIStore()

  const writeSignalValue = (obj: any) => {
    if (!obj) return
    if (runTimeRef1.current) {
      runTimeRef1.current?.writeSignalsValue(obj)
    }
  }

  const handleMessageListenter = (e: any) => {
    // console.log('window on message', e)
    if (!e.data) return
    // console.log(`onMessage`, e.data)
    try {
      let payload = JSON.parse(e.data)
      if (payload.cmd == 'set-api-value' && payload.api) {
        let obj = {} as any
        obj[`${payload.api}`] = payload.value
        writeSignalValue(obj)
      }
    } catch (err) {
      console.log(err)
    }
  }

  useEffect(() => {
    window.addEventListener('message', handleMessageListenter)
    return () => {
      window.removeEventListener('message', handleMessageListenter)
    }
  }, [])

  useEffect(() => {
    if (
      !prototypeData.code ||
      !activeModelApis ||
      activeModelApis.length === 0
    ) {
      setUsedApis([])
      return
    }
    let apis: any[] = []
    let code = prototypeData.code || ''
    activeModelApis.forEach((item: any) => {
      if (code.includes(item.shortName)) {
        apis.push(item.name)
      }
    })
    setUsedApis(apis)
  }, [prototypeData.code, activeModelApis])

  const appendLog = (content: String) => {
    if (!content) return
    setLog((log) => log + content)
  }

  const handleRun = () => {
    setWizardSimulating(true)
    setLog('')
    if (runTimeRef1.current) {
      runTimeRef1.current?.runApp(prototypeData.code)
    }
  }

  const handleStop = () => {
    setWizardSimulating(false)
    clearApisValue(apisValue)
    if (runTimeRef1.current) {
      runTimeRef1.current?.stopApp()
    }
  }

  useEffect(() => {
    registerWizardSimulationRun(handleRun)
    registerWizardSimulationStop(handleStop)
  }, [prototypeData])

  useEffect(() => {
    // Restart the simulation when the code changes
    handleStop()
  }, [prototypeData.code])

  const clearApisValue = (apisValue: any) => {
    // Iterate over the keys in apisValue, set the new values, and write them at the same time
    Object.keys(apisValue).forEach((key) => {
      let newValue
      if (typeof apisValue[key] === 'number') {
        newValue = 0 // Set number values to 0
      } else if (typeof apisValue[key] === 'boolean') {
        newValue = false // Set boolean values to false
      } else {
        newValue = apisValue[key] // Keep other types as is (or modify as needed)
      }

      const obj = { [key]: newValue } // Construct a key-value pair
      writeSignalValue(obj)
    })
  }

  return (
    <div
      className={`hidden absolute bottom-0 right-0 top-0 z-10 ${isExpand ? 'w-[500px]' : 'w-16'} flex flex-col justify-center bg-da-gray-dark px-1 py-2 text-da-gray-light`}
    >
      <div className="px-1 flex">
        <DaGenAI_RuntimeConnector
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
          preferRuntime={
            config.genAI.wizardPreferRuntime ?? 'RunTime-VSS4-02-20'
          }
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
                  writeSignalValue(obj)
                }}
              />
            )}

            {activeTab == '' && (
              <CodeEditor
                code={prototypeData.code || ''}
                setCode={(code: string) => {
                  setPrototypeData({ code })
                }}
                editable={isAuthorized}
                language="python"
                onBlur={() => {}}
              />
            )}

            {activeTab == 'mock' && (
              <DaMockManager
                mockSignals={mockSignals}
                loadMockSignalsFromRt={() => {
                  if (runTimeRef1.current) {
                    runTimeRef1.current?.loadMockSignals()
                  }
                }}
                sendMockSignalsToRt={(signals: any[]) => {
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
