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
import { BsArrowsFullscreen } from 'react-icons/bs'
import { AiOutlineFullscreenExit } from 'react-icons/ai'

const MODE_RUN = 'run'
const MODE_EDIT = 'edit'

interface iDaDashboardProps {
  setFullScreenMode: (mode: boolean) => void
}

const DaDashboard: FC<iDaDashboardProps> = ({ setFullScreenMode }) => {
  const [isFullscreen, setIsFullScreen] = useState(false)
  const { data: model } = useCurrentModel()
  const [prototype] = useModelStore((state) => [state.prototype as Prototype])
  const [widgetItems, setWidgetItems] = useState<any>([])
  const [mode, setMode] = useState<string>(MODE_RUN)
  const [isAuthorized] = usePermissionHook([PERMISSIONS.READ_MODEL, model?.id])

  useEffect(() => {
    if (!setFullScreenMode) return
    setFullScreenMode(isFullscreen)
  }, [isFullscreen])

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
    <div className="w-full h-full relative border">
      <div className="absolute opacity-90 hover:opacity-100 left-0 px-2 top-0 w-full py-1 shadow-xl bg-white z-10 flex items-center">
        {!isFullscreen && (
          <BsArrowsFullscreen
            onClick={() => {
              setIsFullScreen(true)
            }}
            size={18}
            className="ml-2 cursor-pointer hover:opacity-80"
          />
        )}
        {isFullscreen && (
          <AiOutlineFullscreenExit
            onClick={() => {
              setIsFullScreen(false)
            }}
            size={20}
            className="ml-2 cursor-pointer hover:opacity-80"
          />
        )}

        {isAuthorized && (
          <div className="ml-2 flex w-full h-fit items-center justify-start px-1">
            {mode == MODE_RUN && (
              <DaButton
                variant="plain"
                size="sm"
                onClick={() => {
                  setMode(MODE_EDIT)
                }}
              >
                <MdOutlineDesignServices className="size-6" />
                <div className="font-medium ml-1">Edit dashboard</div>
              </DaButton>
            )}

            {mode == MODE_EDIT && (
              <div className="flex flex-col w-full h-full">
                {/* <DaText
                  className="flex h-fit w-full text-da-primary-500"
                  variant="sub-title"
                >
                  Dashboard Config
                </DaText> */}
                <div className="flex w-full h-fit gap-4">
                  <DaButton
                    size="sm"
                    onClick={() => {
                      setMode(MODE_RUN)
                    }}
                    variant="plain"
                  >
                    <TbDeviceFloppy size={20} className="mr-2" />
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
      </div>

      <div className="w-full h-full absolute top-0 left-0 right-0 bottom-0 pt-[38px]">
        <div className="flex flex-col w-full h-full pt-1">
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
