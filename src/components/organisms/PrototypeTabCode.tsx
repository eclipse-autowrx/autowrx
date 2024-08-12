import { FC, useEffect, useState, lazy, Suspense } from 'react'
import { DaButton } from '../atoms/DaButton'
import useModelStore from '@/stores/modelStore'
import { Prototype } from '@/types/model.type'
import { TbRocket, TbDotsVertical, TbArrowUpRight } from 'react-icons/tb'
import DaTabItem from '../atoms/DaTabItem'
import config from '@/configs/config'
import { shallow } from 'zustand/shallow'
import { BsStars } from 'react-icons/bs'
import DaPopup from '../atoms/DaPopup'
import { DaText } from '../atoms/DaText'
import usePermissionHook from '@/hooks/usePermissionHook'
import useCurrentModel from '@/hooks/useCurrentModel'
import { PERMISSIONS } from '@/data/permission'
import { updatePrototypeService } from '@/services/prototype.service'

const CodeEditor = lazy(() => import('../molecules/CodeEditor'))
const PrototypeTabCodeDashboardCfg = lazy(
  () => import('./PrototypeTabCodeDashboardCfg'),
)
const PrototypeTabCodeApiPanel = lazy(
  () => import('./PrototypeTabCodeApiPanel'),
)
const DaGenAI_Python = lazy(() => import('../molecules/genAI/DaGenAI_Python'))

const PrototypeTabCode: FC = ({}) => {
  const [prototype, setActivePrototype, activeModelApis] = useModelStore(
    (state) => [
      state.prototype as Prototype,
      state.setActivePrototype,
      state.activeModelApis,
    ],
    shallow,
  )
  const [savedCode, setSavedCode] = useState<string | undefined>(undefined)
  const [code, setCode] = useState<string | undefined>(undefined)
  const [ticker, setTicker] = useState(0)
  const [activeTab, setActiveTab] = useState('api')
  const [isOpenGenAI, setIsOpenGenAI] = useState(false)
  const { data: model } = useCurrentModel()
  const [isAuthorized] = usePermissionHook([PERMISSIONS.READ_MODEL, model?.id])

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

  const saveCodeToDb = async () => {
    if (code === savedCode) return

    let newPrototype = JSON.parse(JSON.stringify(prototype))
    newPrototype.code = code || ''
    setActivePrototype(newPrototype)

    if (!prototype || !prototype.id) return
    try {
      await updatePrototypeService(prototype.id, {
        code: code || '',
      })

      // await refetchPrototype()
    } catch (err) {}
  }

  if (!prototype) {
    return <div></div>
  }

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex w-full px-2 py-1.5">
        {isAuthorized && (
          <div className="flex w-1/2 space-x-2">
            <div className="flex space-x-2">
              <DaButton size="sm" variant="outline-nocolor" className="mr-2">
                <TbDotsVertical className="mr-1 text-da-primary-500" />
                Action
              </DaButton>
              <DaPopup
                state={[isOpenGenAI, setIsOpenGenAI]}
                trigger={
                  <DaButton size="sm" variant="outline-nocolor">
                    <BsStars className="mr-1 text-da-primary-500" />
                    SDV ProtoPilot
                  </DaButton>
                }
              >
                <div className="flex flex-col w-[1000px] h-[500px]">
                  <DaText variant="title" className="text-da-primary-500">
                    {' '}
                    SDV ProtoPilot{' '}
                  </DaText>
                  <div className="flex flex-col w-full h-full bg-white rounded-lgtext-sm">
                    <Suspense>
                      <DaGenAI_Python
                        onCodeChanged={(code) => {
                          setCode(code)
                          setIsOpenGenAI(false)
                        }}
                      />
                    </Suspense>
                  </div>
                </div>
              </DaPopup>
            </div>

            {/* <div className="grow"></div> */}
            <DaButton size="sm" variant="outline-nocolor">
              <TbRocket className="w-4 h-4 mr-1 text-da-primary-500" />
              Deploy
            </DaButton>
          </div>
        )}
        <div className="grow"></div>
        <div className="flex w-1/2 justify-end">
          <div className="grow"></div>
          <DaTabItem
            small
            active={activeTab == 'api'}
            onClick={() => setActiveTab('api')}
          >
            Signal
          </DaTabItem>
          <DaTabItem
            small
            active={activeTab == 'dashboard'}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard Config
          </DaTabItem>
          {config?.studioUrl && (
            <DaTabItem to={config?.studioUrl}>
              Widget Studio
              <TbArrowUpRight className="w-5 h-5" />
            </DaTabItem>
          )}
          {config?.widgetMarketPlaceUrl && (
            <DaTabItem to={config?.widgetMarketPlaceUrl}>
              Widget Marketplace
              <TbArrowUpRight className="w-5 h-5" />
            </DaTabItem>
          )}
        </div>
      </div>
      <div className="flex w-full h-full">
        <div className="w-1/2 flex flex-col border-r">
          <Suspense>
            <CodeEditor
              code={code || ''}
              setCode={setCode}
              editable={isAuthorized}
              language="python"
              onBlur={saveCodeToDb}
            />
          </Suspense>
        </div>
        <div className="w-1/2 flex flex-col">
          <div className="flex-1 flex flex-col w-full overflow-hidden">
            {activeTab == 'api' && (
              <Suspense>
                <PrototypeTabCodeApiPanel code={code || ''} />
              </Suspense>
            )}
            {activeTab == 'dashboard' && (
              <Suspense>
                <PrototypeTabCodeDashboardCfg />
              </Suspense>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrototypeTabCode
