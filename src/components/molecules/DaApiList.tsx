import { VehicleApi } from '@/types/model.type'
import { DaText } from '../atoms/DaText'
import { getApiTypeClasses } from '@/lib/utils'

interface DaApiListItemProps {
  api: VehicleApi
  onClick: () => void
  isSelected?: boolean
}

const DaApiListItem = ({
  api,
  onClick,
  isSelected,
}: DaApiListItemProps) => {
  const { textClass } = getApiTypeClasses(api.type)
  return (
    <div
      className={`grid grid-cols-4 gap-4 py-1.5 text-da-gray-medium cursor-pointer hover:bg-da-gray-light items-center justify-center px-2 rounded ${isSelected ? 'bg-da-primary-100 text-da-primary-500' : ''
        }`}
      onClick={onClick}
    >
      <div className="col-span-3 cursor-pointer">
        <DaText variant="small" className="cursor-pointer">
          {api.api}
        </DaText>
      </div>
      <div className="col-span-1 flex justify-end cursor-pointer">
        <DaText
          variant="small"
          className={textClass + ' uppercase !font-medium cursor-pointer'}
        >
          {api.type}
        </DaText>
      </div>
    </div>
  )
}

interface DaApiListProps {
  apis: any[]
  onApiClick?: (api: VehicleApi) => void
  selectedApi?: { api: string; type: string; details: any } | null
  maxWidth?: string
}

const DaApiList = ({
  apis,
  onApiClick,
  selectedApi,
  maxWidth = '1500px',
}: DaApiListProps) => {
  return (
    <div
      className="flex flex-col w-full h-full overflow-y-auto overflow-x-hidden bg-da-white"
      style={{ maxWidth: maxWidth }}
    >
      {apis.map((item, index) => (
        <DaApiListItem
          key={index}
          api={item}
          onClick={() => { if (onApiClick) { onApiClick(item) } }}
          isSelected={selectedApi?.api === item.api}
        />
      ))}
    </div>
  )
}

export { DaApiList, DaApiListItem }
