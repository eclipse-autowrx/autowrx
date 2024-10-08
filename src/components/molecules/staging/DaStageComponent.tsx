import { useEffect, useState } from 'react'
import { IoIosArrowForward, IoIosArrowDown } from 'react-icons/io'
import { BsDot } from 'react-icons/bs'
import { cn } from '@/lib/utils'
import { CiEdit } from 'react-icons/ci'
import { IoSaveOutline } from 'react-icons/io5'
import { MdOutlineCancel } from 'react-icons/md'

interface DaStageComponentProps {
  id: string
  activeId: string
  onTargetMode: boolean
  editMode: boolean
  targetState: any
  item: any
  className?: string
  prototype: any
  level: number
  isUpdating: boolean
  isTargetConnected: boolean
  expandedIds?: string[] // NEW PROP to control expanded items
  onItemEditFinished?: (id: string, data: string) => void
  onRequestUpdate?: (id: string, data: string) => void
}

const DaStageComponent = ({
  id,
  prototype,
  isTargetConnected,
  activeId,
  isUpdating,
  onTargetMode,
  targetState,
  editMode,
  item,
  className,
  level,
  expandedIds = [], // Default to an empty array
  onItemEditFinished,
  onRequestUpdate,
}: DaStageComponentProps) => {
  // Initialize expansion state based on whether the item's id is in expandedIds
  const [isExpanded, setIsExpanded] = useState<boolean>(
    expandedIds.includes(item.id), // Check if the item should be expanded by default
  )
  const [inEditMode, setInEditMode] = useState<boolean>(false)
  const [editVersion, setEditVersion] = useState<string>(item.version || '')

  return (
    <>
      {!item.isTopMost && (
        <div className={cn('h-[32px] w-full border-b flex', className)}>
          <div className={`h-full grow flex items-center`}>
            <div className="w-2"></div>
            {[...Array(level)].map((x, i) => (
              <div key={i} className="w-8" />
            ))}
            {item.children && item.children.length > 0 ? (
              <>
                {!isExpanded && (
                  <IoIosArrowForward
                    className="cursor-pointer mr-2"
                    size={20}
                    onClick={() => setIsExpanded(true)} // Toggle expansion
                  />
                )}
                {isExpanded && (
                  <IoIosArrowDown
                    className="cursor-pointer mr-2"
                    size={20}
                    onClick={() => setIsExpanded(false)} // Toggle collapse
                  />
                )}
              </>
            ) : (
              <BsDot size={20} className="mr-2"></BsDot>
            )}
            {item.name}
          </div>

          <div className="h-full px-2 flex items-center justify-center w-24 border-l">
            {!inEditMode && (item.version || '')}
            {inEditMode && (
              <input
                className={cn(
                  `grow bg-da-white rounded flex px-2 py-1 h-6 w-full placeholder:text-da-gray-dark focus-visible:ring-0 focus-visible:outline-none border border-da-gray-medium disabled:cursor-not-allowed`,
                )}
                value={editVersion}
                onChange={(e) => setEditVersion(e.target.value)}
                onKeyPress={(event) => {
                  if (event.key === 'Enter') {
                    if (editVersion.trim().length > 0) {
                      if (onItemEditFinished) {
                        onItemEditFinished(item.id, editVersion.trim())
                      }
                      setInEditMode(false)
                    }
                  }
                }}
              />
            )}
          </div>

          {!onTargetMode && (
            <div className="h-full px-2 flex items-center justify-center w-24 border-l">
              {item.version && (
                <>
                  {!inEditMode && (
                    <CiEdit
                      size={26}
                      className="cursor-pointer hover:opacity-50"
                      onClick={() => setInEditMode(true)}
                    />
                  )}
                  {inEditMode && (
                    <>
                      <MdOutlineCancel
                        size={24}
                        className="cursor-pointer hover:opacity-50"
                        onClick={() => setInEditMode(false)}
                      />
                      <IoSaveOutline
                        size={24}
                        className={cn(
                          'ml-4 cursor-pointer hover:opacity-50',
                          editVersion.trim().length < 0 && 'text-da-gray-light',
                        )}
                        onClick={() => {
                          if (editVersion.trim().length < 0) {
                            return
                          }
                          if (onItemEditFinished) {
                            onItemEditFinished(item.id, editVersion.trim())
                          }
                          setInEditMode(false)
                        }}
                      />
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {onTargetMode && (
            <>
              <div className="h-full px-2 flex items-center justify-center w-24 border-l">
                {isTargetConnected &&
                  item.version &&
                  targetState &&
                  targetState[item.id] &&
                  item.version !== targetState[item.id] && (
                    <>
                      {isUpdating && activeId == item.id && (
                        <div>Updating...</div>
                      )}
                      {!isUpdating && (
                        <button
                          className="rounded px-2 py-0 da-btn-solid"
                          onClick={() => {
                            if (onRequestUpdate) {
                              onRequestUpdate(item.id, item.version)
                            }
                          }}
                        >
                          Update
                        </button>
                      )}
                    </>
                  )}
              </div>
              <div className="h-full px-2 flex items-center justify-center w-24 border-l">
                {isTargetConnected && (
                  <>
                    {item.version &&
                      targetState &&
                      item.version != targetState[item.id] && (
                        <span className="font-bold text-red-500">
                          {targetState[item.id]}
                        </span>
                      )}
                    {item.version &&
                      targetState &&
                      (!targetState[item.id] ||
                        item.version == targetState[item.id]) && (
                        <span className="">{item.version}</span>
                      )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Recursively render child components */}
      {(isExpanded || item.isTopMost) &&
        item.children.map((it: any, index: number) => (
          <DaStageComponent
            key={index}
            prototype={prototype}
            onTargetMode={onTargetMode}
            onItemEditFinished={onItemEditFinished}
            onRequestUpdate={onRequestUpdate}
            targetState={targetState}
            isUpdating={isUpdating}
            isTargetConnected={isTargetConnected}
            id={item.id}
            activeId={activeId}
            level={level + 1}
            editMode={editMode}
            className=""
            item={it}
            expandedIds={expandedIds} // Pass down expandedIds to child components
          />
        ))}
    </>
  )
}

export default DaStageComponent
