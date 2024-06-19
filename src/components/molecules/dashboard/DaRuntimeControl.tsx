import { DaButton } from '@/components/atoms/DaButton'
import { FC, useEffect, useRef, useState } from 'react'
import { FaAnglesLeft, FaAnglesRight } from "react-icons/fa6";
import DaRuntimeConnector from '../DaRuntimeConnector';
import { shallow } from 'zustand/shallow'
import useModelStore from '@/stores/modelStore'
import { Prototype } from '@/types/model.type';
import { IoPlay, IoStop } from "react-icons/io5";

const AlwaysScrollToBottom = () => {
  const elementRef = useRef<any>(null);
  useEffect(() => { if(elementRef && elementRef.current) { 
      elementRef.current.scrollIntoView()
  }});
  
  return <div ref={elementRef} />;
};

const DaRuntimeControl: FC = ({ }) => {
  const [prototype] = useModelStore(
    (state) => [
      state.prototype as Prototype,
    ],
    shallow,
  )
  const [isExpand, setIsExpand] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [activeRtId, setActiveRtId] = useState<string | undefined>("")
  const [log, setLog] = useState<string>('')
  const runTimeRef = useRef<any>()

  const appendLog = (content:String) => {
    if(!content) return
    setLog((log) => log + content )
  }

  useEffect(() => {
    // console.log(`DaRuntimeControl: activeRtId`, activeRtId)
  }, [activeRtId])

  return (
    <div className={`absolute z-10 top-0 bottom-0 right-0 ${isExpand ? 'w-[400px]' : 'w-16'} text-da-gray-light py-2 px-1 flex flex-col justify-center bg-da-gray-dark`}>
      <div className='px-1'>
        <DaRuntimeConnector ref={runTimeRef} 
          usedAPIs={[]} 
          onActiveRtChanged={(rtId: string | undefined) => setActiveRtId(rtId)} 
          onNewLog={appendLog}
          onAppExit={() => { 
            console.log(`onAppExit`)
            setIsRunning(false)
          }}
          />
      </div>

      <div className={`flex px-1 ${!isExpand && 'flex-col'}`}>
        {activeRtId && <>
          <button disabled={isRunning} onClick={() => {
            setIsRunning(true)
            setLog('')
            if(runTimeRef.current) {
              runTimeRef.current?.runApp(prototype.code || '')
            }
          }}
            className="p-2 mt-1 da-label-regular-bold hover:bg-da-gray-medium 
                          flex items-center justify-center rounded border border-da-gray-medium
                          disabled:text-da-gray-medium">
            <IoPlay/>
          </button>
          <button disabled={!isRunning} onClick={() => {
            setIsRunning(false)
            // appendLog('Stop app')
            if(runTimeRef.current) {
              runTimeRef.current?.stopApp()
            }
          }}
            className={`${isExpand && 'mx-2'} p-2 mt-1 da-label-regular-bold hover:bg-da-gray-medium 
                        flex items-center justify-center rounded border border-da-gray-medium
                        disabled:text-da-gray-medium`}>
            <IoStop/>
          </button>
        </>
        }
      </div>

      <div className="grow mt-1 overflow-y-auto">
        { isExpand && <p
                    className='bg-da-black text-da-white da-label-tiny
                                            whitespace-pre-wrap h-full overflow-y-auto px-2 py-1 rounded'
                  >
                    {log}
                    <AlwaysScrollToBottom/>
                  </p>
        }
      </div>
      <div>
        <DaButton variant='plain' onClick={() => {
          setIsExpand((v) => !v)
        }}>
          {isExpand ? <FaAnglesRight className='text-da-white' /> : <FaAnglesLeft className='text-da-white' />}
        </DaButton>
      </div>
    </div>
  )
}

export default DaRuntimeControl
