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
import { useSiteConfig } from '@/utils/siteConfig'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '../atoms/context-menu'
import {
  updatePrototypeService,
  deletePrototypeService,
} from '@/services/prototype.service'
import { uploadFileService } from '@/services/upload.service'
import { downloadPrototypeZip } from '@/lib/zipUtils'
import DaImportFile from '../atoms/DaImportFile'
import DaConfirmPopup from './DaConfirmPopup'
import DaDialog from './DaDialog'
import { Button } from '../atoms/button'
import { Input } from '../atoms/input'
import useCurrentModel from '@/hooks/useCurrentModel'
import useListModelPrototypes from '@/hooks/useListModelPrototypes'
import PrototypeTabStaging from '@/components/organisms/PrototypeTabStaging'

interface DaPrototypeItemProps {
  prototype?: Prototype
  className?: string
}

const DaPrototypeItem = ({ prototype, className }: DaPrototypeItemProps) => {
  const { data: user } = useSelfProfileQuery()
  const enableContextMenu = useSiteConfig('PROTOTYPE_ITEM_MENU_CONTEXT', false)
  const { data: model } = useCurrentModel()
  const { data: existingPrototypes, refetch: refetchModelPrototypes } =
    useListModelPrototypes(model?.id || '')
  const navigate = useNavigate()

  // Rename state
  const [renameOpen, setRenameOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Delete state
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Image upload state
  const [isUploading, setIsUploading] = useState(false)

  // Deploy/staging dialog state
  const [deployOpen, setDeployOpen] = useState(false)

  // Track when any dialog was recently closed to suppress navigation clicks
  const suppressClickRef = useRef(false)
  const suppressTimeoutRef = useRef<ReturnType<typeof setTimeout>>()

  const withClickSuppression = useCallback(
    (setter: React.Dispatch<React.SetStateAction<boolean>>) =>
      (value: React.SetStateAction<boolean>) => {
        const resolvedValue = typeof value === 'function' ? value(false) : value
        setter(value)
        if (!resolvedValue) {
          // Dialog is closing — suppress clicks briefly so the overlay dismiss
          // doesn't trigger navigation on the parent wrapper.
          suppressClickRef.current = true
          clearTimeout(suppressTimeoutRef.current)
          suppressTimeoutRef.current = setTimeout(() => {
            suppressClickRef.current = false
          }, 200)
        }
      },
    [],
  )

  const existingPrototypeNames = useMemo(
    () => existingPrototypes?.map((p) => p.name) ?? [],
    [existingPrototypes],
  )

  const { isDuplicate: isDuplicateName, suggestedName } = useDuplicateNameCheck(
    newName,
    existingPrototypeNames,
    prototype?.name,
  )

  const handleRename = async () => {
    if (!prototype || !newName.trim() || isDuplicateName) return
    setIsSaving(true)
    try {
      await updatePrototypeService(prototype.id, { name: newName.trim() })
      await refetchModelPrototypes()
      setRenameOpen(false)
    } catch (error) {
      console.error('Failed to rename prototype:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleImageFileChange = async (file: File) => {
    if (!prototype) return
    // Close the context menu
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )
    setIsUploading(true)
    try {
      const { url } = await uploadFileService(file)
      await updatePrototypeService(prototype.id, { image_file: url })
      await refetchModelPrototypes()
    } catch (error) {
      console.error('Failed to update prototype image:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!prototype) return
    setIsDeleting(true)
    try {
      await deletePrototypeService(prototype.id)
      await refetchModelPrototypes()
      navigate(`/model/${model?.id}/library`)
    } catch (error) {
      console.error('Failed to delete prototype:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const runAfterMenuClose = useCallback((action: () => void) => {
    // Force-close the context menu first to avoid a stuck modal layer.
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )
    // Delay the next layer opening until the context menu has fully closed.
    window.setTimeout(action, 0)
  }, [])

  const cardContent = (
    <div
      className={cn(
        'lg:w-full lg:h-full group bg-background rounded-lg cursor-pointer prototype-grid-item',
        className,
      )}
      data-id={`prototype-item-${prototype?.id ?? ''}`}
      aria-label={`${prototype?.name || 'Unnamed'}`}
      id={prototype?.id ?? ''}
    >
      <div className="flex flex-col items-center space-y-1 text-muted-foreground overflow-hidden">
        <div className="flex w-full h-full relative overflow-hidden rounded-lg">
          {(isUploading || isDeleting) && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-black/40">
              <TbLoader className="size-6 animate-spin text-white" />
            </div>
          )}
          <DaImage
            src={
              prototype?.image_file
                ? prototype.image_file
                : '/imgs/default_prototype_cover.jpg'
            }
            alt="Image"
            className="w-full h-full rounded-lg aspect-video object-cover shadow border"
          />
          <div className="absolute bottom-0 w-full h-[30px] blur-xl bg-black/80 transition-opacity duration-200 ease-in-out opacity-0 group-hover:opacity-100"></div>
          <div className="absolute bottom-0 w-full h-[50px] transition-opacity duration-200 ease-in-out opacity-0 group-hover:opacity-100">
            <div className="flex h-full w-full px-3 items-center justify-between text-white rounded-b-lg ">
              {prototype?.created_by && (
                <div className="flex gap-2 items-center">
                  <Avatar className="h-7 w-7 bg-black/20 backdrop-blur">
                    <AvatarImage src={prototype.created_by?.image_file} />
                    <AvatarFallback>
                      {prototype.created_by?.name?.charAt(0)?.toUpperCase() ||
                        'U'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="line-clamp-1 text-xs mt-1">
                    {prototype.created_by?.name ?? ''}
                  </div>
                </div>
              )}
              <div className="grow"></div>
              {user && !enableContextMenu && (
                <div className="flex w-fit justify-end items-center gap-2 ml-2">
                  <DaTooltip tooltipMessage="View Code" tooltipDelay={300}>
                    <Link
                      to={`/model/${prototype?.model_id}/library/prototype/${prototype?.id}/code`}
                      className="flex"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="p-1 rounded-full bg-white opacity-80 hover:opacity-100">
                        <TbCode className="size-4 text-foreground" />
                      </div>
                    </Link>
                  </DaTooltip>
                  <DaTooltip tooltipMessage="View Dashboard" tooltipDelay={300}>
                    <Link
                      to={`/model/${prototype?.model_id}/library/prototype/${prototype?.id}/dashboard`}
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
        </div>
        <div className="flex items-center w-full space-y-0">
          {user ? (
            <button
              type="button"
              className="flex items-center gap-1 min-w-0 text-left cursor-pointer group/rename"
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                setNewName(prototype?.name ?? '')
                setRenameOpen(true)
              }}
              aria-label="Rename prototype"
            >
              <span className="text-base font-semibold line-clamp-1 text-foreground prototype-grid-item-name">
                {prototype?.name ?? ''}
              </span>
              <TbEdit className="size-4 shrink-0 opacity-0 group-hover:opacity-100 group-hover/rename:opacity-100 pointer-coarse:opacity-100 transition-opacity text-muted-foreground" />
            </button>
          ) : (
            <p className="text-base font-semibold line-clamp-1 text-foreground prototype-grid-item-name">
              {prototype?.name ?? ''}
            </p>
          )}
          <div className="grow"></div>
          {Number(prototype?.executed_turns ?? 0) > 1 && (
            <DaTooltip
              tooltipMessage={`This prototype has been run ${prototype?.executed_turns} times`}
              tooltipDelay={300}
            >
              <div className="flex w-fit items-center text-sm font-semibold mx-2">
                <TbTerminal2 className="size-[18px] mr-1 text-primary" />
                {prototype?.executed_turns}
              </div>
            </DaTooltip>
          )}
          {prototype?.avg_score && (
            <div className="flex w-fit items-center text-sm font-semibold">
              <HiStar className="size-[18px] mr-0.5 text-yellow-500" />
              {prototype?.avg_score.toFixed(1)}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const isAnyDialogOpen = renameOpen || deleteOpen || deployOpen

  if (!user) {
    return cardContent
  }

  return (
    <div
      onClick={(e) => {
        if (isAnyDialogOpen || suppressClickRef.current) {
          e.stopPropagation()
        }
      }}
    >
      {enableContextMenu ? (
        <ContextMenu>
          <ContextMenuTrigger asChild>{cardContent}</ContextMenuTrigger>

          <ContextMenuContent
            className="w-52"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <ContextMenuItem
              className="cursor-pointer"
              onSelect={() => {
                runAfterMenuClose(() => {
                  setNewName(prototype?.name ?? '')
                  setRenameOpen(true)
                })
              }}
            >
              <TbEdit className="mr-2 size-4" />
              Rename
            </ContextMenuItem>
            <ContextMenuItem
              className="cursor-pointer p-0!"
              onSelect={(e) => e.preventDefault()}
            >
              <DaImportFile
                onFileChange={handleImageFileChange}
                accept=".png,.jpg,.jpeg,.gif,.webp"
                className="flex w-full items-center px-2 py-1.5 text-sm cursor-pointer"
              >
                <TbPhotoEdit className="mr-2 size-4" />
                Update Image
              </DaImportFile>
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              className="cursor-pointer"
              onSelect={() => runAfterMenuClose(() => setDeployOpen(true))}
            >
              <TbCloudDown className="mr-2 size-4" />
              Deploy
            </ContextMenuItem>
            <ContextMenuItem
              className="cursor-pointer"
              onSelect={() =>
                runAfterMenuClose(() => {
                  if (prototype) {
                    downloadPrototypeZip(prototype)
                  }
                })
              }
            >
              <TbDownload className="mr-2 size-4" />
              Export Prototype
            </ContextMenuItem>
            <ContextMenuItem
              className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
              onSelect={() => runAfterMenuClose(() => setDeleteOpen(true))}
            >
              <TbTrashX className="mr-2 size-4" />
              Delete Prototype
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      ) : (
        cardContent
      )}

      {/* Rename dialog — available via both pencil icon and context menu */}
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

      {enableContextMenu && (
        <>
          {/* Deploy / Staging dialog */}
          <DaDialog
            open={deployOpen}
            onOpenChange={withClickSuppression(setDeployOpen)}
            dialogTitle={`Deploy - ${prototype?.name ?? 'Prototype'}`}
            className="max-w-[95vw] w-[1200px]"
          >
            <div className="flex overflow-y-auto max-h-[80vh]">
              {prototype && <PrototypeTabStaging prototype={prototype} />}
            </div>
          </DaDialog>

          {/* Delete confirm dialog */}
          <DaConfirmPopup
            onConfirm={handleDelete}
            title="Delete Prototype"
            label="This action cannot be undone and will delete all prototype data. Please proceed with caution."
            confirmText={prototype?.name}
            state={[deleteOpen, withClickSuppression(setDeleteOpen)]}
          >
            <span />
          </DaConfirmPopup>
        </>
      )}
    </div>
  )
}

export { DaPrototypeItem }
