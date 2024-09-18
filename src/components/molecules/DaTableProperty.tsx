import { cn } from '@/lib/utils'
import { DaText } from '../atoms/DaText'

interface DaTablePropertyItemProps {
  property: string
  value: string
}

const DaTablePropertyItem = ({ property, value }: DaTablePropertyItemProps) => {
  return (
    <div className="flex w-full h-fit py-2 text-da-gray-medium space-x-4">
      <div className="flex min-w-[100px]">
        <DaText variant="small-bold" className="!flex">
          {property}
        </DaText>
      </div>
      <div className="flex w-full">
        <DaText variant="small" className="!flex">
          {value}
        </DaText>
      </div>
    </div>
  )
}

interface DaTablePropertyProps {
  properties: { name: string; value: string }[]
  className?: string
}

export const DaTableProperty = ({
  properties,
  className,
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
        />
      ))}
    </div>
  )
}
