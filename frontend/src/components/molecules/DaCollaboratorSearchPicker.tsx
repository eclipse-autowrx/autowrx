// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { InvitedUser } from '@/types/user.type.ts'
import DaText from '../atoms/DaText'
import { useEffect, useMemo, useState } from 'react'
import DaUserInviteItem from './DaUserInviteItem.tsx'
import { debounce } from 'lodash'
import DaLoader from '../atoms/DaLoader'
import useSearchUserByEmail from '@/hooks/useSearchUserByEmail.ts'
import clsx from 'clsx'

type DaCollaboratorSearchPickerProps = {
  inputString: string
  invitedUsers: InvitedUser[]
  selectedUsers: Map<string, InvitedUser>
  onToggle: (user: InvitedUser) => void
  onRemoveAccess: (user: InvitedUser) => void
}

const DaCollaboratorSearchPicker = ({
  inputString,
  invitedUsers,
  selectedUsers,
  onToggle,
  onRemoveAccess,
}: DaCollaboratorSearchPickerProps) => {
  const [queryKey, setQueryKey] = useState(inputString)
  const { data: foundUser, isLoading } = useSearchUserByEmail(queryKey)

  const matchedSelectedUsers = useMemo(() => {
    const users = Array.from(selectedUsers.values())
    let matchedUsers = users.filter(
      (user) =>
        user.email?.toLowerCase().includes(inputString.toLowerCase()) ||
        user.name.toLowerCase().includes(inputString.toLowerCase()),
    )

    if (foundUser) {
      if (!matchedUsers.some((user) => user.id === foundUser.id)) {
        matchedUsers.push(foundUser)
      }
    }

    matchedUsers = matchedUsers.filter(
      (user) => !invitedUsers.some((invitedUser) => invitedUser.id === user.id),
    )

    return matchedUsers.sort((a, b) =>
      (a.email || '')?.localeCompare(b.email || ''),
    )
  }, [selectedUsers, inputString, foundUser])

  const matchedInvitedUsers = useMemo(() => {
    if (!invitedUsers) return []

    let results = invitedUsers

    if (inputString) {
      results = invitedUsers?.filter(
        (user) =>
          user?.email?.toLowerCase().includes(inputString.toLowerCase()) ||
          user?.name?.toLowerCase().includes(inputString.toLowerCase()),
      )
    }

    return results.sort((a, b) => (a.email || '')?.localeCompare(b.email || ''))
  }, [invitedUsers, inputString])

  const performSearch = useMemo(() => {
    return debounce(async (query: string) => {
      setQueryKey(() => query)
    }, 500)
  }, [])

  useEffect(() => {
    performSearch(inputString)
  }, [inputString])

  return (
    <>
      {!inputString ? (
        <div
          className={clsx(
            'flex min-h-10 items-center justify-center',
            matchedInvitedUsers.length === 0 && 'flex-1',
          )}
        >
          <DaText variant="small">
            Type an email to search & invite user.
          </DaText>
        </div>
      ) : (
        <>
          <DaText variant="small-bold" className="mb-2 text-da-gray-dark">
            Other people
          </DaText>

          {matchedSelectedUsers.length > 0 && (
            <div className="-mx-5 w-[calc(100%+40px)]">
              {matchedSelectedUsers.map((user) => (
                <DaUserInviteItem
                  key={user.id}
                  selected={selectedUsers.has(user.id)}
                  onSelect={onToggle}
                  user={user}
                  isInviting={true}
                />
              ))}
            </div>
          )}

          <div
            className={clsx(
              'mb-2 flex flex-col items-center gap-2',
              matchedInvitedUsers.length === 0 && 'flex-1',
            )}
          >
            {!isLoading && matchedSelectedUsers.length === 0 && (
              <DaText
                variant="small"
                className="m-auto flex min-h-12 items-center"
              >
                No users found. Keep typing an email to search & invite user.
              </DaText>
            )}

            {isLoading && <DaLoader className="m-auto" />}
          </div>
        </>
      )}

      {matchedInvitedUsers.length > 0 && (
        <div className="w-full">
          <DaText variant="small-bold" className="my-2 block text-da-gray-dark">
            People with access
          </DaText>

          <div className="-mx-5">
            {matchedInvitedUsers.map((user) => (
              <DaUserInviteItem
                accessLevel={user.access_level}
                forbidRemove={user.forbid_remove}
                onRemoveAccess={onRemoveAccess}
                selected={selectedUsers.has(user.id)}
                onSelect={onToggle}
                key={user.id}
                user={user}
              />
            ))}
          </div>
        </div>
      )}
    </>
  )
}

export default DaCollaboratorSearchPicker
