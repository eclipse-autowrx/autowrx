// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { InvitedUser } from '@/types/user.type.ts'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/atoms/avatar'
import { TbChevronDown, TbCircle, TbCircleCheckFilled } from 'react-icons/tb'
import clsx from 'clsx'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../atoms/dropdown-menu'
import { Button } from '@/components/atoms/button'
import useSelfProfileQuery from '@/hooks/useSelfProfile'

type DaUserInviteItemProps = {
  user: InvitedUser
  isInviting?: boolean
  selected?: boolean
  onSelect: (user: InvitedUser) => void
  accessLevel?: string
  forbidRemove?: boolean
  onRemoveAccess?: (user: InvitedUser) => void
}

const DaUserInviteItem = ({
  user,
  isInviting,
  selected,
  onSelect,
  accessLevel = 'Action',
  forbidRemove,
  onRemoveAccess,
}: DaUserInviteItemProps) => {
  const { data: self } = useSelfProfileQuery()

  return (
    <div
      onClick={() => {
        if (isInviting) onSelect(user)
      }}
      className={clsx(
        'flex items-center gap-2 px-5 py-2 text-left hover:bg-foreground/5',
        !isInviting ? 'cursor-default' : 'cursor-pointer',
      )}
    >
      <Avatar className="h-10 w-10">
        <AvatarImage src={user.image_file} alt={user.name} />
        <AvatarFallback>
          <img src="/imgs/profile.png" alt="profile" className="h-full w-full rounded-full object-cover" />
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 overflow-x-hidden">
        <span className="block text-foreground">
          {user.name} {self?.id === user.id && '(You)'}
        </span>
        <span className="block truncate text-muted-foreground" >
          {user.email}
        </span>
      </div>

      {!isInviting ? (
        <div className={clsx(forbidRemove && 'pointer-events-none')}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <span className="text-sm flex cursor-pointer items-center text-muted-foreground">
                {accessLevel}{' '}
                {!forbidRemove && <TbChevronDown className="ml-1" />}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Button
                  onClick={() => onRemoveAccess && onRemoveAccess(user)}
                  variant="destructive"
                  size="sm"
                  className="w-full cursor-pointer"
                >
                  Remove
                </Button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : (
        <>
          {!selected ? (
            <TbCircle className="ml-auto h-7 w-7 text-muted-foreground/50" />
          ) : (
            <TbCircleCheckFilled className="ml-auto h-7 w-7 text-primary" />
          )}
        </>
      )}
    </div>
  )
}

export default DaUserInviteItem
