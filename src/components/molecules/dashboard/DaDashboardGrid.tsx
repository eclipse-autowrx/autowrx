// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC, useEffect, useState, useRef, useMemo } from 'react'
import useRuntimeStore from '@/stores/runtimeStore'
import { WidgetConfig } from '@/types/widget.type'
import DaPopup from '@/components/atoms/DaPopup'
import useCurrentModelApi from '@/hooks/useCurrentModelApi'

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
  vssTree?: any
}

const WidgetItem: FC<PropsWidgetItem> = ({
  widgetConfig,
  apisValue,
  appLog,
  vssTree,
}) => {
  const [rSpan, setRSpan] = useState<number>(0)
  const [cSpan, setCSpan] = useState<number>(0)
  const frameElement = useRef<HTMLIFrameElement>(null)
  const [url, setUrl] = useState<string>()
  const [iframeLoaded, setIframeLoaded] = useState(false)

  useEffect(() => {
    if (!widgetConfig) return
    let url = widgetConfig.url

    // Don't append query parameters to built-in widget paths (local static files)
    // They receive options via postMessage instead
    if (url && url.startsWith('/builtin-widgets/')) {
      setUrl(url)
    } else if (url && widgetConfig.options) {
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

  const sendVssTreeToWidget = (tree: any) => {
    if (!tree) return
    frameElement?.current?.contentWindow?.postMessage(
      JSON.stringify({
        cmd: 'vss-tree',
        vssTree: tree,
      }),
      '*',
    )
  }

  useEffect(() => {
    if (!appLog) return
    sendAppLogToWidget(appLog)
  }, [appLog])

  // Send VSS tree to widget when both iframe is loaded AND vssTree is available
  useEffect(() => {
    if (!iframeLoaded || !vssTree) return
    sendVssTreeToWidget(vssTree)
  }, [vssTree, iframeLoaded])

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
        onLoad={() => {
          // Mark iframe as loaded
          setIframeLoaded(true)

          // Send widget options via postMessage for built-in widgets
          if (widgetConfig?.url?.startsWith('/builtin-widgets/')) {
            setTimeout(() => {
              if (widgetConfig?.options) {
                frameElement?.current?.contentWindow?.postMessage(
                  JSON.stringify({
                    cmd: 'widget-options',
                    options: widgetConfig.options,
                  }),
                  '*',
                )
              }
              // VSS tree will be sent by useEffect when both iframe and vssTree are ready
            }, 100)
          }
        }}
      ></iframe>
    </div>
  )
}

const DaDashboardGrid: FC<DaDashboardGridProps> = ({ widgetItems }) => {
  // const CELLS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  const [showModal, setShowModal] = useState(false)
  const [payload, setPayload] = useState<any>()
  const { data: cvi } = useCurrentModelApi()
  const [renderCell, setRenderCell] = useState<any[]>([])

  // Memoize VSS tree to prevent unnecessary re-renders with large data
  const memoizedVssTree = useMemo(() => cvi, [cvi])

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

  const [apisValue, traceVars, appLog] = useRuntimeStore((state) => [
    state.apisValue,
    state.traceVars,
    state.appLog,
  ])

  const [allVars, setAllVars] = useState<any>({})

  useEffect(() => {
    setAllVars({ ...traceVars, ...apisValue })
  }, [traceVars, apisValue])

  // useEffect(() => {
  //   console.log(`traceVars`, traceVars)
  // }, [traceVars])

  // useEffect(() => {
  //   console.log(`apisValue`, apisValue)
  // }, [apisValue])

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
              muted={payload?.options?.muted}
              autoPlay={payload?.options?.autoPlay}
            />
          )}
          {payload?.type === 'image' && (
            <img
              src={payload?.url}
              className="max-h-full max-w-full object-contain"
              alt={payload?.options?.alt}
              width={payload?.options?.width}
              height={payload?.options?.height}
            />
          )}
          {payload?.type === 'iframe' && (
            <iframe
              className="h-[calc(100vh-200px)] w-[calc(100vw-200px)]"
              srcDoc={`<div style="height:100%; width:100%">${payload?.html}</div>`}
            ></iframe>
          )}
        </div>
      </DaPopup>
      {renderCell.map((widgetItem, wIndex) => (
        <WidgetItem
          key={wIndex}
          widgetConfig={widgetItem}
          apisValue={allVars}
          appLog={appLog}
          vssTree={memoizedVssTree}
        />
      ))}
    </div>
  )
}

export default DaDashboardGrid
