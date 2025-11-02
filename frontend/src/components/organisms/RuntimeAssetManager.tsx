// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useState, useEffect } from "react"
import { useAssets } from '@/hooks/useAssets'
import { IoClose } from "react-icons/io5";
import { TbTrash, TbShare } from "react-icons/tb"
import { Input } from "@/components/atoms/input";
import { Button } from "@/components/atoms/button";
import ShareAssetPanel from "@/components/molecules/ShareAssetPanel";
import DaDialog from "@/components/molecules/DaDialog";
import { Spinner } from "@/components/atoms/spinner";

interface iPropRuntimeAssetManager {
    onClose: () => void,
    onCancel: () => void,
}

const RuntimeAssetManager = ({ onClose, onCancel }: iPropRuntimeAssetManager) => {
    const [myRuntimes, setMyRuntimes] = useState<any[]>([])
    const { useFetchAssets, deleteAsset, createAsset, updateAsset } = useAssets()
    const { data: assets, isLoading, refetch } = useFetchAssets()
    const [activeAsset, setActiveAsset] = useState<any>()
    const [newRtName, setNewRtName] = useState<string>("Runtime-")
    const [shareDialogOpen, setShareDialogOpen] = useState<boolean>(false)

    useEffect(() => {
        setMyRuntimes(assets?.filter((a: any) => a.type == 'CLOUD_RUNTIME') || [])
    }, [assets])

    return <div className="w-full min-h-[400px] px-2 py-1">
        <div className="flex items-center">
            <h2 className="text-xl font-semibold text-foreground">
                My Assets
            </h2>
            <div className="grow"></div>
            <IoClose className="cursor-pointer hover:opacity-70" size={24} onClick={() => {
                if (onClose) onClose()
            }} />
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

        <div className="flex flex-col w-full mt-6 max-h-[400px] overflow-auto">
            <div className="bg-slate-100 w-full px-4 py-2 rounded">
                <h3 className="text-lg font-semibold">Add new asset</h3>
                <div className="mt-2 flex items-center">
                    <span className="text-sm mr-2">Runtime Code:</span>
                    <Input
                        value={newRtName}
                        onChange={(e) => setNewRtName(e.target.value)}
                        className="flex w-[280px] mx-2"
                    />
                    <Button 
                        disabled={newRtName.trim().length <= 0} 
                        onClick={async () => {
                            try {
                                await createAsset.mutateAsync({
                                    name: newRtName,
                                    type: 'CLOUD_RUNTIME',
                                    data: '{}',
                                })
                                setNewRtName('Runtime-')
                                await refetch()
                            } catch (err) {
                                console.error('Error creating asset:', err)
                            }
                        }}
                    >
                        Add
                    </Button>
                </div>
            </div>

            {isLoading && (
                <div className="w-full flex py-4 justify-center items-center">
                    <Spinner className="mr-2" />
                    <span className="text-sm text-muted-foreground">Loading...</span>
                </div>
            )}

            {!isLoading && (
                <div className="mt-6 w-full">
                    <div className="flex w-full items-center text-foreground font-bold text-lg 
                            py-1 border-b border-border">
                        <div className="grow">Name</div>
                        <div className="w-[200px] min-w-[100px]">Actions</div>
                    </div>

                    {(!assets || assets.length == 0) && (
                        <div className="w-full py-4 italic text-muted-foreground text-center">
                            You have no asset
                        </div>
                    )}

                    {assets && assets.length > 0 && assets.map((asset: any, aIndex: number) => (
                        <div 
                            key={aIndex}
                            className="flex w-full items-center text-foreground font-normal text-md 
                            py-4 border-b border-border"
                        >
                            <div className="grow">{asset.name}</div>
                            <div className="w-[200px] min-w-[100px] flex space-x-4">
                                <TbShare 
                                    className="text-muted-foreground cursor-pointer hover:opacity-60" 
                                    size={24}
                                    onClick={() => {
                                        setActiveAsset(JSON.parse(JSON.stringify(asset)))
                                        setShareDialogOpen(true)
                                    }} 
                                />
                                <TbTrash 
                                    className="text-red-500 cursor-pointer hover:opacity-60" 
                                    size={24}
                                    onClick={async () => {
                                        if (!confirm(`Confirm delete asset '${asset.name}'?`) || !asset.id) {
                                            return
                                        }
                                        try {
                                            await deleteAsset.mutateAsync(asset.id)
                                            await refetch()
                                        } catch (err) {
                                            console.error('Error deleting asset:', err)
                                        }
                                    }} 
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
}

export default RuntimeAssetManager
