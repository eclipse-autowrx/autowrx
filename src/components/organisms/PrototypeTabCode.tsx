import { FC, useEffect, useState, lazy, Suspense } from 'react'
import { DaButton } from '../atoms/DaButton'
import useModelStore from '@/stores/modelStore'
import { Prototype } from '@/types/model.type'
import { shallow } from 'zustand/shallow'
import { BsStars } from 'react-icons/bs'
import DaPopup from '../atoms/DaPopup'
import { DaText } from '../atoms/DaText'
import usePermissionHook from '@/hooks/usePermissionHook'
import useCurrentModel from '@/hooks/useCurrentModel'
import { PERMISSIONS } from '@/data/permission'
import { updatePrototypeService } from '@/services/prototype.service'
import { TbBrandGithub } from 'react-icons/tb'
import DaVelocitasProjectCreator from '../molecules/velocitas_project/DaVelocitasProjectCreator'
import { retry } from '@/lib/retry'

const CodeEditor = lazy(() => retry(() => import('../molecules/CodeEditor')))

const PrototypeTabCodeApiPanel = lazy(() =>
  retry(() => import('./PrototypeTabCodeApiPanel')),
)
const DaGenAI_Python = lazy(() =>
  retry(() => import('../molecules/genAI/DaGenAI_Python')),
)

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
  const [isOpenVelocitasDialog, setIsOpenVelocitasDialog] = useState(false)

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
    <div className="flex h-[calc(100%-0px)] bg-da-g w-full p-2 gap-2 bg-da-gray-light">
      <div className="flex h-full flex-[3] min-w-0 flex-col border-r bg-da-white rounded-md">
        <div className="flex min-h-12 w-full items-center justify-between">
          {isAuthorized && (
            <div className="flex mx-2 space-x-4">
              <DaPopup
                state={[isOpenGenAI, setIsOpenGenAI]}
                trigger={
                  <DaButton size="sm">
                    <BsStars className="mr-1" />
                    SDV ProtoPilot
                  </DaButton>
                }
                onClose={() => setIsOpenGenAI(false)}
                closeBtnClassName="top-6 right-6"
              >
                <div className="flex flex-col h-[80vh] xl:h-[600px] max-h-[90vh] w-[1200px] max-w-[80vw] ">
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
              <DaPopup
                state={[isOpenVelocitasDialog, setIsOpenVelocitasDialog]}
                trigger={
                  <DaButton size="sm" className="ml-2" variant="plain">
                    <TbBrandGithub className="mr-1 size-4" />
                    Create Velocitas Project
                  </DaButton>
                }
                onClose={() => setIsOpenVelocitasDialog(false)}
                closeBtnClassName="top-6 right-6"
              >
                <DaVelocitasProjectCreator
                  code={prototype?.code || ''}
                  onClose={() => setIsOpenVelocitasDialog(false)}
                  vssPayload={{}}
                />
              </DaPopup>
            </div>
          )}

          <div className="grow"></div>

          <div className="mr-2 da-label-small">
            Language: <b>{(prototype.language || 'python').toUpperCase()}</b>
          </div>

          {/* <div className="flex h-full w-fit justify-end">
              <DaTabItem
                small
                active={activeTab == 'api'}
                onClick={() => setActiveTab('api')}
              >
                Signals
              </DaTabItem>
            </div> */}
        </div>
        <Suspense>
          <CodeEditor
            code={code || ''}
            setCode={setCode}
            editable={isAuthorized}
            language={prototype.language || 'python'}
            onBlur={saveCodeToDb}
          />
        </Suspense>
      </div>
      <div className="flex h-full flex-[2] min-w-[360px] flex-col bg-da-white rounded-md">
        {activeTab == 'api' && (
          <Suspense>
            <PrototypeTabCodeApiPanel code={code || ''} />
          </Suspense>
        )}
      </div>
    </div>
  )
}

export default PrototypeTabCode
