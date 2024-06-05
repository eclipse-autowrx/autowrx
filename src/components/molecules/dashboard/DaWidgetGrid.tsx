import { FC, useEffect, useState } from 'react'
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

  const widgetItem = (
    widgetConfig: WidgetConfig,
    index: number,
    cell: number,
  ) => {
    const { rowSpan, colSpan } = calculateSpans(widgetConfig.boxes)
    return (
      <div
        className={`col-span-${colSpan} row-span-${rowSpan}`}
        key={`${index}-${cell}`}
      >
        <iframe
          src={widgetConfig.url}
          className="w-full h-full m-0"
          allow="camera;microphone"
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
          return widgetItem(widgetItems[widgetIndex], widgetIndex, cell)
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
