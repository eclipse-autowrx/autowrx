// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT


import { User } from "@/types/user.type"
import { TbMinus } from 'react-icons/tb'
import { Avatar, AvatarImage, AvatarFallback } from "@/components/atoms/avatar"
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
      <div className="my-1 flex cursor-pointer items-center justify-between rounded-lg border border-input bg-muted/25 p-2">
        <div className="flex items-center">
          <Avatar className="mr-4 h-10 w-10">
            <AvatarImage src={user.image_file} alt="user" />
            <AvatarFallback>
              <img src="/imgs/profile.png" alt="profile" className="h-full w-full rounded-full object-cover" />
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <p className="text-base font-bold text-foreground">
              {user.name ?? 'Loading...'}
            </p>
            <span className="text-sm text-muted-foreground">
              {maskEmail(user?.email ?? '')}
            </span>
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