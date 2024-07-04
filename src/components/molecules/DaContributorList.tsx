import { useState } from 'react'
import { DaText } from '@/components/atoms/DaText'
import { TbMinus, TbUserPlus } from 'react-icons/tb'
import { DaButton } from '../atoms/DaButton'
import { DaAvatar } from '../atoms/DaAvatar'
import { cn } from '@/lib/utils'
import DaSelectUserPopup from './DaSelectUserPopup'
import { User } from '@/types/user.type'
import {
  updateModelPermissionService,
  deleteModelPermissionService,
} from '@/services/model.service'
import { maskEmail } from '@/lib/utils'
import useCurrentModel from '@/hooks/useCurrentModel'
import DaLoading from '../atoms/DaLoading'
import DaTabItem from '../atoms/DaTabItem'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { addLog } from '@/services/log.service'

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
    <div className="flex items-center justify-between p-2 border my-2 rounded-lg border-da-gray-light bg-da-gray-light/25 cursor-pointer">
      <div className="flex items-center">
        <DaAvatar
          src="/imgs/profile.png"
          alt="user"
          className="w-10 h-10 rounded-full mr-4"
        />
        <div className="flex-col flex">
          <DaText variant="regular" className="font-bold text-da-gray-dark">
            {user.name ?? 'Loading...'}
          </DaText>
          <DaText variant="small" className="text-da-gray-medium">
            {maskEmail(user.email)}
          </DaText>
        </div>
      </div>
      <div
        className="p-2 hover:bg-red-200 rounded-lg"
        onClick={() => onRemoveUser(user.id)}
      >
        <TbMinus className="text-red-500 cursor-pointer" />
      </div>
    </div>
  )
}

const DaContributorList = ({ className }: ContributorListProps) => {
  const { data: model, refetch } = useCurrentModel()
  const [activeTab, setActiveTab] = useState('contributors')
  const [open, setOpen] = useState(false)
  const { data: currentUser } = useSelfProfileQuery()

  if (!model) {
    return (
      <DaLoading
        text="Loading model..."
        timeout={10}
        timeoutText="Model not found"
      />
    )
  }

  const handleAddUser = async (userId: string) => {
    const role =
      activeTab === 'contributors' ? 'model_contributor' : 'model_member'
    await updateModelPermissionService(model.id, role, userId)
    addLog({
      name: `User ${currentUser?.email} update permission of model ${model.name}`,
      description: `User ${currentUser?.email} update permission of model ${model.name}: Add user ${userId} as ${role}`,
      type: 'add-permission',
      create_by: currentUser?.id!,
      ref_id: model.id,
      ref_type: 'model',
    })
    await refetch()
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

  return (
    <div
      className={cn(
        'flex flex-col mx-auto p-4 bg-white rounded-lg border border-da-gray-light',
        className,
      )}
    >
      <div className="flex justify-between items-center mb-4">
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
          onClick={() => {
            setOpen(true)
          }}
          className="text-da-primary-500 flex items-center"
          variant="outline-nocolor"
        >
          <TbUserPlus className="mr-2" /> Add user
        </DaButton>
      </div>
      <div className="flex flex-col max-h-[400px] pr-2 overflow-y-auto">
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
      <DaSelectUserPopup
        selectUser={handleAddUser}
        popupState={[open, setOpen]}
        excludeUsers={
          activeTab === 'contributors'
            ? model.contributors ?? []
            : model.members ?? []
        }
      />
    </div>
  )
}

export default DaContributorList
