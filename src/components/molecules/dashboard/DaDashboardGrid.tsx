import { FC, useEffect, useState, useRef } from 'react'
import useRuntimeStore from '@/stores/runtimeStore'
import { WidgetConfig } from '@/types/widget.type'
import DaPopup from '@/components/atoms/DaPopup'

interface DaDashboardGridProps {
  widgetItems: any[]
  appLog?: string
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
  appLog?: string
}

const WidgetItem: FC<PropsWidgetItem> = ({
  widgetConfig,
  apisValue,
  appLog,
}) => {
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
      url = url + '?options=' + encodeURIComponent(JSON.stringify(send_options))
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

    frameElement?.current?.contentWindow?.postMessage(
      JSON.stringify({
        cmd: 'vss-sync',
        vssData: apisValue,
      }),
      '*',
    )
  }, [apisValue])

  const sendAppLogToWidget = (log: string) => {
    if (!log) return
    frameElement?.current?.contentWindow?.postMessage(
      JSON.stringify({
        cmd: 'app-log',
        log: log,
      }),
      '*',
    )
  }

  useEffect(() => {
    if (!appLog) return
    sendAppLogToWidget(appLog)
  }, [appLog])

  if (!widgetConfig)
    return (
      <div
        className={`da-label-huge flex select-none items-center justify-center border border-da-gray-light text-da-gray-medium`}
      >
        .
      </div>
    )

  return (
    <div className={`col-span-${cSpan} row-span-${rSpan}`}>
      <iframe
        ref={frameElement}
        src={url}
        className="m-0 h-full w-full"
        allow="camera;microphone"
        onLoad={() => {}}
      ></iframe>
    </div>
  )
}

const DaDashboardGrid: FC<DaDashboardGridProps> = ({ widgetItems }) => {
  // const CELLS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  const [showModal, setShowModal] = useState(false)
  const [payload, setPayload] = useState<any>()

  const [renderCell, setRenderCell] = useState<any[]>([])

  useEffect(() => {
    //
    let tmpCells = []
    let usedWidget = new Set()
    for (let i = 1; i <= 10; i++) {
      const widgetIndex = widgetItems.findIndex((w) => w.boxes?.includes(i))
      if (widgetIndex == -1) {
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

  const [apisValue, appLog] = useRuntimeStore((state) => [
    state.apisValue,
    state.appLog,
  ])

  useEffect(() => {
    const onMessageFromIframe = (event: MessageEvent) => {
      let data = event.data || {}
      try {
        data = JSON.parse(event.data)
      } catch (error) {
        // Do nothing
      }

      if (data.action === 'open-modal') {
        setShowModal(true)
        setPayload(data.payload)
      }
    }

    window.addEventListener('message', onMessageFromIframe)
    return () => {
      window.removeEventListener('message', onMessageFromIframe)
    }
  }, [])

  return (
    <div className={`grid h-full w-full grid-cols-5 grid-rows-2`}>
      <DaPopup trigger={<></>} state={[showModal, setShowModal]}>
        <div className="max-h-[calc(100vh-200px)] m-auto max-w-[calc(100vw-200px)]">
          {payload?.type === 'video' && (
            <video
              controls
              className="w-full h-full bg-black rounded-md"
              loop
              src={payload?.url}
            />
          )}
          {payload?.type === 'image' && (
            <img
              src={payload?.url}
              className="h-fit w-fit max-h-full max-w-full object-contain"
            />
          )}
        </div>
      </DaPopup>
      {renderCell.map((widgetItem, wIndex) => (
        <WidgetItem
          key={wIndex}
          widgetConfig={widgetItem}
          apisValue={apisValue}
          appLog={appLog}
        />
      ))}
    </div>
  )
}

export default DaDashboardGrid
