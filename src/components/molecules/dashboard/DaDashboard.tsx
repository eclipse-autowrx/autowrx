import { FC, useEffect, useState } from 'react'
import DaDashboardGrid from './DaDashboardGrid'
import useModelStore from '@/stores/modelStore'
import { Prototype } from '@/types/model.type'
import PrototypeTabCodeDashboardCfg from '@/components/organisms/PrototypeTabCodeDashboardCfg'
import usePermissionHook from '@/hooks/usePermissionHook'
import { PERMISSIONS } from '@/data/permission'
import useCurrentModel from '@/hooks/useCurrentModel'
import { MdOutlineDesignServices } from "react-icons/md";
import { IoSaveOutline } from "react-icons/io5";
import config from '@/configs/config'
import DaTabItem from '@/components/atoms/DaTabItem'
import { TbRocket, TbDotsVertical, TbArrowUpRight } from 'react-icons/tb'

const MODE_RUN = 'run'
const MODE_EDIT = 'edit'

const DaDashboard: FC = ({}) => {
  const { data: model } = useCurrentModel()
  const [prototype] = useModelStore((state) => [state.prototype as Prototype])
  const [widgetItems, setWidgetItems] = useState<any>([])
  const [mode, setMode] = useState<string>(MODE_RUN)
  const [isAuthorized] = usePermissionHook([PERMISSIONS.READ_MODEL, model?.id])

  useEffect(() => {
    //
    let widgetItems = []
    if (prototype?.widget_config) {
      try {
        let dashboard_config = JSON.parse(prototype.widget_config)
        //
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
  }, [prototype?.widget_config])

  // useEffect(() => {
  //
  //
  // }, [apisValue])

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

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
       { isAuthorized && <div className='w-full flex items-center justify-start py-1 bg-slate-100 px-2'>
          { mode == MODE_RUN && <div className='mx-2 font-bold cursor-pointer hover:opacity-50 flex items-center'
          onClick={() => { setMode(MODE_EDIT)}}>
            <MdOutlineDesignServices size={20} className='mr-2'/>
            Design Dashboard
            </div>
          }

          { mode == MODE_EDIT && <>
              <div className='ml-2 mr-4 font-bold cursor-pointer hover:opacity-50 flex items-center'
                onClick={() => { setMode(MODE_RUN)}}>
                  <IoSaveOutline size={20} className='mr-2'/>
                  Save</div> 

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
             </>
          }
      </div> }

      <div className="w-full h-full">
        { mode == MODE_RUN && <DaDashboardGrid widgetItems={widgetItems}></DaDashboardGrid> }
        { mode == MODE_EDIT &&  <PrototypeTabCodeDashboardCfg/> }
      </div>
    </div>
  )
}

export default DaDashboard
