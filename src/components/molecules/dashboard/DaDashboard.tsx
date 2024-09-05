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
    if (prototype?.widget_config) {
      try {
        let dashboard_config = JSON.parse(prototype.widget_config)
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
    <div className="w-full h-full overflow-y-auto pt-3 items-center justify-center bg-white">
      {isAuthorized && (
        <div className="w-full flex-shrink-0 h-[72px] flex items-center justify-start px-2">
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
            <div className="px-3">
              <DaText
                className="text-da-black block w-full"
                variant="sub-title"
              >
                Dashboard Config
              </DaText>
              <div className="flex mt-3 gap-6">
                <DaButton
                  size="sm"
                  onClick={() => {
                    setMode(MODE_RUN)
                  }}
                >
                  <TbDeviceFloppy size={20} className="mr-2" />
                  Save
                </DaButton>

                {config?.studioUrl && (
                  <Link
                    className="da-label-small flex gap-2 h-8 items-center justify-center"
                    target="_blank"
                    to={config?.studioUrl}
                  >
                    Widget Studio
                    <TbArrowUpRight className="w-5 h-5" />
                  </Link>
                )}
                {config?.widgetMarketPlaceUrl && (
                  <Link
                    className="da-label-small gap-2 h-8 flex items-center justify-center"
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

      <div
        className={clsx(
          'w-full pt-3',
          mode == MODE_RUN ? 'h-full' : 'h-[calc(100%-100px)] min-h-[280px]',
        )}
      >
        {mode == MODE_RUN && (
          <DaDashboardGrid widgetItems={widgetItems}></DaDashboardGrid>
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
