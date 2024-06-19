import { FC, useEffect, useState, useRef } from 'react'
import { WidgetConfig } from './DaDashboardEditor'
import useRuntimeStore from '@/stores/runtimeStore'
import { shallow } from 'zustand/shallow'

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
  index: number
  cell: number,
  apisValue: any
}



const WidgetItem: FC<PropsWidgetItem> = ({ widgetConfig, index, cell, apisValue }) => {
  
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

  useEffect(() => {
    let timer = setInterval(() => {
      // console.log(new Date())
      console.log(`apisValue inside`)
      console.log(apisValue)

      // let setData = JSON.parse(JSON.stringify(apisValue))
      // for (const api in setData) {
      //   setData[api] = { value: setData[api] }
      // }

      // console.log(apisValue)

      frameElement?.current?.contentWindow?.postMessage(JSON.stringify({
        cmd: "vss-sync",
        vssData: apisValue
      }), "*")

    }, 1000)

    return () => {
      clearInterval(timer)
    }

  }, [])

  // useEffect(() => {
  //   console.log(`apisValue inside`)
  //   console.log(apisValue)
  // }, [apisValue])

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

const DaDashboardGrid: FC<DaDashboardGridProps> = ({ widgetItems }) => {
  const CELLS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

  useEffect(() => {
    console.log('DaDashboardGrid, widgetItems', widgetItems)
  }, [widgetItems])

  const apisValue = useRuntimeStore(
    state => 
      state.apisValue
  )

    useEffect(() => {
    console.log(`apisValue`)
    console.log(apisValue)
  }, [apisValue])


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
      })}
    </div>
  )
}

export default DaDashboardGrid
