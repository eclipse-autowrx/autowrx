import { useEffect, useRef } from 'react'
import { VehicleApi } from '@/types/model.type'
import { DaText } from '../atoms/DaText'
import { getApiTypeClasses } from '@/lib/utils'

interface DaApiListItemProps {
  api: VehicleApi
  onClick: () => void
  isSelected?: boolean
  itemRef?: React.RefObject<HTMLDivElement>
}

const DaApiListItem = ({
  api,
  onClick,
  isSelected,
  itemRef,
}: DaApiListItemProps) => {
  const { textClass } = getApiTypeClasses(api.type)
  return (
    <div
      ref={itemRef}
      className={`flex w-full min-w-full justify-between py-1.5 text-da-gray-medium cursor-pointer hover:bg-da-primary-100 items-center px-2 rounded ${
        isSelected ? 'bg-da-primary-100 text-da-primary-500' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex w-full cursor-pointer items-center">
        <DaText
          variant={isSelected ? 'small-bold' : 'small'}
          className="cursor-pointer"
        >
          {api.name}
        </DaText>
        {api.isWishlist && (
          <div className="flex font-bold rounded-full w-4 h-4 ml-2 bg-fuchsia-500 text-da-white items-center justify-center text-[9px]">
            W
          </div>
        )}
      </div>
      <div className="flex w-fit justify-end cursor-pointer pl-4">
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
  apis: VehicleApi[]
  onApiClick?: (api: VehicleApi) => void
  selectedApi?: VehicleApi | null
}

const DaApiList = ({ apis, onApiClick, selectedApi }: DaApiListProps) => {
  const selectedRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }, [selectedApi])

  return (
    <div className="flex flex-col w-full h-full">
      {apis.map((api, index) => (
        <DaApiListItem
          key={index}
          api={api}
          onClick={() => {
            if (onApiClick) {
              onApiClick(api)
            }
          }}
          isSelected={selectedApi?.name === api.name}
          itemRef={selectedApi?.name === api.name ? selectedRef : undefined}
        />
      ))}
    </div>
  )
}

export { DaApiList, DaApiListItem }
