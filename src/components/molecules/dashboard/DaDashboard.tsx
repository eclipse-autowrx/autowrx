import { FC, useEffect, useState } from 'react'
import DaDashboardGrid from './DaDashboardGrid'
import useModelStore from '@/stores/modelStore'
import { Prototype } from '@/types/model.type'

const DaDashboard: FC = ({}) => {
  const [prototype] = useModelStore((state) => [state.prototype as Prototype])
  const [widgetItems, setWidgetItems] = useState<any>([])

  useEffect(() => {
    // console.log('DaDashboard, prototype', prototype)
    let widgetItems = []
    if (prototype?.widget_config) {
      try {
        let dashboard_config = JSON.parse(prototype.widget_config)
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
    // console.log('widgetItems', widgetItems)
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
    <div className="w-full h-full flex items-center justify-center">
      <DaDashboardGrid widgetItems={widgetItems}></DaDashboardGrid>
    </div>
  )
}

export default DaDashboard
