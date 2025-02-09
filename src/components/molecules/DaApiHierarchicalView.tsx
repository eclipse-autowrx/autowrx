import { useEffect, useRef, useState } from 'react'
import { VehicleApi } from '@/types/model.type'
import { DaText } from '../atoms/DaText'
import { getApiTypeClasses } from '@/lib/utils'
import { DaCopy } from '../atoms/DaCopy'
import { TbChevronRight, TbChevronDown } from 'react-icons/tb'

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
  const { textClass } = getApiTypeClasses(api.type)
  const [isHovered, setIsHovered] = useState(false)
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null)
  // Automatically expand the root (level 0) by default
  const [expanded, setExpanded] = useState(level === 0)

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
              <DaCopy textToCopy={api.name} className="ml-1 w-fit" />
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
