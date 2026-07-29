// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useState, useMemo, useEffect, useRef } from "react"
import { useAssets } from '@/hooks/useAssets'
import { IoClose } from "react-icons/io5";
import { TbTrash, TbShare, TbPencil } from "react-icons/tb"
import { Input } from "@/components/atoms/input";
import { Button } from "@/components/atoms/button";
import ShareAssetPanel from "@/components/molecules/ShareAssetPanel";
import DaDialog from "@/components/molecules/DaDialog";
import DaConfirmPopup from "@/components/molecules/DaConfirmPopup";
import { Spinner } from "@/components/atoms/spinner";
import { useToast } from "@/components/molecules/toaster/use-toast";

interface iPropRuntimeAssetManager {
    onClose: () => void,
    open?: boolean,
}

const RuntimeAssetManager = ({ onClose, open = true }: iPropRuntimeAssetManager) => {
    const { useFetchAssets, deleteAsset, createAsset, updateAsset } = useAssets()
    const { data: assets, isLoading } = useFetchAssets()
    const { toast } = useToast()
    const myRuntimes = useMemo(
        () => assets?.filter((a: any) => a.type === 'CLOUD_RUNTIME') ?? [],
        [assets],
    )
    const [activeAsset, setActiveAsset] = useState<any>()
    const [assetToDelete, setAssetToDelete] = useState<any>()
    const [newRtName, setNewRtName] = useState<string>("Runtime-")
    const [shareDialogOpen, setShareDialogOpen] = useState<boolean>(false)
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState<boolean>(false)
    const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false)
    const [assetToEdit, setAssetToEdit] = useState<any>()
    const [editRuntimeCode, setEditRuntimeCode] = useState<string>('')
    const runtimeCodeInputRef = useRef<HTMLInputElement>(null)

    const isAdding = createAsset.isPending
    const isDeleting = deleteAsset.isPending
    const isUpdating = updateAsset.isPending
    const actionsDisabled = isDeleting || isUpdating || editDialogOpen
    const canSaveEdit =
        editRuntimeCode.trim().length > 0 &&
        editRuntimeCode.trim() !== assetToEdit?.name &&
        !isUpdating

    useEffect(() => {
        if (open) return

        setNewRtName('Runtime-')
        setActiveAsset(undefined)
        setAssetToDelete(undefined)
        setShareDialogOpen(false)
        setConfirmDeleteOpen(false)
        setEditDialogOpen(false)
        setAssetToEdit(undefined)
        setEditRuntimeCode('')
    }, [open])

    useEffect(() => {
        if (!open || shareDialogOpen || confirmDeleteOpen || editDialogOpen) return

        const timer = window.setTimeout(() => {
            runtimeCodeInputRef.current?.focus()
        }, 0)

        return () => window.clearTimeout(timer)
    }, [open, shareDialogOpen, confirmDeleteOpen, editDialogOpen])

    useEffect(() => {
        if (!confirmDeleteOpen) {
            setAssetToDelete(undefined)
        }
    }, [confirmDeleteOpen])

    const handleAddRuntime = async () => {
        const runtimeName = newRtName.trim()
        if (!runtimeName) return

        try {
            await createAsset.mutateAsync({
                name: runtimeName,
                type: 'CLOUD_RUNTIME',
                data: '{}',
            })
            setNewRtName('Runtime-')
            runtimeCodeInputRef.current?.focus()
            toast({
                title: 'Runtime added',
                description: `"${runtimeName}" was added to your assets.`,
                duration: 3000,
            })
        } catch (err) {
            console.error('Error creating asset:', err)
            toast({
                title: 'Failed to add runtime',
                description: (
                    <span className="text-sm text-red-500">
                        Could not add the runtime. Please try again.
                    </span>
                ),
                duration: 3000,
            })
        }
    }

    const handleOpenEdit = (asset: any) => {
        setAssetToEdit(asset)
        setEditRuntimeCode(asset.name ?? '')
        setEditDialogOpen(true)
    }

    const handleSaveEdit = async () => {
        const runtimeCode = editRuntimeCode.trim()
        if (!runtimeCode || !assetToEdit?.id) return

        const previousName = assetToEdit.name
        try {
            await updateAsset.mutateAsync({
                id: assetToEdit.id,
                payload: { name: runtimeCode },
            })
            setEditDialogOpen(false)
            setAssetToEdit(undefined)
            setEditRuntimeCode('')
            toast({
                title: 'Runtime updated',
                description: `"${previousName}" was updated to "${runtimeCode}".`,
                duration: 3000,
            })
        } catch (err) {
            console.error('Error updating asset:', err)
            toast({
                title: 'Failed to update runtime',
                description: (
                    <span className="text-sm text-red-500">
                        Could not update the runtime code. Please try again.
                    </span>
                ),
                duration: 3000,
            })
        }
    }

    const handleDeleteRuntime = async () => {
        if (!assetToDelete?.id) {
            throw new Error('No runtime selected for deletion')
        }

        const deletedName = assetToDelete.name
        try {
            await deleteAsset.mutateAsync(assetToDelete.id)
            toast({
                title: 'Runtime removed',
                description: `"${deletedName}" was removed from your assets.`,
                duration: 3000,
            })
        } catch (err) {
            console.error('Error deleting asset:', err)
            toast({
                title: 'Failed to remove runtime',
                description: (
                    <span className="text-sm text-red-500">
                        Could not remove the runtime. Please try again.
                    </span>
                ),
                duration: 3000,
            })
            throw err
        }
    }

    return (
        <div className="flex flex-col w-full min-h-[420px]">
            <div className="flex items-start justify-between gap-4 border-b px-6 py-4">
                <div>
                    <h2 className="text-xl font-semibold text-foreground">
                        Cloud Runtimes
                    </h2>
                </div>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Close"
                    onClick={() => {
                        if (onClose) onClose()
                    }}
                >
                    <IoClose size={20} />
                </Button>
            </div>

            <DaDialog 
                open={shareDialogOpen}
                onOpenChange={setShareDialogOpen}
                trigger={<span></span>}
                dialogTitle="Share Asset"
            >
                <ShareAssetPanel 
                    asset={activeAsset}
                    onCancel={() => {
                        setShareDialogOpen(false)
                    }}
                    onDone={() => {
                        setShareDialogOpen(false)
                    }}
                />
            </DaDialog>

            <DaDialog
                open={editDialogOpen}
                onOpenChange={(next) => {
                    if (isUpdating && !next) return
                    setEditDialogOpen(next)
                    if (!next) {
                        setAssetToEdit(undefined)
                        setEditRuntimeCode('')
                    }
                }}
                trigger={<span />}
                dialogTitle="Edit runtime code"
                preventOutsideClose={isUpdating}
                footer={
                    <>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={isUpdating}
                            onClick={() => {
                                setEditDialogOpen(false)
                                setAssetToEdit(undefined)
                                setEditRuntimeCode('')
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            disabled={!canSaveEdit}
                            onClick={handleSaveEdit}
                        >
                            {isUpdating ? (
                                <>
                                    <Spinner className="mr-2" />
                                    Saving...
                                </>
                            ) : (
                                'Save'
                            )}
                        </Button>
                    </>
                }
            >
                <p className="text-sm text-muted-foreground mb-3">
                    Update the runtime code linked to this asset in your list.
                </p>
                <label
                    htmlFor="edit-runtime-code"
                    className="text-sm text-muted-foreground mb-1.5 block"
                >
                    Runtime code
                </label>
                <Input
                    id="edit-runtime-code"
                    value={editRuntimeCode}
                    onChange={(e) => setEditRuntimeCode(e.target.value)}
                    className="w-full"
                    disabled={isUpdating}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && canSaveEdit) {
                            handleSaveEdit()
                        }
                    }}
                />
            </DaDialog>

            <DaConfirmPopup
                title="Remove runtime"
                label={`Remove "${assetToDelete?.name ?? ''}" from your assets? This will not delete the runtime on the server.`}
                confirmLabel="Remove"
                confirmingLabel="Removing..."
                onConfirm={handleDeleteRuntime}
                state={[confirmDeleteOpen, setConfirmDeleteOpen]}
            >
                <span />
            </DaConfirmPopup>

            <div className="flex flex-col flex-1 min-h-0 gap-6 px-6 py-4">
                <div className="rounded-lg border bg-muted/30 p-4">
                    <h3 className="text-sm font-semibold text-foreground">
                        Add runtime
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5 mb-3">
                        Enter the runtime code of an existing runtime to add it to your assets.
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                        <div className="flex-1 min-w-0">
                            <label
                                htmlFor="runtime-code"
                                className="text-sm text-muted-foreground mb-1.5 block"
                            >
                                Runtime code
                            </label>
                            <Input
                                ref={runtimeCodeInputRef}
                                id="runtime-code"
                                value={newRtName}
                                onChange={(e) => setNewRtName(e.target.value)}
                                className="w-full"
                                disabled={isAdding}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && newRtName.trim().length > 0 && !isAdding) {
                                        handleAddRuntime()
                                    }
                                }}
                            />
                        </div>
                        <Button 
                            disabled={newRtName.trim().length <= 0 || isAdding} 
                            className="shrink-0"
                            onClick={handleAddRuntime}
                        >
                            {isAdding ? (
                                <>
                                    <Spinner className="mr-2" />
                                    Adding...
                                </>
                            ) : (
                                'Add'
                            )}
                        </Button>
                    </div>
                </div>

                {isLoading && (
                    <div className="w-full flex py-8 justify-center items-center">
                        <Spinner className="mr-2" />
                        <span className="text-sm text-muted-foreground">Loading runtimes...</span>
                    </div>
                )}

                {!isLoading && (
                    <div className="flex flex-col flex-1 min-h-0">
                        <div className="flex w-full items-center text-muted-foreground font-semibold text-sm py-2 border-b border-border">
                            <div className="grow">Runtime code</div>
                            <div className="w-[150px] min-w-[150px] text-right">Actions</div>
                        </div>

                        <div className="flex-1 min-h-0 max-h-[320px] overflow-y-auto">
                            {myRuntimes.length === 0 && (
                                <div className="w-full py-10 text-center">
                                    <p className="text-sm text-muted-foreground">
                                        No cloud runtimes yet
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Add an existing runtime above using its runtime code.
                                    </p>
                                </div>
                            )}

                            {myRuntimes.map((asset: any) => (
                                <div 
                                    key={asset.id}
                                    className="flex w-full items-center text-foreground text-sm py-3 border-b border-border hover:bg-muted/40 transition-colors"
                                >
                                    <div className="grow font-medium truncate pr-4">{asset.name}</div>
                                    <div className="w-[150px] min-w-[150px] flex justify-end gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            aria-label={`Edit ${asset.name}`}
                                            disabled={actionsDisabled}
                                            onClick={() => handleOpenEdit(asset)}
                                        >
                                            <TbPencil size={18} />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            aria-label={`Share ${asset.name}`}
                                            disabled={actionsDisabled}
                                            onClick={() => {
                                                setActiveAsset(JSON.parse(JSON.stringify(asset)))
                                                setShareDialogOpen(true)
                                            }}
                                        >
                                            <TbShare size={18} />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            aria-label={`Delete ${asset.name}`}
                                            className="text-destructive hover:text-destructive"
                                            disabled={actionsDisabled}
                                            onClick={() => {
                                                setAssetToDelete(asset)
                                                setConfirmDeleteOpen(true)
                                            }}
                                        >
                                            <TbTrash size={18} />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default RuntimeAssetManager
