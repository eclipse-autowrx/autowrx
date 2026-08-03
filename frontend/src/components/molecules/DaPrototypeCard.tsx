// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import * as React from 'react'
import { useState, useRef, useCallback, useMemo } from 'react'
import DaDuplicateNameHint from '@/components/atoms/DaDuplicateNameHint'
import useDuplicateNameCheck from '@/hooks/useDuplicateNameCheck'
import { DaImage } from '../atoms/DaImage'
import { cn } from '@/lib/utils'
import { Prototype } from '@/types/model.type'
import { HiStar } from 'react-icons/hi'
import {
  TbCloudDown,
  TbCode,
  TbDotsVertical,
  TbDownload,
  TbEdit,
  TbGauge,
  TbLoader,
  TbPhotoEdit,
  TbTerminal2,
  TbTrashX,
} from 'react-icons/tb'
import { Avatar, AvatarFallback, AvatarImage } from '../atoms/avatar'
import { Link, useNavigate } from 'react-router-dom'
import DaTooltip from './DaTooltip'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import useCanEditPrototype from '@/hooks/useCanEditPrototype'
import { useSiteConfig, useDefaultPrototypeImage } from '@/utils/siteConfig'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '../atoms/context-menu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../atoms/dropdown-menu'
import { updatePrototypeService, deletePrototypeService } from '@/services/prototype.service'
import { uploadFileService } from '@/services/upload.service'
import { downloadPrototypeZip } from '@/lib/zipUtils'
import DaImportFile from '../atoms/DaImportFile'
import DaConfirmPopup from './DaConfirmPopup'
import DaDialog from './DaDialog'
import { Button } from '../atoms/button'
import { Input } from '../atoms/input'
import PrototypeTabStaging from '@/components/organisms/PrototypeTabStaging'
import { useToast } from '@/components/molecules/toaster/use-toast'
import { Skeleton } from '../atoms/skeleton'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useListModelPrototypes } from '@/hooks/usePrototypeQueries'

export interface DaPrototypeCardProps {
  prototype: Prototype
  className?: string
  variant?: 'default' | 'home'
  onUpdate?: () => void
  existingPrototypeNames?: string[]
  showCreatorOverlay?: boolean
  showStats?: boolean
}

