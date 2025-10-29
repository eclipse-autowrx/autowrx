// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useMemo, useState } from 'react'
import { TbUserPlus } from 'react-icons/tb'
import { Button } from '../atoms/button'
import { Spinner } from '../atoms/spinner'
import { cn } from '@/lib/utils'
import { InvitedUser, User } from '@/types/user.type'
import {
  updateModelPermissionService,
  deleteModelPermissionService,
} from '@/services/model.service'
import useCurrentModel from '@/hooks/useCurrentModel'
import DaTabItem from '../atoms/DaTabItem'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { addLog } from '@/services/log.service'
import AccessInvitation from '../organisms/AccessInvitation'
import UserList from './UserList'

interface ContributorListProps {
  className?: string
}

const accessLevels = [
  {
    value: 'model_contributor',
    label: 'Contributor',
    helperText: 'Can view and create prototype',
  },
  {
    value: 'model_member',
    label: 'Member',
    helperText: 'Can view, create prototype and update model',
  },
]

const DaContributorList = ({ className }: ContributorListProps) => {
  const { data: model, refetch } = useCurrentModel()
  const [activeTab, setActiveTab] = useState('contributors')
  const { data: currentUser } = useSelfProfileQuery()
  const [open, setOpen] = useState(false)

  // All hooks must be called before any conditional returns
  const invitedUsers: InvitedUser[] = useMemo(() => {
    if (!model) return []

    const modelContributors = (model.contributors || [])
      .filter((c): c is User => !!c)
      .map((c) => ({
        name: c.name || 'Unknown',
        id: c.id || '',
        email: c.email || '',
        image_file: c.image_file,
        access_level: 'Contributor',
        access_level_id: 'model_contributor',
      }))

    const modelMembers = (model.members || [])
      .filter((c): c is User => !!c)
      .map((c) => ({
        name: c.name || 'Unknown',
        id: c.id || '',
        email: c.email || '',
        image_file: c.image_file,
        access_level: 'Member',
        access_level_id: 'model_member',
      }))

    const results: InvitedUser[] = [...modelContributors, ...modelMembers]

    if (model.created_by) {
      results.push({
        name: model.created_by.name || 'Unknown',
        id: model.created_by.id || '',
        email: model.created_by.email || '',
        image_file: model.created_by.image_file,
        access_level: 'Owner',
        access_level_id: 'owner',
        forbid_remove: true,
      })
    }

    return results
  }, [model])

  // Define all handler functions with proper null checks
  const onRemoveUser = async (userId: string) => {
    if (!model || !currentUser) return

    const role =
      activeTab === 'contributors' ? 'model_contributor' : 'model_member'
    await deleteModelPermissionService(model.id, role, userId)
    await refetch()
    addLog({
      name: `User ${currentUser.email} delete user permission from ${model.name}`,
      description: `User ${currentUser.email} delete user permission from ${model.name}: Delete user ${userId} from role ${role}`,
      type: 'delete-permission',
      create_by: currentUser.id!,
      ref_id: model.id,
      ref_type: 'model',
    })
  }

  const handleInviteUsers = async (users: InvitedUser[], role: string) => {
    if (!model || !currentUser) return

    await updateModelPermissionService(
      model.id,
      role,
      users.map((u) => u.id).join(','),
    )
    await refetch()
    addLog({
      name: `User ${currentUser.email} update permission of model ${model.name}`,
      description: `User ${currentUser.email} update permission of model ${model.name}: Add users ${users.map((u) => u.id).join(',')} as ${role}`,
      type: 'add-permission',
      create_by: currentUser.id!,
      ref_id: model.id,
      ref_type: 'model',
    })
  }

  const handleRemoveUserAccess = async (user: InvitedUser) => {
    if (!model) return

    await deleteModelPermissionService(
      model.id,
      user.access_level_id || '',
      user.id,
    )
    await refetch()
  }

  // After all hooks are called, we can have the conditional return
  if (!model) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner size={32} />
        <p className="text-base text-muted-foreground ml-2">Loading model...</p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'mx-auto flex flex-col rounded-lg border bg-background p-2',
        className,
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex">
          <DaTabItem
            onClick={() => setActiveTab('contributors')}
            active={activeTab === 'contributors'}
          >
            Contributor ({model.contributors?.length ?? 0})
          </DaTabItem>
          <DaTabItem
            onClick={() => setActiveTab('members')}
            active={activeTab === 'members'}
          >
            {' '}
            Member ({model.members?.length ?? 0})
          </DaTabItem>
        </div>
        <Button
          size="sm"
          className="flex items-center text-primary"
          variant="outline"
          onClick={() => setOpen(true)}
        >
          <TbUserPlus className="mr-2" /> Add user
        </Button>
      </div>
      <div className="flex h-full flex-col overflow-y-auto pr-2">
        {activeTab === 'contributors' ? (
          <>
            {' '}
            {model.contributors && (
              <UserList
                users={model.contributors}
                onRemoveUser={onRemoveUser}
              />
            )}
          </>
        ) : (
          <>
            {' '}
            {model.members && (
              <UserList users={model.members} onRemoveUser={onRemoveUser} />
            )}
          </>
        )}
      </div>

      <AccessInvitation
        label="Collaborator Invitation"
        open={open}
        onClose={() => setOpen(false)}
        accessLevels={accessLevels}
        invitedUsers={invitedUsers}
        onInviteUsers={handleInviteUsers}
        onInviteSuccess={(role) => {
          setActiveTab(
            role === 'model_contributor' ? 'contributors' : 'members',
          )
        }}
        onRemoveUserAccess={handleRemoveUserAccess}
      />
    </div>
  )
}

export default DaContributorList
