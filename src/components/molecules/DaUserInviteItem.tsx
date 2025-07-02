// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { InvitedUser } from '@/types/user.type'
import { DaAvatar } from '../atoms/DaAvatar'
import DaText from '../atoms/DaText'
import { TbChevronDown, TbCircle, TbCircleCheckFilled } from 'react-icons/tb'
import clsx from 'clsx'
import DaMenu from '../atoms/DaMenu'
import { DaButton } from '../atoms/DaButton'
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
        'flex items-center gap-2 px-5 py-2 text-left hover:bg-da-black/5',
        !isInviting ? 'cursor-default' : 'cursor-pointer',
      )}
    >
      <DaAvatar src={user.image_file} />

      <div className="flex-1 overflow-x-hidden">
        <DaText className="block text-da-black">
          {user.name} {self?.id === user.id && '(You)'}
        </DaText>
        <DaText className="block truncate text-da-gray-medium" variant="small">
          {user.email}
        </DaText>
      </div>

      {!isInviting ? (
        <div className={clsx(forbidRemove && 'pointer-events-none')}>
          <DaMenu
            trigger={
              <DaText className="da-label-small flex !cursor-pointer items-center text-da-gray-medium">
                {accessLevel}{' '}
                {!forbidRemove && <TbChevronDown className="ml-1" />}
              </DaText>
            }
          >
            <DaButton
              onClick={() => onRemoveAccess && onRemoveAccess(user)}
              variant="destructive"
              size="sm"
              className="w-[100px]"
            >
              <p className="w-full text-left">Remove</p>
            </DaButton>
          </DaMenu>
        </div>
      ) : (
        <>
          {!selected ? (
            <TbCircle className="ml-auto h-7 w-7 text-da-gray-medium/50" />
          ) : (
            <TbCircleCheckFilled className="ml-auto h-7 w-7 text-da-primary-500" />
          )}
        </>
      )}
    </div>
  )
}

export default DaUserInviteItem
