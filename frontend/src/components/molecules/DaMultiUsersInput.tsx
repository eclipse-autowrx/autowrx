// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import clsx from 'clsx'
import DaText from '../atoms/DaText'
import { TbX } from 'react-icons/tb'
import { InvitedUser } from '@/types/user.type'
import { DaSelect, DaSelectItem } from '../atoms/DaSelect'
import { AccessLevel } from '../organisms/AccessInvitation'
import { useEffect } from 'react'

type DaMultiUsersInputProps = {
  inputString: string
  onInputStringChange: React.Dispatch<React.SetStateAction<string>>
  selectedUsers: InvitedUser[]
  onRemoveUser: (user: InvitedUser) => void
  inputRef: React.RefObject<HTMLInputElement>
  accessLevelId: string
  onAccessLevelIdChange: React.Dispatch<React.SetStateAction<string>>
  className?: string
  accessLevels?: AccessLevel[]
}

const DaMultiUsersInput = ({
  inputString,
  onInputStringChange,
  selectedUsers,
  onRemoveUser,
  inputRef,
  accessLevelId,
  onAccessLevelIdChange,
  className,
  accessLevels,
}: DaMultiUsersInputProps) => {
  useEffect(() => {
    if (accessLevels && accessLevels.length > 0) {
      onAccessLevelIdChange(accessLevels[0].value)
    }
  }, [accessLevels])

  return (
    <div
      className={clsx(
        'flex max-h-[160px] min-h-10 w-full gap-2 overflow-y-auto rounded-md border border-da-black/30 px-2 pt-[6px] outline-[3px] outline-da-primary-100 focus-within:outline',
        className,
      )}
    >
      <div className="flex flex-1 flex-col">
        {selectedUsers.length > 0 && (
          <div className="mb-[6px] flex flex-wrap gap-1">
            {selectedUsers.map((user) => (
              <div
                key={user.id}
                className="flex cursor-default items-center rounded border border-da-gray-medium/50 px-1 py-0.5"
              >
                <DaText variant="small" className="text-da-gray-dark">
                  {user.name}
                </DaText>
                <button
                  className="-m-0.5 ml-1 p-0.5"
                  onClick={() => onRemoveUser(user)}
                >
                  <TbX />
                </button>
              </div>
            ))}
          </div>
        )}

        <input
          ref={inputRef}
          value={inputString}
          onChange={(e) => onInputStringChange(e.target.value)}
          autoFocus
          className="block w-full bg-transparent text-da-gray-dark outline-none"
          placeholder="Email of users"
        />

        <div className="min-h-[6px]" />
      </div>

      {accessLevels && selectedUsers.length > 0 && (
        <DaSelect
          wrapperClassName="ml-auto sticky self-start -top-[5px] -mt-[5px] -mb-1 -mr-1"
          className="h-7 border-none !shadow-none"
          value={accessLevelId}
          onValueChange={(value) => onAccessLevelIdChange(value)}
        >
          {accessLevels.map((accessLevel, index) => (
            <DaSelectItem
              helperText={accessLevel.helperText}
              value={accessLevel.value}
              key={index}
            >
              <DaText className="da-label-small text-da-gray-dark">
                {accessLevel.label}
              </DaText>
            </DaSelectItem>
          ))}
        </DaSelect>
      )}
    </div>
  )
}

export default DaMultiUsersInput
