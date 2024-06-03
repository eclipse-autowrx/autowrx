import { FC } from 'react'

interface DaDashboardGridProps {
  widgetItems: any[]
}

const DaDashboardGrid: FC<DaDashboardGridProps> = ({ widgetItems }) => {
  const CELLS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  return (
    <div
      className={`grid h-full w-full grid-cols-5 grid-rows-2 !pointer-events-none`}
      //   style={{ gridTemplateRows: 'repeat(2, 120px)' }}
    >
      {/* {widgetGrid()} */}
      {CELLS.map((cell) => (
        <div
          key={`empty-${cell}`}
          className={`flex border border-da-gray-light justify-center items-center select-none da-label-huge text-da-gray-medium`}
        >
          {cell}
        </div>
      ))}
    </div>
  )
}

export default DaDashboardGrid
