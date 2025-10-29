// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useState } from 'react'
import { TbTrash } from 'react-icons/tb'
import { User } from '@/types/user.type'
import { Avatar, AvatarFallback, AvatarImage } from '../atoms/avatar'
import { Button } from '../atoms/button'

interface UserListProps {
  users: User[]
  onRemoveUser?: (userId: string) => void
}

const UserList = ({ users, onRemoveUser }: UserListProps) => {
  const [hoveredUserId, setHoveredUserId] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-2">
      {users.map((user) => (
        <div
          key={user.id}
          className="flex items-center justify-between rounded-md border border-border bg-background p-2 hover:bg-muted/50 transition-colors"
          onMouseEnter={() => setHoveredUserId(user.id)}
          onMouseLeave={() => setHoveredUserId(null)}
        >
          <div className="flex items-center gap-3">
            <Avatar className="size-8">
              <AvatarImage src={user.image_file || undefined} alt={user.name} />
              <AvatarFallback className="text-xs">
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <p className="text-sm font-medium text-foreground">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          {onRemoveUser && hoveredUserId === user.id && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onRemoveUser(user.id)}
              className="text-destructive hover:text-destructive"
            >
              <TbTrash className="size-4" />
            </Button>
          )}
        </div>
      ))}
    </div>
  )
}

export default UserList
