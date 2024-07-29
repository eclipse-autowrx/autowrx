import { cn } from '@/lib/utils'
import { DaText } from '../atoms/DaText'

interface DaTablePropertyItemProps {
  property: string
  value: string
}

const DaTablePropertyItem = ({ property, value }: DaTablePropertyItemProps) => {
  return (
    <div className="grid grid-cols-4 lg:grid-cols-5 gap-4 py-2 text-da-gray-medium">
      <div className="col-span-1 ">
        <DaText variant="regular-bold" className="">
          {property}
        </DaText>
      </div>
      <div className="col-span-3 lg:grid-cols-5">
        <DaText variant="regular" className="">
          {value}
        </DaText>
      </div>
    </div>
  )
}

interface DaTablePropertyProps {
  properties: { name: string; value: string }[]
  maxWidth?: string
  className?: string
}

export const DaTableProperty = ({
  properties,
  maxWidth = '1500px',
  className,
}: DaTablePropertyProps) => {
  return (
    <div
      className={cn('rounded-lg bg-da-white', className)}
      style={{ maxWidth: maxWidth }}
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
