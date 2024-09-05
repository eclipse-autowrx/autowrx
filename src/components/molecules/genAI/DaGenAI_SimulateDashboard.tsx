import { FC, useEffect, useState } from 'react'
import DaDashboardGrid from '../dashboard/DaDashboardGrid'
import { MdOutlineDesignServices } from 'react-icons/md'
import { TbDeviceFloppy } from 'react-icons/tb'
import useWizardGenAIStore from '@/stores/genAIWizardStore'
import DaDashboardEditor from '../dashboard/DaDashboardEditor'

const MODE_RUN = 'run'
const MODE_EDIT = 'edit'

const DaGenAI_SimulateDashboard: FC = ({}) => {
  const { prototypeData, setPrototypeData } = useWizardGenAIStore()
  const [widgetItems, setWidgetItems] = useState<any>([])
  const [mode, setMode] = useState<string>(MODE_RUN)

  useEffect(() => {
    let widgetItems = []
    // console.log('prototypeData', prototypeData)
    if (prototypeData?.widget_config) {
      try {
        let dashboard_config = JSON.parse(prototypeData.widget_config)
        if (Array.isArray(dashboard_config)) {
          widgetItems = dashboard_config
        } else {
          if (
            dashboard_config?.widgets &&
            Array.isArray(dashboard_config.widgets)
          ) {
            widgetItems = dashboard_config.widgets
          }
        }
      } catch (err) {
        console.error('Error parsing widget config', err)
      }
    }
    //
    processWidgetItems(widgetItems)
    setWidgetItems(widgetItems)
  }, [prototypeData?.widget_config])

  const processWidgetItems = (widgetItems: any[]) => {
    if (!widgetItems) return
    widgetItems.forEach((widget) => {
      if (!widget?.url) {
        if (widget.options?.url) {
          widget.url = widget.options.url
        }
      }
    })
  }

  const handleDashboardConfigChanged = (config: any) => {
    const widget_config = {
      autorun: false,
      widgets: JSON.parse(config),
    }
    setPrototypeData({ widget_config: JSON.stringify(widget_config) }) // widget_config is currently a JSON string
  }

  return (
    <div className="flex flex-col w-full h-full items-center justify-center">
      <div className="flex w-full items-center justify-start py-1 bg-slate-100 px-2">
        {mode == MODE_RUN && (
          <div
            className="mx-2 font-bold cursor-pointer hover:opacity-50 flex items-center"
            onClick={() => {
              setMode(MODE_EDIT)
            }}
          >
            <MdOutlineDesignServices size={20} className="mr-2" />
            Design Dashboard
          </div>
        )}

        {mode == MODE_EDIT && (
          <div className="flex items-center">
            <div
              className="flex ml-2 mr-4 font-bold cursor-pointer hover:opacity-50 items-center"
              onClick={() => {
                setMode(MODE_RUN)
              }}
            >
              <TbDeviceFloppy className="size-5 mr-2" />
              Save
            </div>

            {/* <>
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
            </> */}
          </div>
        )}
      </div>

      <div className="flex w-full h-full border">
        {mode == MODE_RUN && (
          <DaDashboardGrid widgetItems={widgetItems}></DaDashboardGrid>
        )}
        {mode == MODE_EDIT && (
          <div className="flex w-full h-fit">
            <DaDashboardEditor
              entireWidgetConfig={prototypeData.widget_config}
              editable={true}
              onDashboardConfigChanged={handleDashboardConfigChanged}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default DaGenAI_SimulateDashboard
