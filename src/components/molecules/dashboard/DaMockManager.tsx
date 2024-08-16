import { FC, useEffect, useState } from 'react'
import useRuntimeStore from '@/stores/runtimeStore'
import { shallow } from 'zustand/shallow'
import { DaButton } from '@/components/atoms/DaButton'
import { DaInput } from '@/components/atoms/DaInput'
import { MdDeleteOutline } from "react-icons/md";

interface iDaMockManager {
    mockSignals: any[]
    sendMockSignalsToRt?: (signals: any[]) => void
    loadMockSignalsFromRt?: () => void
}

const DaMockManager: FC<iDaMockManager> = ({mockSignals, sendMockSignalsToRt, loadMockSignalsFromRt}) => {

    const [signals, setSignals] = useState<any[]>([])
    const [editSignal, setEditSignal] = useState<any>(null)

    useEffect(() => {
        setSignals(mockSignals || [])
    }, [mockSignals])

    return <div className="w-full mt-2">

        <div className='flex items-center mb-4 px-2'>
            <div className='mr-4 da-label-regular'>Mock Signal</div>
            <DaButton size="sm" variant="text" onClick={() => {
                setEditSignal({signal: 'Signal name', value: '0'})
            }}><div className="text-da-secondary-300">Add Signal</div></DaButton>
            <div className='grow'></div>
            <DaButton size="sm" variant="solid" onClick={() => {
                if(!sendMockSignalsToRt) return
                sendMockSignalsToRt(signals)
            }}>Send to Runtime</DaButton>
            <DaButton className='ml-2' size="sm" variant="solid" onClick={() => {
                if(!loadMockSignalsFromRt) return
                loadMockSignalsFromRt()
            }}>Load from Runtime</DaButton>
        </div>

        { editSignal && <div className='flex mb-2'>
            <DaInput
                value={editSignal.signal}
                onChange={(e) => 
                    {
                        let s = {signal: e.target.value, value: editSignal.value}
                        setEditSignal(s)
                    }
                }
                className="grow"
                inputClassName="text-sm text-da-gray-dark"
            />
             <DaInput
                value={editSignal.value}
                onChange={(e) =>  {
                    let s = {signal: editSignal.signal, value: e.target.value}
                    setEditSignal(s)
                }}
                className="flex w-20 ml-2"
                inputClassName="text-sm text-da-gray-dark text-right"
            />
            <DaButton className='ml-2' disabled={!editSignal.signal || !editSignal.value}
                onClick={() => {
                    let tmpSignals = JSON.parse(JSON.stringify(signals))
                    tmpSignals.push(JSON.parse(JSON.stringify(editSignal)))
                    setSignals(tmpSignals)
                    setEditSignal(null)
                }}>Add</DaButton>
            <DaButton className='ml-2'
                onClick={() => {
                    setEditSignal(null)
                }}>Cancel</DaButton>
        </div>
        }

         <div className={`px-1 flex items-center border-da-gray-medium 
            text-da-white da-label-tiny mb-1 border-b`}>
            <div className='grow px-1'>Signal</div>
            <div className='w-20 px-1 py-0.5 text-right'>Init value</div>
            <div className='w-10 px-1 py-0.5 text-right'></div>
        </div>
        { signals && signals.map((signal, sIndex) => <div key={sIndex} className={`px-1 flex items-center border-da-gray-medium 
            text-da-white da-label-tiny mb-1`}>
            <div className='grow px-1'>{signal.signal}</div>
            <div className='w-20 px-1 py-0.5 text-right border border-da-gray-medium rounded'>{signal.value || ''}</div>
            <MdDeleteOutline onClick={() => {
                let tmpSignals = JSON.parse(JSON.stringify(signals))
                tmpSignals.splice(sIndex, 1);
                setSignals(tmpSignals)
            }} size={18} className='ml-2 text-da-white cursor-pointer'/>
        </div>)
        }
    </div>
}

export default DaMockManager