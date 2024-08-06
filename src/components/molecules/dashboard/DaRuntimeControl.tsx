import { DaButton } from '@/components/atoms/DaButton'
import { FC, useEffect, useRef, useState } from 'react'
import { FaAnglesLeft, FaAnglesRight } from 'react-icons/fa6'
import DaRuntimeConnector from '../DaRuntimeConnector'
import { shallow } from 'zustand/shallow'
import useModelStore from '@/stores/modelStore'
import { Prototype } from '@/types/model.type'
import { IoPlay, IoStop } from 'react-icons/io5'
import CodeEditor from '../CodeEditor'
import usePermissionHook from '@/hooks/usePermissionHook'
import { PERMISSIONS } from '@/data/permission'
import useCurrentModel from '@/hooks/useCurrentModel'
import DaApisWatch from './DaApisWatch'
import { addLog } from '@/services/log.service'
import useSelfProfileQuery from '@/hooks/useSelfProfile'

const AlwaysScrollToBottom = () => {
  const elementRef = useRef<any>(null)
  useEffect(() => {
    if (elementRef && elementRef.current) {
      elementRef.current.scrollIntoView()
    }
  })

  return <div ref={elementRef} />
}

const DaRuntimeControl: FC = ({}) => {
  const { data: currentUser } = useSelfProfileQuery()

  const [prototype, setActivePrototype, activeModelApis] = useModelStore(
    (state) => [
      state.prototype as Prototype,
      state.setActivePrototype,
      state.activeModelApis,
    ],
    shallow,
  )
  const [isExpand, setIsExpand] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [activeRtId, setActiveRtId] = useState<string | undefined>('')
  const [log, setLog] = useState<string>('')
  const runTimeRef = useRef<any>()

  const [activeTab, setActiveTab] = useState<string>('output')
  const { data: model } = useCurrentModel()
  const [isAuthorized] = usePermissionHook([PERMISSIONS.READ_MODEL, model?.id])
  const [savedCode, setSavedCode] = useState<string | undefined>(undefined)

  const [usedApis, setUsedApis] = useState<any[]>([])
  const [code, setCode] = useState<string>('')

  useEffect(() => {
    if (prototype) {
      setCode(prototype.code || '')
    } else {
      setCode('')
    }
  }, [prototype?.code])

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
    // console.log('usedApis', apis)
    setUsedApis(apis)
  }, [code, activeModelApis])

  const appendLog = (content: String) => {
    if (!content) return
    setLog((log) => log + content)
  }

  const saveCodeToDb = () => {
    if (code === savedCode) return
    console.log(`save code to DB`)
    console.log(code)
    let newPrototype = JSON.parse(JSON.stringify(prototype))
    newPrototype.code = code || ''
    setActivePrototype(newPrototype)
  }

  // useEffect(() => {
  //   // console.log(`DaRuntimeControl: activeRtId`, activeRtId)
  // }, [activeRtId])

  return (
    <div
      className={`absolute z-10 top-0 bottom-0 right-0 ${isExpand ? 'w-[460px]' : 'w-16'} text-da-gray-light py-2 px-1 flex flex-col justify-center bg-da-gray-dark`}
    >
      <div className="px-1">
        <DaRuntimeConnector
          ref={runTimeRef}
          usedAPIs={usedApis}
          onActiveRtChanged={(rtId: string | undefined) => setActiveRtId(rtId)}
          onNewLog={appendLog}
          onAppExit={() => {
            // console.log(`onAppExit`)
            setIsRunning(false)
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
                const userId = currentUser?.id || 'Anonymous'
                addLog({
                  name: `User ${userId} run prototype`,
                  description: `User ${userId} run prototype ${prototype?.name || 'Unknown'} with id  ${prototype?.id || 'Unknown'}`,
                  type: 'run-prototype',
                  create_by: userId,
                })
              }}
              className="p-2 mt-1 da-label-regular-bold hover:bg-da-gray-medium 
                          flex items-center justify-center rounded border border-da-gray-medium
                          disabled:text-da-gray-medium"
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
              }}
              className={`${isExpand && 'mx-2'} p-2 mt-1 da-label-regular-bold hover:bg-da-gray-medium 
                        flex items-center justify-center rounded border border-da-gray-medium
                        disabled:text-da-gray-medium`}
            >
              <IoStop />
            </button>
          </>
        )}
      </div>

      <div className="grow mt-1 overflow-y-auto">
        {isExpand && (
          <>
            {activeTab == 'output' && (
              <p
                className="bg-da-black text-da-white da-label-tiny
                                                whitespace-pre-wrap h-full overflow-y-auto px-2 py-1 rounded"
              >
                {log}
                <AlwaysScrollToBottom />
              </p>
            )}

            {activeTab == 'apis' && <DaApisWatch />}

            {activeTab == 'code' && (
              <CodeEditor
                code={code || ''}
                setCode={setCode}
                editable={isAuthorized}
                language="python"
                onBlur={() => {}}
                // onBlur={saveCodeToDb}
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
              className={`flex items-center px-4 py-0.5 da-label-small text-da-white cursor-pointer hover:bg-da-gray-medium
              ${activeTab == 'output' && 'border-b-2 border-da-white'}`}
              onClick={() => {
                setActiveTab('output')
              }}
            >
              Output
            </div>
            <div
              className={`flex items-center px-4 py-0.5 da-label-small text-da-white cursor-pointer hover:bg-da-gray-medium
              ${activeTab == 'apis' && 'border-b-2 border-da-white'}`}
              onClick={() => {
                setActiveTab('apis')
              }}
            >
              Signals Watch
            </div>
            <div
              className={`flex items-center px-4 py-0.5 da-label-small text-da-white cursor-pointer hover:bg-da-gray-medium
              ${activeTab == 'code' && 'border-b-2 border-da-white'}`}
              onClick={() => {
                setActiveTab('code')
              }}
            >
              Code
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default DaRuntimeControl
