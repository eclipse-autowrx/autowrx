import { useEffect, useRef } from 'react'
import { VehicleApi } from '@/types/model.type'
import { DaText } from '../atoms/DaText'
import { getApiTypeClasses } from '@/lib/utils'
import { DaCopy } from '../atoms/DaCopy'
import DaTooltip from '../atoms/DaTooltip'
import { useState } from 'react'
import { TbPlaylistAdd, TbPlus } from 'react-icons/tb'
import DaPopup from '../atoms/DaPopup'
import usePermissionHook from '@/hooks/usePermissionHook'
import { PERMISSIONS } from '@/data/permission'
import { useParams } from 'react-router-dom'
import useCurrentModel from '@/hooks/useCurrentModel'
import FormCreateWishlistApi from './forms/FormCreateWishlistApi'

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
  const { model_id } = useParams()
  const { textClass } = getApiTypeClasses(api.type)
  const { data: model } = useCurrentModel()
  const [isOpenWishlistPopup, setIsOpenWishlistPopup] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null)
  const [isAuthorized] = usePermissionHook([PERMISSIONS.WRITE_MODEL, model_id])

  const handleMouseEnter = () => {
    const timeout = setTimeout(() => setIsHovered(true), 500) // Set hover state after 500ms
    setHoverTimeout(timeout)
  }

  const handleMouseLeave = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout) // Clear timeout if the hover ends early
    }
    setIsHovered(false) // Reset hover state
  }

  return (
    <>
      <div
        ref={itemRef}
        className={`flex w-full min-w-full justify-between py-1.5 text-da-gray-medium cursor-pointer hover:bg-da-primary-100 items-center px-2 rounded ${
          isSelected ? 'bg-da-primary-100 text-da-primary-500' : ''
        }`}
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex flex-1 truncate cursor-pointer items-center">
          {/* <DaText
          variant={isSelected ? 'small-bold' : 'small'}
          className="cursor-pointer"
        >
          {api.name}
        </DaText> */}
          <div
            className={`text-[12.5px] cursor-pointer ${isSelected ? 'font-bold' : 'font-medium'} truncate`}
          >
            {api.name}
          </div>
          {api.isWishlist && (
            <div className="flex font-bold rounded-full w-4 h-4 ml-2 bg-fuchsia-500 text-da-white items-center justify-center text-[9px]">
              W
            </div>
          )}
          {/* Only show DaCopy if hovered for 500ms */}
          {isHovered && (
            <div className="flex space-x-2 ml-2">
              <DaTooltip content="Copy Signal Name" delay={300}>
                <DaCopy textToCopy={api.name} className="w-fit" />
              </DaTooltip>

              {api.type === 'branch' && (
                <DaTooltip
                  content={`Add wishlist signal from this branch`}
                  delay={300}
                >
                  <span
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsOpenWishlistPopup(true)
                    }}
                  >
                    <TbPlus className="ml-1 size-4 text-da-gray-medium hover:text-fuchsia-500" />
                  </span>
                </DaTooltip>
              )}
            </div>
          )}{' '}
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
      {isAuthorized && (
        <DaPopup
          state={[isOpenWishlistPopup, setIsOpenWishlistPopup]}
          trigger={<></>}
        >
          {model_id && model && (
            <FormCreateWishlistApi
              modelId={model_id}
              existingCustomApis={model.custom_apis as VehicleApi[]}
              onClose={() => {
                setIsOpenWishlistPopup(false)
              }}
              onApiCreate={(api: VehicleApi) => {
                onClick()
              }}
              // Set the prefix to the current branch API's name
              prefix={`${api.name}.NewSignal`}
            />
          )}
        </DaPopup>
      )}
    </>
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
