// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { User } from '@/types/user.type'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/atoms/avatar'

const DaUserListItem = ({ user }: { user: User }) => {
  return (
    <div key={user.id} className="flex flex-1">
      <Avatar className="mr-4 w-10 h-10">
        <AvatarImage
          src={user.image_file || '/imgs/profile.png'}
          alt={user.name || 'User'}
        />
        <AvatarFallback>
          <img
            src="/imgs/profile.png"
            alt="profile"
            className="h-full w-full rounded-full object-cover"
          />
        </AvatarFallback>
      </Avatar>

      {/* Information */}
      <div className="flex flex-col space-y-1">
        <div className="flex w-full items-center space-x-2">
          <span className="text-base font-semibold text-primary">
            {user.name}
          </span>
        </div>

        {user.email && (
          <span className="block text-sm text-muted-foreground">
            {user.email}
          </span>
        )}
      </div>
    </div>
  )
}

export default DaUserListItem

