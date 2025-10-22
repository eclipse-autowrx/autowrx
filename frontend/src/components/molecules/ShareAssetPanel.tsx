// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useEffect, useState } from "react"
import { useAssets } from '@/hooks/useAssets'
import { Button } from "@/components/atoms/button"
import AccessInvitation from "@/components/organisms/AccessInvitation.tsx"
import { InvitedUser } from "@/types/user.type"
import UserList from "@/components/molecules/UserList"
import { User } from "@/types/user.type"
import { TbUserPlus } from "react-icons/tb"
import { IoClose } from "react-icons/io5";

interface iPropShareAssetPanel {
    asset: any,
    onCancel: () => void,
    onDone: () => void,
}

const ShareAssetPanel = ({ asset, onDone, onCancel }: iPropShareAssetPanel) => {

    const [showInviteDialog, setShowInviteDialog] = useState(false)
    const { shareMyAsset, getAssetById, removeUserFromShareList } = useAssets()

    const accessLevels = [
        {
            value: 'read_asset',
            label: 'Use asset',
            helperText: 'Permission to see and use asset',
        }
    ]

    const [invitedUsers, setInvitedUsers] = useState<InvitedUser[]>([])

    useEffect(() => {
        if (asset.id) {
            getAssetInfo()
        }
    }, [asset])

    const getAssetInfo = async () => {
        let items = [] as any
        try {
            let data = await getAssetById(asset.id)
            // console.log('listAllUserForAsset', data)
            if (data && data.readAccessUsers) {
                items = data.readAccessUsers
                // console.log(`data.readAccessUsers`, data.readAccessUsers)
            }
        } catch (e) {
            console.log(`Error on listAllUserForAsset`, e)
        }
        setInvitedUsers(items)
    }

    return <div className="flex flex-col w-[480px] px-4">
        <div className="flex items-center">
            <h2 className="text-xl font-semibold">Share to</h2>
            <div className="grow"></div>
            <IoClose size={24} className="hover:opacity-70 cursor-pointer"
                onClick={() => {
                    if(onDone) onDone()
                }}/>
        </div>
        
        <div className="mt-2 w-full min-h-[200px] overflow-auto">
            <span className="my-2 flex items-center justity-between">
                <Button
                    size="sm"
                    className="flex items-center text-primary"
                    variant="outline"
                    onClick={() => setShowInviteDialog(true)}
                >
                    <TbUserPlus className="mr-2" /> Add user
                </Button>
            </span>
            <div className="min-h-[200px] max-h-[400px] overflow-auto">
                { (invitedUsers && invitedUsers.length) && <UserList users={invitedUsers as User[]} 
                    onRemoveUser={async (userId: string, userName?: string) => {
                    if(!confirm(`Confirm stop share asset to user ${userName||''}?`)) return
                    try {
                        await removeUserFromShareList(asset.id, userId, 'read_asset')
                        await (new Promise((resolve) => setTimeout(resolve, 500)))
                        await getAssetInfo()
                    } catch(err) {
                        console.log(`Error on removeUserFromShareList`, err)
                    }
                }} />
                }
            </div>
            <div>
                <AccessInvitation
                    label="Collaborator Invitation"
                    open={showInviteDialog}
                    onClose={() => setShowInviteDialog(false)}
                    accessLevels={accessLevels}
                    invitedUsers={invitedUsers}
                    onInviteUsers={async (users: InvitedUser[], levelId: string) => {
                        if (!users || users.length == 0) return
                        let userIds = users.map((user: any) => user.id).join(',')
                        try {
                            await shareMyAsset(asset.id, {
                                userId: userIds,
                                role: levelId
                            })
                            await (new Promise((resolve) => setTimeout(resolve, 500)))
                            await getAssetInfo()
                        } catch (err) {
                            console.log(`Error on shareMyAsset`, err)
                        }
                    }}
                    onInviteSuccess={(role) => {
                        // console.log("onInviteSuccess ", role)
                    }}
                    onRemoveUserAccess={async (user: InvitedUser) => {
                        // handle  remove users
                        // console.log("onRemoveUserAccess user", user)
                        if(!confirm(`Confirm stop share asset to user ${user.name||''}?`)) return
                        try {
                            await removeUserFromShareList(asset.id, user.id, 'read_asset')
                            await (new Promise((resolve) => setTimeout(resolve, 500)))
                            await getAssetInfo()
                        } catch(err) {
                            console.log(`Error on removeUserFromShareList`, err)
                        }
                    }}
                />
            </div>
        </div>
    </div>

}

export default ShareAssetPanel