export const DaPrototypeCard = ({
  prototype,
  className,
  variant = 'default',
  onUpdate,
  existingPrototypeNames: existingPrototypeNamesProp,
  showCreatorOverlay = true,
  showStats = true,
}: DaPrototypeCardProps) => {
  const { data: user } = useSelfProfileQuery()
  const enableContextMenu = useSiteConfig('PROTOTYPE_ITEM_MENU_CONTEXT', false)
  const defaultPrototypeImage = useDefaultPrototypeImage()
  const queryClient = useQueryClient()
  const deletePrototype = useMutation({
    mutationFn: (id: string) => deletePrototypeService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listModelPrototypes'] })
    },
  })
  const navigate = useNavigate()
  const { toast } = useToast()

  const canEditPrototype = useCanEditPrototype(prototype)
  const isOwner = canEditPrototype
  const isPrototypeOwner = canEditPrototype
  const isDeployDisabled = !prototype.code || !prototype.code.trim()

  const [renameOpen, setRenameOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [deployOpen, setDeployOpen] = useState(false)
  const [dotsMenuOpen, setDotsMenuOpen] = useState(false)

  const suppressClickRef = useRef(false)
  const suppressTimeoutRef = useRef<ReturnType<typeof setTimeout>>()

  const withClickSuppression = useCallback(
    (setter: React.Dispatch<React.SetStateAction<boolean>>) =>
      (value: React.SetStateAction<boolean>) => {
        const resolvedValue = typeof value === 'function' ? value(false) : value
        setter(value)
        if (!resolvedValue) {
          suppressClickRef.current = true
          clearTimeout(suppressTimeoutRef.current)
          suppressTimeoutRef.current = setTimeout(() => {
            suppressClickRef.current = false
          }, 200)
        }
      },
    [],
  )

  const { data: siblingPrototypes } = useListModelPrototypes(
    prototype.model_id || '',
    {
      enabled: renameOpen && !existingPrototypeNamesProp,
    },
  )

  const existingPrototypeNames = useMemo(() => {
    if (existingPrototypeNamesProp) return existingPrototypeNamesProp
    return (
      siblingPrototypes
        ?.filter((p) => p.id !== prototype.id)
        .map((p) => p.name) ?? []
    )
  }, [existingPrototypeNamesProp, siblingPrototypes, prototype.id])

  const invalidatePrototypeQueries = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: ['listModelPrototypes', prototype.model_id || ''],
    })
  }, [queryClient, prototype.model_id])

  const { isDuplicate: isDuplicateName, suggestedName } = useDuplicateNameCheck(
    newName,
    existingPrototypeNames,
    prototype?.name,
  )

  const handleRename = async () => {
    if (!newName.trim() || isDuplicateName) return
    setIsSaving(true)
    try {
      await updatePrototypeService(prototype.id, { name: newName.trim() })
      await invalidatePrototypeQueries()
      onUpdate?.()
      setRenameOpen(false)
    } catch (error) {
      console.error('Failed to rename prototype:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleImageFileChange = async (file: File) => {
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )
    setIsUploading(true)
    try {
      const { url } = await uploadFileService(file)
      await updatePrototypeService(prototype.id, { image_file: url })
      await invalidatePrototypeQueries()
      onUpdate?.()
    } catch (error) {
      console.error('Failed to update prototype image:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async () => {
    try {
      await deletePrototype.mutateAsync(prototype.id)
      if (variant !== 'home')
        navigate(`/model/${prototype.model_id}/library`)
    } catch (error) {
      console.error('Failed to delete prototype:', error)
    }
  }

  const runAfterMenuClose = useCallback((action: () => void) => {
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )
    window.setTimeout(action, 0)
  }, [])

  const runAfterDropdownClose = useCallback((action: () => void) => {
    setDotsMenuOpen(false)
    window.setTimeout(action, 0)
  }, [])

  const renderMenuItems = (
    MenuItem: React.ComponentType<any>,
    MenuSeparator: React.ComponentType<any>,
    wrapAction: (action: () => void) => void,
  ) => (
    <>
      <MenuItem
        className="cursor-pointer gap-2"
        onSelect={() =>
          wrapAction(() => {
            setNewName(prototype.name ?? '')
            setRenameOpen(true)
          })
        }
      >
        <TbEdit className="size-4" />
        Rename
      </MenuItem>
      <MenuItem
        className="cursor-pointer p-0!"
        onSelect={(e: Event) => e.preventDefault()}
      >
        <DaImportFile
          onFileChange={handleImageFileChange}
          accept=".png,.jpg,.jpeg,.gif,.webp"
          className="flex w-full items-center gap-2 px-2 py-1.5 text-sm cursor-pointer"
        >
          <TbPhotoEdit className="size-4 shrink-0" />
          Update Image
        </DaImportFile>
      </MenuItem>
      <MenuSeparator />
      <MenuItem
        className="cursor-pointer gap-2"
        disabled={!prototype.code || !prototype.code.trim()}
        onSelect={() => wrapAction(() => setDeployOpen(true))}
      >
        <TbCloudDown className="size-4" />
        Deploy
      </MenuItem>
      <MenuItem
        className="cursor-pointer gap-2"
        onSelect={() =>
          wrapAction(() => {
            downloadPrototypeZip(prototype)
          })
        }
      >
        <TbDownload className="size-4" />
        Export Prototype
      </MenuItem>
      <MenuItem
        className="cursor-pointer gap-2 text-red-600 focus:text-red-600 focus:bg-red-50"
        onSelect={() => wrapAction(() => setDeleteOpen(true))}
      >
        <TbTrashX className="size-4" />
        Delete Prototype
      </MenuItem>
    </>
  )

  const cardContent = (
    <div
      className={cn(
        'lg:w-full lg:h-full group rounded-xl cursor-pointer prototype-grid-item bg-white p-3 border',
        className,
      )}
      data-id={`prototype-item-${prototype.id}`}
      aria-label={prototype.name || 'Unnamed'}
      id={prototype.id}
    >
      <div className="flex flex-col items-center space-y-1 text-muted-foreground overflow-hidden">
        <div className="flex w-full h-full relative overflow-hidden aspect-video rounded-lg">
          {(isUploading || deletePrototype.isPending) && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-black/40">
              <TbLoader className="size-6 animate-spin text-white" />
            </div>
          )}
          <DaImage
            src={prototype.image_file}
            fallbackSrc={defaultPrototypeImage}
            alt={prototype.name || 'Prototype'}
            className="w-full h-full rounded-lg aspect-video object-cover shadow border"
          />
          {showCreatorOverlay && (
            <>
              <div className="absolute bottom-0 w-full h-[30px] blur-xl bg-black/80 transition-opacity duration-200 ease-in-out opacity-0 group-hover:opacity-100" />
              <div className="absolute bottom-0 w-full h-[50px] transition-opacity duration-200 ease-in-out opacity-0 group-hover:opacity-100">
                <div className="flex h-full w-full px-3 items-center justify-between text-white rounded-b-lg">
                  {prototype.created_by && (
                    <div className="flex gap-2 items-center">
                      <Avatar className="h-7 w-7 bg-black/20 backdrop-blur">
                        <AvatarImage src={prototype.created_by.image_file} />
                        <AvatarFallback>
                          {prototype.created_by.name?.charAt(0)?.toUpperCase() ||
                            'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="line-clamp-1 text-xs mt-1">
                        {prototype.created_by.name ?? ''}
                      </div>
                    </div>
                  )}
                  <div className="grow" />
                  {user && !isOwner && !enableContextMenu && (
                    <div className="flex w-fit justify-end items-center gap-2 ml-2">
                      <DaTooltip tooltipMessage="View Code" tooltipDelay={300}>
                        <Link
                          to={`/model/${prototype.model_id}/library/prototype/${prototype.id}/code`}
                          className="flex"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="p-1 rounded-full bg-white opacity-80 hover:opacity-100">
                            <TbCode className="size-4 text-foreground" />
                          </div>
                        </Link>
                      </DaTooltip>
                      <DaTooltip
                        tooltipMessage="View Dashboard"
                        tooltipDelay={300}
                      >
                        <Link
                          to={`/model/${prototype.model_id}/library/prototype/${prototype.id}/dashboard`}
                          className="flex"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="p-1 rounded-full bg-white opacity-80 hover:opacity-100">
                            <TbGauge className="size-4 text-foreground" />
                          </div>
                        </Link>
                      </DaTooltip>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center w-full space-y-0">
          <p className="text-base font-semibold line-clamp-1 text-foreground prototype-grid-item-name min-w-0 text-ellipsis">
            {prototype.name ?? ''}
          </p>
          <div className="grow" />
          {showStats && (
            <div className="flex items-center gap-1">
              {Number(prototype.executed_turns ?? 0) > 0 && (
                <DaTooltip
                  tooltipMessage={`This prototype has been run ${prototype.executed_turns} times`}
                  tooltipDelay={300}
                >
                  <div className="flex w-fit items-center text-sm font-semibold mx-2">
                    <TbTerminal2 className="size-[18px] mr-1 text-primary" />
                    {prototype.executed_turns}
                  </div>
                </DaTooltip>
              )}
              {prototype.avg_score != null && (
                <div className="flex w-fit items-center text-sm font-semibold mr-1">
                  <HiStar className="size-[18px] mr-0.5 text-yellow-500" />
                  {prototype.avg_score.toFixed(1)}
                </div>
              )}
              <DaTooltip
                tooltipMessage={
                  isDeployDisabled ? 'Add code to deploy' : 'Deploy'
                }
                tooltipDelay={300}
              >
                <span className="inline-flex">
                  <button
                    type="button"
                    tabIndex={-1}
                    disabled={isDeployDisabled}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setDeployOpen(true)
                    }}
                    className="inline-flex items-center justify-center p-1 rounded-md cursor-pointer text-muted-foreground border border-transparent hover:border-[#7B838B] transition-colors focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
                    aria-label="Deploy prototype"
                  >
                    <TbCloudDown className="size-4" />
                  </button>
                </span>
              </DaTooltip>
              <DropdownMenu open={dotsMenuOpen} onOpenChange={setDotsMenuOpen}>
                <DropdownMenuTrigger asChild disabled={!isPrototypeOwner}>
                  <button
                    title="Menu"
                    type="button"
                    tabIndex={-1}
                    disabled={!isPrototypeOwner}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    className="p-1 rounded-md shrink-0 cursor-pointer text-muted-foreground border border-transparent hover:border-[#7B838B] active:bg-gray-300 transition-all duration-150 focus-visible:outline-none disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
                    aria-label="Prototype actions"
                  >
                    <TbDotsVertical className="size-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-52"
                  align="end"
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  {renderMenuItems(
                    DropdownMenuItem,
                    DropdownMenuSeparator,
                    runAfterDropdownClose,
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const isAnyDialogOpen =
    renameOpen || deleteOpen || deployOpen || dotsMenuOpen

  if (!user) {
    return cardContent
  }

  return (
    <div
      className="overflow-hidden"
      onClick={(e) => {
        if (isAnyDialogOpen || suppressClickRef.current) {
          e.stopPropagation()
        }
      }}
    >
      {enableContextMenu && isOwner ? (
        <ContextMenu>
          <ContextMenuTrigger asChild>{cardContent}</ContextMenuTrigger>
          <ContextMenuContent
            className="w-52"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {renderMenuItems(
              ContextMenuItem,
              ContextMenuSeparator,
              runAfterMenuClose,
            )}
          </ContextMenuContent>
        </ContextMenu>
      ) : enableContextMenu ? (
        <div
          onContextMenu={(e) => {
            e.preventDefault()
            toast({
              title: 'Permission denied',
              description: `You do not have permission to edit "${prototype.name ?? 'this prototype'}".`,
              duration: 3000,
            })
          }}
        >
          {cardContent}
        </div>
      ) : (
        cardContent
      )}

      <DaDialog
        open={renameOpen}
        onOpenChange={withClickSuppression(setRenameOpen)}
        dialogTitle="Rename Prototype"
      >
        <div className="flex flex-col gap-4">
          <div>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              placeholder="Prototype name"
            />
            {isDuplicateName && (
              <DaDuplicateNameHint
                message="A prototype with this name already exists"
                suggestedName={suggestedName}
                onApplySuggestion={setNewName}
              />
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRenameOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleRename}
              disabled={isSaving || !newName.trim() || isDuplicateName}
            >
              {isSaving ? (
                <TbLoader className="mr-1 size-4 animate-spin" />
              ) : null}
              Save
            </Button>
          </div>
        </div>
      </DaDialog>

      <DaDialog
        open={deployOpen}
        onOpenChange={withClickSuppression(setDeployOpen)}
        dialogTitle="Deploy"
        className="max-w-[95vw] w-[1200px]"
      >
        <div className="flex overflow-y-auto max-h-[80vh]">
          <PrototypeTabStaging prototype={prototype} />
        </div>
      </DaDialog>

      {isOwner && (
        <DaConfirmPopup
          onConfirm={handleDelete}
          title="Delete Prototype"
          label="This action cannot be undone and will delete all prototype data. Please proceed with caution."
          confirmText={prototype.name}
          state={[deleteOpen, withClickSuppression(setDeleteOpen)]}
        >
          <span />
        </DaConfirmPopup>
      )}
    </div>
  )
}

export const DaPrototypeCardSkeleton = ({
  className,
}: {
  className?: string
}) => (
  <div
    className={cn(
      'lg:w-full lg:h-full rounded-xl bg-white p-3 border',
      className,
    )}
  >
    <div className="flex flex-col items-center space-y-1 text-muted-foreground overflow-hidden">
      <Skeleton className="w-full aspect-video rounded-lg" />
      <div className="flex items-center w-full space-y-0">
        <Skeleton className="h-6 w-3/5 rounded-md" />
      </div>
    </div>
  </div>
)
