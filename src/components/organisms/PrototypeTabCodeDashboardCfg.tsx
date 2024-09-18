import { FC, useState, useEffect } from 'react'
import { shallow } from 'zustand/shallow'
import useModelStore from '@/stores/modelStore'
import { Prototype } from '@/types/model.type'
import DaDashboardEditor from '../molecules/dashboard/DaDashboardEditor'
import CodeEditor from '../molecules/CodeEditor'
import { DaButton } from '../atoms/DaButton'
import { TbChevronDown, TbChevronRight } from 'react-icons/tb'
import { BsStars } from 'react-icons/bs'
import DaPopup from '../atoms/DaPopup'
import DaGenAI_Dashboard from '../molecules/genAI/DaGenAI_Dashboard'
import { DaText } from '../atoms/DaText'
import usePermissionHook from '@/hooks/usePermissionHook'
import useCurrentModel from '@/hooks/useCurrentModel'
import { PERMISSIONS } from '@/data/permission'
import { updatePrototypeService } from '@/services/prototype.service'
import useCurrentPrototype from '@/hooks/useCurrentPrototype'
import useSelfProfileQuery from '@/hooks/useSelfProfile'

const PrototypeTabCodeDashboardCfg: FC = ({}) => {
  const [prototype, setActivePrototype] = useModelStore(
    (state) => [state.prototype as Prototype, state.setActivePrototype],
    shallow,
  )
  const { refetch } = useCurrentPrototype()
  const [dashboardCfg, setDashboardCfg] = useState<string>('')
  const [isEditing, setIsEditing] = useState<boolean>(true)
  const [isExpanded, setIsExpanded] = useState(false)
  const [ticker, setTicker] = useState(0)
  const [isOpenGenAI, setIsOpenGenAI] = useState(false)
  const { data: model } = useCurrentModel()
  const [isAuthorized] = usePermissionHook([PERMISSIONS.READ_MODEL, model?.id])

  const { data: currentUser } = useSelfProfileQuery()

  useEffect(() => {
    let timer = setInterval(() => {
      setTicker((oldTicker) => oldTicker + 1)
    }, 3000)
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [ticker])

  useEffect(() => {
    setDashboardCfg(prototype?.widget_config || '')
  }, [prototype?.widget_config])

  useEffect(() => {
    if (dashboardCfg == prototype.widget_config) return
    saveDashboardCfgToDb(dashboardCfg || '')
  }, [ticker])

  const saveDashboardCfgToDb = async (dashboardConfig: string) => {
    if (!dashboardConfig) {
      return
    }

    let updateConfig = dashboardConfig

    try {
      let configObj = JSON.parse(updateConfig)
      if (Array.isArray(configObj)) {
        let revisedObj = {
          autorun: false,
          widgets: configObj,
        }
        updateConfig = JSON.stringify(revisedObj, null, 4)
      }
    } catch (parseErr) {
      console.error('JSON parsing error:', parseErr, 'Input:', updateConfig)
      return
    }

    //

    if (updateConfig === prototype.widget_config || updateConfig === '') {
      return
    }

    setDashboardCfg(updateConfig)
    let newPrototype = { ...prototype, widget_config: updateConfig }
    setActivePrototype(newPrototype)

    if (prototype && prototype.id) {
      try {
        await updatePrototypeService(prototype.id, {
          widget_config: updateConfig,
        })

        // await refetch()
        //
      } catch (error) {
        console.error('Error updating prototype service:', error)
      }
    }
  }

  return (
    <>
      <DaDashboardEditor
        entireWidgetConfig={prototype.widget_config}
        editable={isAuthorized}
        onDashboardConfigChanged={saveDashboardCfgToDb}
      />

      {/* <div className="flex flex-col w-full items-center px-2 py-1 text-xs text-da-gray-medium rounded">
        {isAuthorized && (
          <div className="flex w-full">
            <DaButton
              variant="outline-nocolor"
              size="sm"
              className="flex bg-white pl-3 mr-2"
              onClick={() => setIsExpanded((old) => !old)}
            >
              <div>Show all raw config text</div>
              {isExpanded ? (
                <TbChevronDown className="ml-1" />
              ) : (
                <TbChevronRight className="ml-1" />
              )}
            </DaButton>

            <DaPopup
              state={[isOpenGenAI, setIsOpenGenAI]}
              trigger={
                <DaButton variant="outline-nocolor" size="sm">
                  <BsStars className="w-4 h-auto text-da-primary-500 mr-1" />
                  Dashboard ProtoPilot
                </DaButton>
              }
            >
              <div className="flex flex-col w-[1000px] h-[500px]">
                <DaText variant="title" className="text-da-primary-500">
                  {' '}
                  Dashboard ProtoPilot{' '}
                </DaText>

                <DaGenAI_Dashboard
                  onCodeChanged={(code) => {
                    setDashboardCfg(code)
                    setIsOpenGenAI(false)
                  }}
                  pythonCode={prototype.code}
                />
              </div>
            </DaPopup>
          </div>
        )}
        <div
          className={`flex w-full h-[300px] ${isExpanded ? 'visible' : 'invisible'}`}
        >
          <CodeEditor
            code={dashboardCfg}
            setCode={setDashboardCfg}
            editable={isEditing && isAuthorized}
            language="json"
            onBlur={() => {
              setTicker((oldTicker) => oldTicker + 1)
            }}
          />
        </div>
      </div> */}

    </>
  )
}

export default PrototypeTabCodeDashboardCfg
