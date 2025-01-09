import { FC, useEffect, useState } from 'react'
import DaDashboardGrid from './DaDashboardGrid'
import useModelStore from '@/stores/modelStore'
import { Prototype } from '@/types/model.type'
import PrototypeTabCodeDashboardCfg from '@/components/organisms/PrototypeTabCodeDashboardCfg'
import usePermissionHook from '@/hooks/usePermissionHook'
import { PERMISSIONS } from '@/data/permission'
import useCurrentModel from '@/hooks/useCurrentModel'
import { MdOutlineDesignServices } from 'react-icons/md'
import {
  TbDeviceFloppy,
  TbArrowsMaximize,
  TbArrowsMinimize,
  TbTools,
  TbEdit,
} from 'react-icons/tb'
import { DaButton } from '@/components/atoms/DaButton'
const MODE_RUN = 'run'
const MODE_EDIT = 'edit'
import { useSystemUI } from '@/hooks/useSystemUI'
import { cn } from '@/lib/utils'
import { DaImage } from '@/components/atoms/DaImage'
import { Link } from 'react-router-dom'

const DaDashboard = () => {
  const { data: model } = useCurrentModel()
  const [prototype] = useModelStore((state) => [state.prototype as Prototype])
  const [widgetItems, setWidgetItems] = useState<any>([])
  const [mode, setMode] = useState<string>(MODE_RUN)
  const [isAuthorized] = usePermissionHook([PERMISSIONS.READ_MODEL, model?.id])
  const {
    showPrototypeDashboardFullScreen,
    setShowPrototypeDashboardFullScreen,
  } = useSystemUI()

  useEffect(() => {
    let widgetItems = []
    // prototype.widget_config: JSON string
    if (prototype?.widget_config) {
      // console.log('prototype.widget_config', prototype.widget_config)
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
    <div className="w-full h-full relative border">
      <div
        className={cn(
          'absolute z-10 left-0 px-2 top-0 flex w-full py-1 shadow-xl bg-white items-center',
          showPrototypeDashboardFullScreen && 'h-[56px]',
        )}
      >
        {showPrototypeDashboardFullScreen && (
          <Link to="/" className="w-fit h-[56px] flex items-center px-2">
            <DaImage src="/imgs/logo-wide.png" className="object-contain" />
          </Link>
        )}
        {isAuthorized && (
          <div className="ml-2 flex w-full h-fit items-center px-1 justify-end">
            {mode == MODE_RUN && (
              <DaButton
                variant="editor"
                size="sm"
                onClick={() => {
                  setMode(MODE_EDIT)
                }}
              >
                <TbEdit className="size-4 mr-1" />
                Edit
              </DaButton>
            )}

            {mode == MODE_EDIT && (
              <div className="flex flex-col w-fit h-full">
                {/* <DaText
                  className="flex h-fit w-full text-da-primary-500"
                  variant="sub-title"
                >
                  Dashboard Config
                </DaText> */}
                <div className="flex w-full h-fit space-x-2 mr-2">
                  <DaButton
                    size="sm"
                    onClick={() => {
                      setMode(MODE_RUN)
                    }}
                    variant="outline-nocolor"
                    className="w-16"
                  >
                    Cancel
                  </DaButton>
                  <DaButton
                    size="sm"
                    onClick={() => {
                      setMode(MODE_RUN)
                    }}
                    variant="solid"
                    className="w-16"
                  >
                    Save
                  </DaButton>

                  {/* {config?.studioUrl && (
                    <Link
                      className="flex da-label-small  gap-2 h-8 items-center justify-center hover:text-da-gray-dark"
                      target="_blank"
                      to={config?.studioUrl}
                    >
                      Studio
                      <TbArrowUpRight className="w-5 h-5" />
                    </Link>
                  )}
                  {config?.widgetMarketPlaceUrl && (
                    <Link
                      className="flex da-label-small gap-2 h-8  items-center justify-center hover:text-da-gray-dark"
                      target="_blank"
                      to={config?.widgetMarketPlaceUrl}
                    >
                      Marketplace
                      <TbArrowUpRight className="w-5 h-5" />
                    </Link>
                  )} */}
                </div>
              </div>
            )}
          </div>
        )}
        <DaButton
          variant="editor"
          size="sm"
          onClick={() =>
            setShowPrototypeDashboardFullScreen(
              !showPrototypeDashboardFullScreen,
            )
          }
        >
          {showPrototypeDashboardFullScreen ? (
            <TbArrowsMinimize className="size-4" />
          ) : (
            <TbArrowsMaximize className="size-4" />
          )}
        </DaButton>
      </div>

      <div
        className={cn(
          'w-full h-full absolute top-0 left-0 right-0 bottom-0 ',
          showPrototypeDashboardFullScreen ? 'pt-[56px]' : 'pt-[38px]',
        )}
      >
        <div
          className={cn(
            'flex flex-col w-full h-full pt-1',
            showPrototypeDashboardFullScreen && 'pr-14',
          )}
        >
          {mode == MODE_RUN && (
            <div className="flex w-full h-full px-1 pb-1">
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
    </div>
  )
}

export default DaDashboard
