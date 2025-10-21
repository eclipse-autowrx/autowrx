// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT


import { User } from "@/types/user.type"
import { TbMinus } from 'react-icons/tb'
import { DaAvatar } from "../atoms/DaAvatar"
import DaText from "../atoms/DaText"
import { maskEmail } from '@/lib/utils'

interface UserListProps {
    users: User[]
    onRemoveUser: (userId: string, userName?: string) => void
}

interface UserListItemProps {
    user: User
    onRemoveUser: (userId: string, userName?: string) => void
}

const UserListItem = ({ user, onRemoveUser }: UserListItemProps) => {
    if (!user) {
      return null
    }
  
    return (
      <div className="my-1 flex cursor-pointer items-center justify-between rounded-lg border border-da-gray-light bg-da-gray-light/25 p-2">
        <div className="flex items-center">
          <DaAvatar
            src={user.image_file}
            alt="user"
            className="mr-4 h-10 w-10 rounded-full"
          />
          <div className="flex flex-col">
            <DaText variant="regular" className="font-bold text-da-gray-dark">
              {user.name ?? 'Loading...'}
            </DaText>
            <DaText variant="small" className="text-da-gray-medium">
              {maskEmail(user?.email ?? '')}
            </DaText>
          </div>
        </div>
        <div
          className="rounded-lg p-2 hover:bg-red-200"
          onClick={() => onRemoveUser(user.id, user.name)}
        >
          <TbMinus className="cursor-pointer text-red-500" />
        </div>
      </div>
    )
}

const UserList = ({users, onRemoveUser}: UserListProps) => {
    return <div className="w-full overflow-auto">
        { users && users.length && users.map((user: User, uIndex:number) => <UserListItem key={uIndex} 
            user={user}
            onRemoveUser={onRemoveUser}
        />)}
    </div>
}


export default UserList 