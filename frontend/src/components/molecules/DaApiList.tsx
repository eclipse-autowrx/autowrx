// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useEffect, useRef } from 'react'
import { VehicleApi } from '@/types/model.type'
import { getApiTypeClasses } from '@/lib/utils'
import { DaCopy } from '../atoms/DaCopy'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/atoms/tooltip'
import { useState } from 'react'
import { TbPlaylistAdd, TbPlus } from 'react-icons/tb'
import { Dialog, DialogContent } from '@/components/atoms/dialog'
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
        className={`signal-list-item flex w-full min-w-full justify-between py-1.5 text-muted-foreground cursor-pointer hover:bg-primary/10 items-center px-2 rounded ${
          isSelected ? 'bg-primary/10 text-primary' : ''
        }`}
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex flex-1 truncate cursor-pointer items-center">
          <div
            className={`signal-list-item-name text-sm cursor-pointer ${isSelected ? 'font-medium' : 'font-normal'} truncate`}
          >
            {api.name}
          </div>
          {api.isWishlist && (
            <div className="flex font-medium rounded-full w-4 h-4 ml-2 bg-fuchsia-500 text-white items-center justify-center text-[9px]">
              W
            </div>
          )}
          {isHovered && (
            <div className="flex space-x-2 ml-2">
              <TooltipProvider>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <div>
                      <DaCopy textToCopy={api.name} className="w-fit signal-list-item-btn-copy" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Copy Signal Name</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {api.type === 'branch' && (
                <TooltipProvider>
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <span
                        onClick={(e) => {
                          e.stopPropagation()
                          setIsOpenWishlistPopup(true)
                        }}
                      >
                        <TbPlus className="ml-1 size-4 text-muted-foreground hover:text-fuchsia-500" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>Add wishlist signal from this branch</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          )}{' '}
        </div>
        <div className="flex w-fit justify-end cursor-pointer pl-4">
          <div className={textClass + ' uppercase text-sm font-medium cursor-pointer'}>
            {api.type}
          </div>
        </div>
      </div>
      {isAuthorized && (
        <Dialog open={isOpenWishlistPopup} onOpenChange={setIsOpenWishlistPopup}>
          <DialogContent>
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
          </DialogContent>
        </Dialog>
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
