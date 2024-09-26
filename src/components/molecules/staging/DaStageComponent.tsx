import { useEffect, useState } from 'react'
import { IoIosArrowForward } from 'react-icons/io'
import { IoIosArrowDown } from 'react-icons/io'
import { BsDot } from 'react-icons/bs'
import { cn } from '@/lib/utils'
import { CiEdit } from 'react-icons/ci'
import { DaButton } from '@/components/atoms/DaButton'
import { IoSaveOutline } from 'react-icons/io5'
import { MdOutlineCancel } from 'react-icons/md'
import { DaInput } from '@/components/atoms/DaInput'

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
  onItemEditFinished,
  onRequestUpdate,
}: DaStageComponentProps) => {
  const [isEpanded, setIsExpanded] = useState<boolean>(false)
  const [inEditMode, setInEditMode] = useState<boolean>(false)
  const [editVersion, setEditVersion] = useState<string>(item.version || '')

  const COOK_ID = '3.1.1.1.1.1'

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
                {!isEpanded && (
                  <IoIosArrowForward
                    className="cursor-pointer mr-2"
                    size={20}
                    onClick={() => {
                      setIsExpanded(true)
                    }}
                  />
                )}
                {isEpanded && (
                  <IoIosArrowDown
                    className="cursor-pointer mr-2"
                    size={20}
                    onClick={() => {
                      setIsExpanded(false)
                    }}
                  />
                )}
              </>
            ) : (
              <BsDot size={20} className="mr-2"></BsDot>
            )}
            {item.id == COOK_ID
              ? `Subscription ${prototype?.name || 'Event Analyzer'}`
              : item.name}
          </div>
          <div className="h-full px-2 flex items-center justify-center w-24 border-l">
            {!inEditMode && (item.version || '')}
            {inEditMode && (
              <input
                className={cn(
                  ` grow bg-da-white rounded flex px-2 py-1 h-6 w-full
                          placeholder:text-da-gray-dark
                          focus-visible:ring-0 focus-visible:outline-none
                          border border-da-gray-medium
                          disabled:cursor-not-allowed`,
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
                      onClick={() => {
                        setInEditMode(true)
                      }}
                    />
                  )}
                  {inEditMode && (
                    <>
                      <MdOutlineCancel
                        size={24}
                        className="cursor-pointer hover:opacity-50"
                        onClick={() => {
                          setInEditMode(false)
                        }}
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
      {(isEpanded || item.isTopMost) &&
        item.children.map((it: any, index: number) => (
          <DaStageComponent
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
            key={index}
            item={it}
          />
        ))}
    </>
  )
}

export default DaStageComponent
