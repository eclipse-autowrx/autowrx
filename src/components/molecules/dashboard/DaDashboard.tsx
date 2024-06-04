import { FC, useEffect, useState } from 'react'
import DaDashboardGrid from './DaWidgetGrid'
import useModelStore from '@/stores/modelStore'
import { Prototype } from '@/types/model.type'

const DaDashboard: FC = ({}) => {
  const [prototype] = useModelStore((state) => [state.prototype as Prototype])
  const [widgetItems, setWidgetItems] = useState<any>([])

  useEffect(() => {
    if (!prototype?.widget_config) {
    }
  }, [prototype?.widget_config])

  return (
    <div className="w-full h-full flex items-center justify-center">
      <DaDashboardGrid widgetItems={widgetItems}></DaDashboardGrid>
    </div>
  )
}

export default DaDashboard
