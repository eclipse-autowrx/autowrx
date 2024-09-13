import { FC, useEffect, useState } from 'react'
import DaDashboardGrid from './DaDashboardGrid'
import useModelStore from '@/stores/modelStore'
import { Prototype } from '@/types/model.type'
import PrototypeTabCodeDashboardCfg from '@/components/organisms/PrototypeTabCodeDashboardCfg'
import usePermissionHook from '@/hooks/usePermissionHook'
import { PERMISSIONS } from '@/data/permission'
import useCurrentModel from '@/hooks/useCurrentModel'
import { MdOutlineDesignServices } from 'react-icons/md'
import config from '@/configs/config'
import {
  TbRocket,
  TbDotsVertical,
  TbArrowUpRight,
  TbDeviceFloppy,
} from 'react-icons/tb'
import DaText from '@/components/atoms/DaText'
import { DaButton } from '@/components/atoms/DaButton'
import { Link } from 'react-router-dom'
import clsx from 'clsx'

const MODE_RUN = 'run'
const MODE_EDIT = 'edit'

const DaDashboard: FC = ({}) => {
  const { data: model } = useCurrentModel()
  const [prototype] = useModelStore((state) => [state.prototype as Prototype])
  const [widgetItems, setWidgetItems] = useState<any>([])
  const [mode, setMode] = useState<string>(MODE_RUN)
  const [isAuthorized] = usePermissionHook([PERMISSIONS.READ_MODEL, model?.id])

  useEffect(() => {
    let widgetItems = []
    // prototype.widget_config: JSON string
    if (prototype?.widget_config) {
      console.log('prototype.widget_config', prototype.widget_config)
      try {
        let dashboard_config = JSON.parse(prototype.widget_config) // prototype.dashboard_config: JSON object
        // console.log('dashboard_config', dashboard_config)
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
    <div className="flex flex-col w-full h-full overflow-y-auto pt-3 bg-white">
      {isAuthorized && (
        <div className="flex w-full h-fit items-center justify-start px-2">
          {mode == MODE_RUN && (
            <DaButton
              variant="outline-nocolor"
              size="sm"
              onClick={() => {
                setMode(MODE_EDIT)
              }}
            >
              <MdOutlineDesignServices className="size-5 mr-2" />
              <div className="font-medium">Design Dashboard </div>
            </DaButton>
          )}

          {mode == MODE_EDIT && (
            <div className="flex flex-col w-full h-full px-3">
              <DaText
                className="flex h-fit w-full text-da-primary-500"
                variant="sub-title"
              >
                Dashboard Config
              </DaText>
              <div className="flex w-full h-fit mt-3 gap-6">
                <DaButton
                  size="sm"
                  onClick={() => {
                    setMode(MODE_RUN)
                  }}
                  variant="outline-nocolor"
                >
                  <TbDeviceFloppy size={20} className="mr-2" />
                  Save
                </DaButton>

                {config?.studioUrl && (
                  <Link
                    className="flex da-label-small  gap-2 h-8 items-center justify-center hover:text-da-gray-dark"
                    target="_blank"
                    to={config?.studioUrl}
                  >
                    Widget Studio
                    <TbArrowUpRight className="w-5 h-5" />
                  </Link>
                )}
                {config?.widgetMarketPlaceUrl && (
                  <Link
                    className="flex da-label-small gap-2 h-8  items-center justify-center hover:text-da-gray-dark"
                    target="_blank"
                    to={config?.widgetMarketPlaceUrl}
                  >
                    Widget Marketplace
                    <TbArrowUpRight className="w-5 h-5" />
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col w-full h-full pt-2 ">
        {mode == MODE_RUN && (
          <div className="flex w-full h-full px-2 pb-2">
            <DaDashboardGrid widgetItems={widgetItems} />
          </div>
        )}
        {mode == MODE_EDIT && (
          <div className="px-4 h-full">
            <PrototypeTabCodeDashboardCfg />
          </div>
        )}
      </div>
    </div>
  )
}

export default DaDashboard
