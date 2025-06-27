import React, { useRef, useState } from 'react'
import { Node, NodeProps, Handle, Position } from '@xyflow/react'
import { TbEdit, TbTrash, TbX } from 'react-icons/tb'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/atoms/dropdown-menu'
import { DaButton } from '@/components/atoms/DaButton'
import usePermissionHook from '@/hooks/usePermissionHook'
import { PERMISSIONS } from '@/data/permission'
import useCurrentModel from '@/hooks/useCurrentModel'
import { cn } from '@/lib/utils'
import { useRequirementStore } from '../hook/useRequirementStore'

type RequirementNodeData = {
  id: string
  label: string
  title: string
  description?: string
  type?: string
  ratingAvg: number
  rating?: {
    priority?: number
    relevance?: number
    impact?: number
  }
  source?: {
    type: string
    link?: string
  }
  creatorUserId?: string
  childRequirements?: string[]
  color?: string
  showHandles?: boolean
  handlePositions?: string[]
  onEdit?: (id: string) => void
  requirement?: any
  onDelete?: (id: string) => void
}

type RequirementNodeType = Node<RequirementNodeData>

function RequirementNode({
  data,
  isConnectable,
}: NodeProps<RequirementNodeType>) {
  const { data: model } = useCurrentModel()
  const [isAuthorized] = usePermissionHook([PERMISSIONS.READ_MODEL, model?.id])
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const { isScanning } = useRequirementStore()

  const requirement = data.requirement || data

  const ratingAvg = data.ratingAvg || 3
  const baseSize = 15
  const size = baseSize + ratingAvg * 6

  const handleCloseDropdown = (e: React.MouseEvent) => {
    e.stopPropagation()
    setOpen(false)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    data.onDelete?.(data.id)
    setOpen(false)
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (data.onEdit) {
      data.onEdit(data.id)
    }
    setOpen(false)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <div
          className={cn(
            'relative flex flex-col items-center justify-center w-full h-full cursor-pointer',
            isScanning && 'animate-pulse',
          )}
          onClick={(e) => {
            e.stopPropagation()
            console.log('Node clicked')
          }}
        >
          <div
            className="rounded-full flex justify-center items-center p-[10px] text-center text-xs font-bold shadow-md transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg text-white"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: data.color || '#3b82f6',
            }}
          />
          <p
            className="absolute w-[200px] whitespace-nowrap overflow-hidden text-ellipsis text-center mt-4 text-xs font-medium"
            style={{ top: `${size}px` }}
            title={data.title}
          >
            {data.title}
          </p>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        ref={dropdownRef}
        className="flex flex-col text-xs bg-white p-3 -my-2 border rounded-lg overflow-y-auto max-h-[50vh] min-w-[250px] w-[500px] z-[9999]"
        side="right"
        align="start"
        onEscapeKeyDown={() => setOpen(false)}
        onPointerDownOutside={() => setOpen(false)}
      >
        <div className="flex justify-between items-center mb-2">
          <div className="flex text-sm font-bold text-da-primary-500">
            Requirement Details
          </div>
          <div className="flex items-center space-x-1">
            {isAuthorized && (
              <>
                <DaButton
                  size="sm"
                  variant="editor"
                  className="flex ml-1 !h-6 !p-2 !text-xs"
                  onClick={handleEdit}
                >
                  <TbEdit className="size-3.5 mr-1" /> Edit
                </DaButton>
                <DaButton
                  size="sm"
                  variant="destructive"
                  className="flex ml-1 !h-6 !p-2 !text-xs"
                  onClick={handleDelete}
                >
                  <TbTrash className="size-3.5 mr-1" /> Delete
                </DaButton>
              </>
            )}

            <button
              className="p-0.5 hover:text-red-500 hover:bg-red-100 rounded-md"
              onClick={handleCloseDropdown}
            >
              <TbX className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-col h-full overflow-y-auto scroll-gray">
          <div className="flex flex-col space-y-1.5">
            {data.id && (
              <div className="flex">
                <span className="font-semibold text-da-gray-dark mr-1">
                  ID:
                </span>
                <span>{data.id}</span>
              </div>
            )}

            <div className="flex">
              <span className="font-semibold text-da-gray-dark mr-1">
                Title:
              </span>
              <span>{data.title}</span>
            </div>

            {requirement.type && (
              <div className="flex">
                <span className="font-semibold text-da-gray-dark mr-1">
                  Type:
                </span>
                <span>{requirement.type}</span>
              </div>
            )}

            {requirement.description && (
              <div className="flex flex-col">
                <span className="font-semibold text-da-gray-dark">
                  Description:
                </span>
                <span className="mt-1 ml-4">{requirement.description}</span>
              </div>
            )}

            {requirement.source && (
              <div className="flex flex-col">
                <span className="font-semibold text-da-gray-dark">Source:</span>
                <div className="flex  space-x-3 mt-1 ml-4">
                  <div className="capitalize">
                    Type: {requirement.source.type}
                  </div>
                  {requirement.source.link && (
                    <div>
                      Link:{' '}
                      <a
                        href={requirement.source.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-blue-500"
                      >
                        {requirement.source.link}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {requirement.rating && (
              <div className="flex flex-col">
                <span className="font-semibold text-da-gray-dark">Rating:</span>
                <div className="flex space-x-6 mt-1 ml-4">
                  {requirement.rating.priority !== undefined && (
                    <div>Priority: {requirement.rating.priority}/5</div>
                  )}
                  {requirement.rating.relevance !== undefined && (
                    <div>Relevance: {requirement.rating.relevance}/5</div>
                  )}
                  {requirement.rating.impact !== undefined && (
                    <div>Impact: {requirement.rating.impact}/5</div>
                  )}
                </div>
              </div>
            )}

            {requirement.creatorUserId && (
              <div className="flex">
                <span className="font-semibold text-da-gray-dark mr-1">
                  Creator:
                </span>
                <span>{requirement.creatorUserId}</span>
              </div>
            )}

            {requirement.childRequirements &&
              requirement.childRequirements.length > 0 && (
                <div className="flex flex-col">
                  <span className="font-semibold text-da-gray-dark">
                    Child Requirements:
                  </span>
                  <div className="mt-1 ml-4">
                    {requirement.childRequirements.map(
                      (child: string, index: number) => (
                        <div key={index}>{child}</div>
                      ),
                    )}
                  </div>
                </div>
              )}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default RequirementNode
