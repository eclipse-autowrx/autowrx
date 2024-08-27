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
    <div className="flex h-[calc(100%-50px)] w-full flex-col">
      <div className="flex min-h-10 w-full items-center justify-between border-b px-1">
        {isAuthorized && (
          <div className="flex space-x-2">
            <div className="flex space-x-2">
              <DaPopup
                state={[isOpenGenAI, setIsOpenGenAI]}
                trigger={
                  <DaButton size="sm" variant="outline-nocolor">
                    <BsStars className="mr-1 text-da-primary-500" />
                    SDV ProtoPilot
                  </DaButton>
                }
              >
                <div className="flex h-[500px] w-[1000px] flex-col">
                  <DaText variant="title" className="text-da-primary-500">
                    {' '}
                    SDV ProtoPilot{' '}
                  </DaText>
                  <div className="rounded-lgtext-sm flex h-full w-full flex-col bg-white">
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
          </div>
        )}

        <div className="flex h-full w-fit justify-end">
          <DaTabItem
            small
            active={activeTab == 'api'}
            onClick={() => setActiveTab('api')}
          >
            Signals
          </DaTabItem>
        </div>
      </div>

      <div className="flex h-full w-full justify-between">
        <div className="flex h-full w-1/2 flex-col border-r">
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
        <div className="flex h-full w-1/2 flex-col">
          {activeTab == 'api' && (
            <Suspense>
              <PrototypeTabCodeApiPanel code={code || ''} />
            </Suspense>
          )}
          {/* {activeTab == 'dashboard' && (
            <Suspense>
              <PrototypeTabCodeDashboardCfg />
            </Suspense>
          )} */}
        </div>
      </div>
    </div>
  )
}

export default PrototypeTabCode
