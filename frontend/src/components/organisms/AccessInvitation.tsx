// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useRef, useState } from 'react'
import DaDialog from '@/components/molecules/DaDialog'
import DaMultiUsersInput from '@/components/molecules/DaMultiUsersInput.tsx'
import { Button } from '@/components/atoms/button'
import { InvitedUser } from '@/types/user.type.ts'
import DaCollaboratorSearchPicker from '@/components/molecules/DaCollaboratorSearchPicker.tsx'
import { isAxiosError } from 'axios'
import { toast } from 'react-toastify'
import { useMutation } from '@tanstack/react-query'
import { Spinner } from '@/components/atoms/spinner'

export type AccessLevel = {
  value: string
  label: string
  helperText?: string
}

type AccessInvitationProps = {
  open: boolean
  onClose: () => void
  accessLevels: AccessLevel[]
  invitedUsers?: InvitedUser[]
  onInviteUsers: (users: InvitedUser[], accessLevelId: string) => Promise<void>
  onInviteSuccess?: (accessLevelId?: string) => void
  onRemoveUserAccess: (user: InvitedUser) => Promise<void>
  label: string
}

const AccessInvitation = ({
  open,
  onClose,
  invitedUsers,
  onInviteUsers,
  onInviteSuccess,
  onRemoveUserAccess,
  label,
  accessLevels,
}: AccessInvitationProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [inputString, setInputString] = useState('')
  const [accessLevelId, setAccessLevelId] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<Map<string, InvitedUser>>(
    new Map(),
  )

  const addUser = (user: InvitedUser) => {
    setSelectedUsers((prev) => new Map(prev.set(user.id, user)))
  }

  const removeUser = (user: InvitedUser) => {
    setSelectedUsers((prev) => {
      const newMap = new Map(prev)
      newMap.delete(user.id)
      return newMap
    })
  }

  const handleToggle = (user: InvitedUser) => {
    if (selectedUsers.has(user.id)) {
      removeUser(user)
    } else {
      addUser(user)
      setInputString('')
      inputRef.current?.focus()
    }
  }

  const { mutate: mutateInviting, isPending } = useMutation({
    mutationFn: async () => {
      await onInviteUsers(Array.from(selectedUsers.values()), accessLevelId)
    },
    onSuccess: () => {
      setSelectedUsers(new Map())
      onClose()
      onInviteSuccess && onInviteSuccess(accessLevelId)
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        return toast.error(
          `Error inviting users: ${error.response?.data?.message || error?.message}`,
        )
      }
      toast.error('Error inviting user')
    },
  })

  const { mutate: mutateRemovingUserAccess } = useMutation({
    mutationFn: onRemoveUserAccess,
    onError: (error) => {
      if (isAxiosError(error)) {
        return toast.error(
          `Error removing users: ${error.response?.data?.message || error?.message}`,
        )
      }
      toast.error('Error removing user access')
    },
  })

  return (
    <DaDialog
      open={open}
      onOpenChange={onClose}
      dialogTitle={label}
      className="flex h-[500px] max-h-[calc(100vw-160px)] min-h-[400px] w-[560px] max-w-[calc(100vw-80px)] flex-col rounded"
      contentContainerClassName="flex flex-col h-full"
    >
      <div className="mb-4">
        <div className="mt-2 flex gap-4">
          <DaMultiUsersInput
            inputString={inputString}
            onInputStringChange={setInputString}
            selectedUsers={Array.from(selectedUsers.values())}
            onRemoveUser={(user) => removeUser(user)}
            inputRef={inputRef}
            accessLevels={accessLevels}
            accessLevelId={accessLevelId}
            onAccessLevelIdChange={setAccessLevelId}
            className="min-w-0 flex-1"
          />
          <Button
            onClick={() => mutateInviting()}
            className="shrink-0"
            disabled={isPending || selectedUsers.size === 0}
          >
            Invite {isPending && <Spinner className="ml-2 text-white" size={16} />}
          </Button>
        </div>
      </div>

      <div className="-mx-6 flex flex-1 flex-col overflow-y-auto px-6">
        <DaCollaboratorSearchPicker
          inputString={inputString}
          invitedUsers={invitedUsers || []}
          selectedUsers={selectedUsers}
          onToggle={handleToggle}
          onRemoveAccess={(user) => mutateRemovingUserAccess(user)}
        />
      </div>
    </DaDialog>
  )
}

export default AccessInvitation
