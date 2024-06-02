import { FC, useEffect, useState } from 'react'
import CodeEditor from '../molecules/CodeEditor'
import { DaButton } from '../atoms/DaButton'
import useModelStore from '@/stores/modelStore'
import { Prototype } from '@/types/model.type'
import { TbRocket, TbDotsVertical, TbArrowUpRight } from 'react-icons/tb'
import DaTabItem from '../atoms/DaTabItem'
import config from '@/configs/config'
import { shallow } from "zustand/shallow";
import PrototypeTabCodeApiPanel from './PrototypeTabCodeApiPanel'
import PrototypeTabCodeDashboardCfg from './PrototypeTabCodeDashboardCfg'

const PrototypeTabCode: FC = ({ }) => {
    const [prototype, setActivePrototype, activeModelApis] = useModelStore((state) => [
        state.prototype as Prototype, 
        state.setActivePrototype, 
        state.activeModelApis
    ], shallow)
    const [savedCode, setSavedCode] = useState<string | undefined>(undefined)
    const [code, setCode] = useState<string | undefined>(undefined)
    const [ticker, setTicker] = useState(0)
    const [activeTab, setActiveTab] = useState('api')
    

    useEffect(() => {
        let timer = setInterval(() => {
            setTicker((oldTicker) => oldTicker + 1)
        }, 3000)
        return () => {
            if (timer) clearInterval(timer)
        }
    }, [])
    useEffect(() => {
        saveCodeToDb()
    }, [ticker])

    useEffect(() => {
        if (!prototype) {
            setSavedCode(undefined)
            setCode(undefined)
            return
        }
        setCode(prototype.code || '')
        setSavedCode(prototype.code || '')
    }, [prototype])

    

    const saveCodeToDb = () => {
        if (code === savedCode) return
        console.log(`save code to DB`)
        console.log(code)
        let newPrototype = JSON.parse(JSON.stringify(prototype))
        newPrototype.code = code || ''
        setActivePrototype(newPrototype)
    }



    if (!prototype) {
        return <div></div>
    }

    return <div className="w-full h-full flex">
        <div className='w-1/2 flex flex-col'>
            <div className='mb-1 py-1 px-2 flex border-b-2 border-da-gray-light'>
                <DaButton size="sm" variant='outline'>
                    <TbDotsVertical className='mr-1' size={20} />
                    Action
                </DaButton>
                <div className='grow'></div>
                <DaButton size="sm">
                    <TbRocket className='mr-1' size={20} />
                    Deploy
                </DaButton>
            </div>
            <CodeEditor
                code={code || ''}
                setCode={setCode}
                editable={true}
                language="python"
                onBlur={saveCodeToDb}
            />
        </div>
        <div className='w-1/2 flex flex-col'>
            <div className='mb-1 pt-1 px-2 flex-none flex border-b border-da-gray-light'>
                <div className='grow'></div>
                <DaTabItem small active={activeTab == 'api'}
                    onClick={() => setActiveTab('api')}>
                    API
                </DaTabItem>
                <DaTabItem small active={activeTab == 'dashboard'}
                    onClick={() => setActiveTab('dashboard')}>
                    Dashboard Config
                </DaTabItem>
                {
                    config?.studioUrl && <DaTabItem to={config?.studioUrl}>
                        Widget Studio
                        <TbArrowUpRight className="w-5 h-5" />
                    </DaTabItem>
                }
                {
                    config?.widgetMarketPlaceUrl && <DaTabItem to={config?.widgetMarketPlaceUrl}>
                        Widget Marketplace
                        <TbArrowUpRight className="w-5 h-5" />
                    </DaTabItem>
                }

            </div>
            <div className='flex-1 flex flex-col w-full overflow-hidden'>
                {activeTab == 'api' && <>
                    <PrototypeTabCodeApiPanel code={code || ''}/>
                </>}
                {activeTab == 'dashboard' && <PrototypeTabCodeDashboardCfg/>}
            </div>
        </div>
    </div>
}

export default PrototypeTabCode