// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useEffect, useRef, useState } from 'react'
import { VehicleApi } from '@/types/model.type'
import { DaText } from '../atoms/DaText'
import { getApiTypeClasses } from '@/lib/utils'
import { DaCopy } from '../atoms/DaCopy'
import {
  TbChevronRight,
  TbChevronDown,
  TbPlaylistAdd,
  TbTrash,
  TbPlus,
} from 'react-icons/tb'
import DaPopup from '../atoms/DaPopup'
import usePermissionHook from '@/hooks/usePermissionHook'
import { PERMISSIONS } from '@/data/permission'
import { useParams } from 'react-router-dom'
import useCurrentModel from '@/hooks/useCurrentModel'
import FormCreateWishlistApi from './forms/FormCreateWishlistApi'
import DaTooltip from '../atoms/DaTooltip'
import DaConfirmPopup from './DaConfirmPopup'
import { deleteExtendedApi } from '@/services/extendedApis.service'

interface DaHierarchicalViewItemProps {
  api: VehicleApi
  onClick: () => void
  isSelected?: boolean
  itemRef?: React.RefObject<HTMLDivElement>
  // extra props for recursion:
  level?: number
  onApiClick?: (api: VehicleApi) => void
  selectedApi?: VehicleApi | null
}

const DaHierarchicalViewItem = ({
  api,
  onClick,
  isSelected,
  itemRef,
  level = 0,
  onApiClick,
  selectedApi,
}: DaHierarchicalViewItemProps) => {
  const { model_id } = useParams()
  const { data: model } = useCurrentModel()
  const { textClass } = getApiTypeClasses(api.type)
  const [isHovered, setIsHovered] = useState(false)
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null)
  // Automatically expand the root (level 0) by default
  const [expanded, setExpanded] = useState(level === 0)
  const [isAuthorized] = usePermissionHook([PERMISSIONS.WRITE_MODEL, model_id])

  // New state to control the wishlist popup (for branch APIs)
  const [isOpenWishlistPopup, setIsOpenWishlistPopup] = useState(false)
  const [confirmPopupOpen, setConfirmPopupOpen] = useState(false)

  // const handleDeleteWishlistApi = async () => {
  //   if (model) {
  //     if (model.api_version && apiDetails?.id) {
  //       await deleteExtendedApi(apiDetails.id)
  //       await refreshModel()
  //     } else if (model.custom_apis) {
  //       const updatedCustomApis = model.custom_apis.filter(
  //         (api: CustomApi) => api.name !== apiDetails.name,
  //       )
  //       try {
  //         setIsLoading(true)
  //         const customApisJson = JSON.stringify(updatedCustomApis)
  //         await updateModelService(model.id, {
  //           custom_apis: customApisJson as any,
  //         })
  //         setIsLoading(false)
  //         await refetch()
  //         navigate(`/model/${model.id}/api/Vehicle`)
  //       } catch (error) {
  //         setIsLoading(false)
  //         console.error('Error deleting wishlist API:', error)
  //       }
  //     }
  //   }
  // }

  const handleMouseEnter = () => {
    const timeout = setTimeout(() => setIsHovered(true), 500)
    setHoverTimeout(timeout)
  }

  const handleMouseLeave = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
    }
    setIsHovered(false)
  }

  // Determine if this API has children
  const hasChildren = api.children && Object.keys(api.children).length > 0

  // Helper: if any descendant of this node is selected, return true.
  const hasDescendantSelected = (node: VehicleApi): boolean => {
    if (!node.children) return false
    return Object.values(node.children).some((child) => {
      if (selectedApi && child.name === selectedApi.name) return true
      return hasDescendantSelected(child)
    })
  }

  // Automatically expand this branch if a descendant is selected.
  useEffect(() => {
    if (!expanded && selectedApi && hasChildren) {
      if (hasDescendantSelected(api)) {
        setExpanded(true)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedApi])

  // Toggle expand/collapse when clicking the chevron.
  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation() // so that clicking the chevron doesn't trigger selection
    setExpanded(!expanded)
  }

  // When clicking the item, use the passed callback.
  const handleClick = () => {
    if (onApiClick) {
      onApiClick(api)
    } else {
      onClick()
    }
  }

  // If this node is the selected one, attach a ref for scrolling into view.
  const internalRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (selectedApi && selectedApi.name === api.name && internalRef.current) {
      internalRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }, [selectedApi, api.name])

  // Display only the last segment (after the dot) of the API name.
  const displayName = api.name.split('.').pop()

  return (
    <>
      <div className="flex">
        {/* Render gutter columns for each indent level */}
        {Array.from({ length: level }).map((_, i) => (
          <div key={i} className="w-8 flex-shrink-0 flex justify-center">
            <div className="w-px bg-gray-200 self-stretch" />
          </div>
        ))}
        <div
          ref={selectedApi?.name === api.name ? internalRef : itemRef}
          className={`flex w-full min-w-0 justify-between py-1.5 text-da-gray-medium cursor-pointer hover:bg-da-primary-100 items-center px-2 rounded ${
            isSelected ? 'bg-da-primary-100 text-da-primary-500' : ''
          }`}
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="flex flex-1 truncate cursor-pointer items-center">
            {hasChildren ? (
              <div onClick={toggleExpand} className="mr-1 cursor-pointer">
                {expanded ? <TbChevronDown /> : <TbChevronRight />}
              </div>
            ) : (
              // Render an empty block for alignment if no children
              <div className="w-5" />
            )}
            <div
              className={`text-[12.5px] cursor-pointer ${
                isSelected ? 'font-bold' : 'font-medium'
              } truncate`}
            >
              {displayName}
            </div>
            {api.isWishlist && (
              <div className="flex font-bold rounded-full w-4 h-4 ml-2 bg-fuchsia-500 text-da-white items-center justify-center text-[9px]">
                W
              </div>
            )}
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
            )}
          </div>
          {/* {api.isWishlist && isHovered && (
            <DaConfirmPopup
              onConfirm={handleDeleteWishlistApi}
              state={[confirmPopupOpen, setConfirmPopupOpen]}
              title="Delete Wishlist Signal"
              label="Are you sure you want to delete this wishlist signal?"
            >
              <TbTrash className="ml-1 size-4 text-da-gray-medium hover:text-red-500" />
            </DaConfirmPopup>
          )} */}
          <div className="flex w-fit justify-end cursor-pointer pl-4">
            <DaText
              variant="small"
              className={textClass + ' uppercase !font-medium cursor-pointer'}
            >
              {api.type}
            </DaText>
          </div>
        </div>
      </div>
      {expanded && hasChildren && (
        <div>
          {Object.entries(api.children || {}).map(
            ([childKey, childApi], index) => (
              <DaHierarchicalViewItem
                key={childApi.uuid || childKey || index}
                api={{ ...childApi }}
                onClick={() => {
                  if (onApiClick) {
                    onApiClick(childApi)
                  }
                }}
                isSelected={selectedApi?.name === childApi.name}
                level={level + 1}
                onApiClick={onApiClick}
                selectedApi={selectedApi}
              />
            ),
          )}
        </div>
      )}

      {/* Render the popup for creating a wishlist signal when the branch icon is clicked */}
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
                onApiClick?.(api)
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

interface DaHierarchicalViewProps {
  apis: VehicleApi[]
  onApiClick?: (api: VehicleApi) => void
  selectedApi?: VehicleApi | null
}

const DaHierarchicalView = ({
  apis,
  onApiClick,
  selectedApi,
}: DaHierarchicalViewProps) => {
  const selectedRef = useRef<HTMLDivElement>(null)
  // For hierarchical view, we assume the tree is in the first API (index 0)
  const root = apis[0]

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
      {root && (
        <DaHierarchicalViewItem
          api={root}
          onClick={() => {
            if (onApiClick) {
              onApiClick(root)
            }
          }}
          isSelected={selectedApi?.name === root.name}
          itemRef={selectedApi?.name === root.name ? selectedRef : undefined}
          onApiClick={onApiClick}
          selectedApi={selectedApi}
        />
      )}
    </div>
  )
}

export { DaHierarchicalView, DaHierarchicalViewItem }
