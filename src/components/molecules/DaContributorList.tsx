import { useState } from 'react'
import { DaText } from '@/components/atoms/DaText'
import { TbMinus, TbUserPlus } from 'react-icons/tb'
import { DaButton } from '../atoms/DaButton'
import { DaAvatar } from '../atoms/DaAvatar'
import { cn } from '@/lib/utils'
import DaSelectUserPopup from './DaSelectUserPopup'
import { set } from 'lodash'
import { User } from '@/types/user.type'
import { updateModelPermissionService } from '@/services/model.service'
import { useParams } from 'react-router-dom'

interface ContributorListProps {
  contributors: User[]
  members: User[]
  className?: string
}

interface UserItemProps {
  user: User
  onRemoveUser: (userId: string) => void
}

const UserItem = ({ user, onRemoveUser }: UserItemProps) => (
  <div className="flex items-center justify-between p-2 border my-2 rounded-lg border-da-gray-light bg-da-gray-light/25 cursor-pointer">
    <div className="flex items-center">
      <DaAvatar
        src="https://firebasestorage.googleapis.com/v0/b/digital-auto.appspot.com/o/users%2Fperson.png?alt=media&token=df7759f6-37d2-4d57-a684-5463b9e4e86c"
        alt="user"
        className="w-10 h-10 rounded-full mr-4"
      />
      <div className="flex-col flex">
        <DaText variant="regular" className="font-bold text-da-gray-dark">
          {user.name}
        </DaText>
        <DaText variant="small" className="text-da-gray-medium">
          {user.email}
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

const DaContributorList = ({
  contributors,
  members,
  className,
}: ContributorListProps) => {
  const { model_id } = useParams()
  const [activeTab, setActiveTab] = useState('contributors')
  const [open, setOpen] = useState(false)

  if (!contributors || !members || !model_id) {
    return null
  }

  const handleAddUser = (userId: string) => {
    const role =
      activeTab === 'contributors' ? 'model_contributor' : 'model_member'
    updateModelPermissionService(model_id, role, userId)
  }

  const onRemoveUser = (userId: string) => {
    // No API available yet / permission hook is in development
  }

  return (
    <div
      className={cn(
        'flex flex-col mx-auto p-4 bg-white rounded-lg border border-da-gray-light',
        className,
      )}
    >
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-4">
          <div onClick={() => setActiveTab('contributors')}>
            <DaText
              variant="regular"
              className={cn(
                'cursor-pointer pb-1',
                activeTab === 'contributors'
                  ? 'text-da-primary-500 border-b-2 border-da-primary-500'
                  : 'text-da-gray-medium',
              )}
            >
              Contributor ({contributors.length})
            </DaText>
          </div>
          <div onClick={() => setActiveTab('members')}>
            <DaText
              variant="regular"
              className={cn(
                'cursor-pointer pb-1',
                activeTab === 'members'
                  ? 'text-da-primary-500 border-b-2 border-da-primary-500'
                  : 'text-da-gray-medium',
              )}
            >
              Member ({members.length})
            </DaText>
          </div>
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
      <div className="flex flex-col max-h-[400px] overflow-y-auto">
        {activeTab === 'contributors'
          ? contributors.map((user, index) => (
              <UserItem key={index} user={user} onRemoveUser={onRemoveUser} />
            ))
          : members.map((user, index) => (
              <UserItem key={index} user={user} onRemoveUser={onRemoveUser} />
            ))}
      </div>
      <DaSelectUserPopup
        selectUser={handleAddUser}
        popupState={[open, setOpen]}
        excludeUserIds={[]}
      />
    </div>
  )
}

export default DaContributorList
