import { useMemo, useState } from 'react'
import { DaText } from '@/components/atoms/DaText'
import { TbMinus, TbUserPlus } from 'react-icons/tb'
import { DaButton } from '../atoms/DaButton'
import { DaAvatar } from '../atoms/DaAvatar'
import { cn } from '@/lib/utils'
import DaSelectUserPopup from './DaSelectUserPopup'
import { InvitedUser, User } from '@/types/user.type'
import {
  updateModelPermissionService,
  deleteModelPermissionService,
} from '@/services/model.service'
import useCurrentModel from '@/hooks/useCurrentModel'
import DaLoading from '../atoms/DaLoading'
import DaTabItem from '../atoms/DaTabItem'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { addLog } from '@/services/log.service'
import { maskEmail } from '@/lib/utils'
import AccessInvitation from '../organisms/AccessInvitation'

interface ContributorListProps {
  className?: string
}

interface UserItemProps {
  user: User
  onRemoveUser: (userId: string) => void
}

const UserItem = ({ user, onRemoveUser }: UserItemProps) => {
  if (!user) {
    return null
  }

  return (
    <div className="my-2 flex cursor-pointer items-center justify-between rounded-lg border border-da-gray-light bg-da-gray-light/25 p-2">
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
        onClick={() => onRemoveUser(user.id)}
      >
        <TbMinus className="cursor-pointer text-red-500" />
      </div>
    </div>
  )
}

const DaContributorList = ({ className }: ContributorListProps) => {
  const { data: model, refetch } = useCurrentModel()
  const [activeTab, setActiveTab] = useState('contributors')
  const { data: currentUser } = useSelfProfileQuery()
  const [open, setOpen] = useState(false)

  if (!model) {
    return (
      <DaLoading
        text="Loading model..."
        timeout={10}
        timeoutText="Model not found"
      />
    )
  }

  const onRemoveUser = async (userId: string) => {
    const role =
      activeTab === 'contributors' ? 'model_contributor' : 'model_member'
    await deleteModelPermissionService(model.id, role, userId)
    await refetch()
    addLog({
      name: `User ${currentUser?.email} delete user permission from ${model.name}`,
      description: `User ${currentUser?.email} delete user permission from ${model.name}: Delete user ${userId} from role ${role}`,
      type: 'delete-permission',
      create_by: currentUser?.id!,
      ref_id: model.id,
      ref_type: 'model',
    })
  }

  const invitedUsers: InvitedUser[] = useMemo(() => {
    const modelContributors = (model.contributors || []).map((c) => ({
      name: c.name,
      id: c.id,
      email: c.email || '',
      image_file: c.image_file,
      access_level: 'Contributor',
      access_level_id: 'model_contributor',
    }))
    const modelMembers = (model.members || []).map((c) => ({
      name: c.name,
      id: c.id,
      email: c.email || '',
      image_file: c.image_file,
      access_level: 'Member',
      access_level_id: 'model_member',
    }))

    const results = [...modelContributors, ...modelMembers]

    results.push({
      name: model.created_by?.name || '',
      id: model.created_by?.id || '',
      email: model.created_by?.email || '',
      image_file: model.created_by?.image_file,
      access_level: 'Owner',
      access_level_id: 'owner',
    })
    return results
  }, [model])

  const handleInviteUsers = async (users: InvitedUser[], role: string) => {
    await updateModelPermissionService(
      model.id,
      role,
      users.map((u) => u.id).join(','),
    )
    await refetch()
    addLog({
      name: `User ${currentUser?.email} update permission of model ${model.name}`,
      description: `User ${currentUser?.email} update permission of model ${model.name}: Add users ${users.map((u) => u.id).join(',')} as ${role}`,
      type: 'add-permission',
      create_by: currentUser?.id!,
      ref_id: model.id,
      ref_type: 'model',
    })
  }

  const handleRemoveUserAccess = async (user: InvitedUser) => {
    await deleteModelPermissionService(
      model.id,
      user.access_level_id || '',
      user.id,
    )
    await refetch()
  }

  return (
    <div
      className={cn(
        'mx-auto flex flex-col rounded-lg border border-da-gray-light bg-white p-4',
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
        <DaButton
          size="sm"
          className="flex items-center text-da-primary-500"
          variant="outline-nocolor"
          onClick={() => setOpen(true)}
        >
          <TbUserPlus className="mr-2" /> Add user
        </DaButton>
      </div>
      <div className="flex max-h-[400px] flex-col overflow-y-auto pr-2">
        {activeTab === 'contributors' ? (
          <>
            {' '}
            {model &&
              model.contributors &&
              model.contributors.map((user: any, index: number) => (
                <UserItem key={index} user={user} onRemoveUser={onRemoveUser} />
              ))}
          </>
        ) : (
          <>
            {' '}
            {model &&
              model.members &&
              model.members.map((user, index) => (
                <UserItem key={index} user={user} onRemoveUser={onRemoveUser} />
              ))}
          </>
        )}
      </div>

      <AccessInvitation
        label="Collaborator Invitation"
        open={open}
        setOpen={setOpen}
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
