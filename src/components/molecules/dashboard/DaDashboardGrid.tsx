import { FC, useEffect, useState, useRef } from 'react'
import { WidgetConfig } from './DaDashboardEditor'

interface DaDashboardGridProps {
  widgetItems: any[]
}

const calculateSpans = (boxes: any) => {
  let minCol = Math.min(...boxes.map((box: any) => ((box - 1) % 5) + 1))
  let maxCol = Math.max(...boxes.map((box: any) => ((box - 1) % 5) + 1))
  let minRow = Math.ceil(Math.min(...boxes) / 5)
  let maxRow = Math.ceil(Math.max(...boxes) / 5)

  let colSpan = maxCol - minCol + 1
  let rowSpan = maxRow - minRow + 1

  return { rowSpan, colSpan }
}

const DaDashboardGrid: FC<DaDashboardGridProps> = ({ widgetItems }) => {
  const CELLS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

  useEffect(() => {
    console.log('DaDashboardGrid, widgetItems', widgetItems)
  }, [widgetItems])

  interface PropsWidgetItem {
    widgetConfig: WidgetConfig
    index: number
    cell: number
  }

  const WidgetItem: FC<PropsWidgetItem> = ({ widgetConfig, index, cell }) => {
    const [rSpan, setRSpan] = useState<number>(0)
    const [cSpan, setCSpan] = useState<number>(0)
    const frameElement = useRef<HTMLIFrameElement>(null)
    const [url, setUrl] = useState<string>()

    useEffect(() => {
      let url = widgetConfig.url
      if (url && widgetConfig.options) {
        let send_options = JSON.parse(JSON.stringify(widgetConfig.options))
        delete send_options.url
        url =
          url + '?options=' + encodeURIComponent(JSON.stringify(send_options))
        setUrl(url)
      }
    }, [widgetConfig.url])

    useEffect(() => {
      const { rowSpan, colSpan } = calculateSpans(widgetConfig.boxes)
      setRSpan(rowSpan)
      setCSpan(colSpan)
    }, [widgetConfig.boxes])

    return (
      <div
        className={`col-span-${cSpan} row-span-${rSpan}`}
        key={`${index}-${cell}`}
      >
        <iframe
          ref={frameElement}
          src={url}
          className="w-full h-full m-0"
          allow="camera;microphone"
          onLoad={() => {
            // console.log('iframe loaded')
            // console.log(frameElement?.current?.contentWindow)
          }}
        ></iframe>
      </div>
    )
  }

  let renderedWidgets = new Set()

  return (
    <div className={`grid h-full w-full grid-cols-5 grid-rows-2`}>
      {CELLS.map((cell) => {
        const widgetIndex = widgetItems.findIndex((w) =>
          w.boxes?.includes(cell),
        )
        if (widgetIndex !== -1 && !renderedWidgets.has(widgetIndex)) {
          renderedWidgets.add(widgetIndex)
          // return widgetItem(widgetItems[widgetIndex], widgetIndex, cell)
          return (
            <WidgetItem
              widgetConfig={widgetItems[widgetIndex]}
              index={widgetIndex}
              cell={cell}
            />
          )
        } else if (widgetIndex === -1) {
          return (
            <div
              key={`empty-${cell}`}
              className={`flex border border-da-gray-light justify-center items-center select-none da-label-huge text-da-gray-medium`}
            >
              {cell}
            </div>
          )
        }
      })}
    </div>
  )
}

export default DaDashboardGrid
