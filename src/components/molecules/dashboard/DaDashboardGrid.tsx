import { FC, useEffect, useState, useRef } from 'react'
import useRuntimeStore from '@/stores/runtimeStore'
import { WidgetConfig } from '@/types/widget.type'

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

interface PropsWidgetItem {
  widgetConfig: WidgetConfig
  apisValue: any
}



const WidgetItem: FC<PropsWidgetItem> = ({ widgetConfig, apisValue }) => {

  const [rSpan, setRSpan] = useState<number>(0)
  const [cSpan, setCSpan] = useState<number>(0)
  const frameElement = useRef<HTMLIFrameElement>(null)
  const [url, setUrl] = useState<string>()

  useEffect(() => {
    if (!widgetConfig) return
    let url = widgetConfig.url
    if (url && widgetConfig.options) {
      let send_options = JSON.parse(JSON.stringify(widgetConfig.options))
      delete send_options.url
      url =
        url + '?options=' + encodeURIComponent(JSON.stringify(send_options))
      setUrl(url)
    }
  }, [widgetConfig?.url])

  useEffect(() => {
    if (!widgetConfig) return
    const { rowSpan, colSpan } = calculateSpans(widgetConfig.boxes)
    setRSpan(rowSpan)
    setCSpan(colSpan)
  }, [widgetConfig?.boxes])

  useEffect(() => {
    let setData = JSON.parse(JSON.stringify(apisValue))
    for (const api in setData) {
      setData[api] = { value: setData[api] }
    }

    frameElement?.current?.contentWindow?.postMessage(JSON.stringify({
      cmd: "vss-sync",
      vssData: apisValue
    }), "*")

  }, [apisValue])


  if (!widgetConfig) return <div
    className={`flex border border-da-gray-light justify-center items-center select-none da-label-huge text-da-gray-medium`}
  >
    .
  </div>

  return (
    <div
      className={`col-span-${cSpan} row-span-${rSpan}`}
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

const DaDashboardGrid: FC<DaDashboardGridProps> = ({ widgetItems }) => {
  // const CELLS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  const [renderCell, setRenderCell] = useState<any[]>([])

  useEffect(() => {
    // console.log('DaDashboardGrid, widgetItems', widgetItems)
    let tmpCells = []
    let usedWidget = new Set()
    for (let i = 1; i <= 10; i++) {
      const widgetIndex = widgetItems.findIndex((w) =>
        w.boxes?.includes(i),
      )
      if(widgetIndex == -1) {
        tmpCells.push(null)
      } else {
        if (!usedWidget.has(widgetIndex)) {
          tmpCells.push(widgetItems[widgetIndex])
          usedWidget.add(widgetIndex)
        }
      }
    }
    setRenderCell(tmpCells)
  }, [widgetItems])

  const apisValue = useRuntimeStore(
    state =>
      state.apisValue
  )

  return (
    <div className={`grid h-full w-full grid-cols-5 grid-rows-2`}>
      {/* <div>renderCell: {renderCell.length}</div> */}
      {
        renderCell.map((widgetItem, wIndex) => <WidgetItem key={wIndex}
          widgetConfig={widgetItem}
          apisValue={apisValue} />)
      }
      {/* {CELLS.map((cell) => {
        const widgetIndex = widgetItems.findIndex((w) =>
          w.boxes?.includes(cell),
        )
        if (widgetIndex !== -1 && !renderedWidgets.has(widgetIndex)) {
          renderedWidgets.add(widgetIndex)
          return (
            <WidgetItem
              widgetConfig={widgetItems[widgetIndex]}
              index={widgetIndex}
              cell={cell}
              apisValue={apisValue}
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
      })} */}
    </div>
  )
}

export default DaDashboardGrid
