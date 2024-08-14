import React from 'react'
import { DaButton } from '../atoms/DaButton'
import { DaText } from '../atoms/DaText'
import DaUserProfile from './DaUserProfile'
import { User } from '@/types/user.type'
import { TbMinus, TbUserPlus } from 'react-icons/tb'

interface UserListProps {
  users: User[]
  onRemoveUser: (userId: string) => void
  canRemove?: boolean
}

const DaUserList = ({
  users,
  onRemoveUser,
  canRemove = true,
}: UserListProps) => {
  return (
    <div className="flex flex-col h-full">
      <div className="mt-4 space-y-1 overflow-y-auto">
        {users.map((user, index) => (
          <div
            key={user.id}
            className="flex justify-between items-center border px-4 py-2 border-muted rounded-lg"
          >
            <div className="flex flex-col w-full items-start justify-start">
              <DaUserProfile userId={user.id} showEmail={true} />
            </div>

            <div className="flex min-w-fit items-center">
              {canRemove && (
                <DaButton
                  size="sm"
                  variant="destructive"
                  onClick={() => onRemoveUser(user.id)}
                >
                  <TbMinus className="w-5 h-5 " />
                </DaButton>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DaUserList
