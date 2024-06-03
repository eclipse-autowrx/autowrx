import { FC, useState, useEffect } from 'react'
import { shallow } from 'zustand/shallow'
import useModelStore from '@/stores/modelStore'
import { Prototype } from '@/types/model.type'
import DaDashboardEditor from '../molecules/dashboard/DaDashboardEditor'
import CodeEditor from '../molecules/CodeEditor'
import { DaButton } from '../atoms/DaButton'
import { TbChevronDown, TbChevronRight } from 'react-icons/tb'

const PrototypeTabCodeDashboardCfg: FC = ({}) => {
  const [prototype, setActivePrototype] = useModelStore(
    (state) => [state.prototype as Prototype, state.setActivePrototype],
    shallow,
  )
  const [dashboardCfg, setDashboardCfg] = useState<string>('')
  const [editable, setEditable] = useState<boolean>(true)
  const [useApis, setUseApis] = useState<any[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [ticker, setTicker] = useState(0)

  useEffect(() => {
    let timer = setInterval(() => {
      setTicker((oldTicker) => oldTicker + 1)
    }, 3000)
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    setDashboardCfg(prototype?.widget_config || '')
  }, [prototype?.widget_config])

  useEffect(() => {
    if (dashboardCfg == prototype.widget_config) return
    saveDashboardCfgToDb(dashboardCfg || '')
  }, [ticker])

  const saveDashboardCfgToDb = (config: string) => {
    console.log(`saveDashboardCfgToDb`)
    console.log(config)
    let tmpConfig = config
    try {
      let configObj = JSON.parse(tmpConfig)
      if (Array.isArray(configObj)) {
        let revisedObj = {
          autorun: false,
          widgets: configObj,
        }
        tmpConfig = JSON.stringify(revisedObj, null, 4)
      }
    } catch (parseErr) {
      console.log(parseErr)
    }
    setDashboardCfg(tmpConfig)
    let newPrototype = JSON.parse(JSON.stringify(prototype))
    newPrototype.widget_config = tmpConfig
    setActivePrototype(newPrototype)
  }

  if (!prototype) {
    return <></>
  }

  return (
    <>
      <DaDashboardEditor
        // widgetConfigString={prototype.widget_config}
        entireWidgetConfig={prototype.widget_config}
        editable={editable}
        usedAPIs={useApis}
        onDashboardConfigChanged={(config: string) => {
          console.log(`onDashboardConfigChanged`, config)
          saveDashboardCfgToDb(config)
        }}
      />
      <div className="flex flex-col h-full w-full items-center px-2 py-1 text-xs text-da-gray-medium rounded">
        <div className="flex w-full">
          <DaButton
            variant="plain"
            className="flex bg-white pl-3"
            onClick={() => setIsExpanded((old) => !old)}
          >
            <div>Show all raw config text</div>
            {isExpanded ? (
              <TbChevronDown className="ml-1" />
            ) : (
              <TbChevronRight className="ml-1" />
            )}
          </DaButton>
          {/* <button
                    onClick={() => setIsOpenGenAIDashboard(true)}
                    className={`bg-white ml-2 rounded px-3 py-1 flex items-center justify-center hover:bg-gray-100 border border-gray-200 shadow-sm text-sm text-gray-600 hover:text-gray-800 select-none ${CAN_EDIT ? "" : "opacity-30 pointer-events-none"
                        }`}
                >
                    <BsStars className="w-4 h-auto text-aiot-blue mr-1" />
                    Dashboard ProtoPilot
                </button> */}
        </div>
        {/* <GenAI_ProtoPilot
                type="GenAI_Dashboard"
                onClose={() => setIsOpenGenAIDashboard(false)}
                isOpen={isOpenGenAIDashboard}
                widgetConfig={widgetConfig}
                onDashboardConfigChanged={onDashboardConfigChanged}
                pythonCode={props.code}
            /> */}
        <div
          className={`flex w-full h-full ${isExpanded ? 'visible' : 'invisible'}`}
        >
          <CodeEditor
            code={dashboardCfg}
            setCode={setDashboardCfg}
            editable={editable}
            language="json"
            onBlur={() => {
              saveDashboardCfgToDb(dashboardCfg)
            }}
          />
        </div>
      </div>
    </>
  )
}

export default PrototypeTabCodeDashboardCfg
