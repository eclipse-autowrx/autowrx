import { cn } from '@/lib/utils'
import { DaText } from '../atoms/DaText'
import clsx from 'clsx'

interface DaTablePropertyItemProps {
  property: string
  value: string
  diffDetail?: {
    diff?: number
    valueDiff?: number | [number, string][]
  }
}

const DaTablePropertyItem = ({
  property,
  value,
  diffDetail,
}: DaTablePropertyItemProps) => {
  const isValidValue =
    Array.isArray(diffDetail?.valueDiff) &&
    diffDetail.valueDiff.every(
      (item) => typeof item[0] === 'number' && typeof item[1] === 'string',
    )

  return (
    <div
      className={clsx(
        'flex w-[calc(100%+16px)] rounded-md h-fit py-2 text-da-gray-medium space-x-4 -mx-2 px-2',
        diffDetail?.diff === -1 && 'bg-red-50',
        diffDetail?.diff === 1 && 'bg-green-50',
      )}
    >
      <div className="flex min-w-[120px]">
        <DaText variant="small-bold" className="!flex text-da-gray-dark">
          {property}
        </DaText>
      </div>
      <div
        className={clsx(
          'flex w-full max-h-[180px] overflow-auto',
          diffDetail?.valueDiff === -1 && 'bg-red-50',
          diffDetail?.valueDiff === 1 && 'bg-green-50',
        )}
      >
        {Array.isArray(diffDetail?.valueDiff) && isValidValue ? (
          <div>
            {diffDetail.valueDiff.map((item, index) => (
              <DaText
                variant="small"
                key={index}
                className={clsx(
                  'break-words',
                  item[0] === -1 && 'bg-red-50',
                  item[0] === 1 && 'bg-green-50',
                )}
              >
                {item[1]}
              </DaText>
            ))}
          </div>
        ) : (
          <DaText variant="small" className="!flex break-words">
            {value}
          </DaText>
        )}
      </div>
    </div>
  )
}

interface DaTablePropertyProps {
  properties: { name: string; value: string }[]
  className?: string
  diffDetail?: any
}

export const DaTableProperty = ({
  properties,
  className,
  diffDetail,
}: DaTablePropertyProps) => {
  return (
    <div
      className={cn(
        'flex flex-col h-fit w-full rounded-lg bg-da-white',
        className,
      )}
    >
      {properties.map((item, index) => (
        <DaTablePropertyItem
          key={index}
          property={item.name}
          value={item.value}
          diffDetail={diffDetail?.[item.name]}
        />
      ))}
    </div>
  )
}
