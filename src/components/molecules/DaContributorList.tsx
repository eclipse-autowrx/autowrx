import { DaText } from '@/components/atoms/DaText'
import { TbMinus, TbUserPlus } from 'react-icons/tb'
import { DaButton } from '../atoms/DaButton'
import { DaAvatar } from '../atoms/DaAvatar'
import { cn } from '@/lib/utils'

interface User {
  name: string
  email: string
}

interface ContributorListProps {
  contributors: User[]
  members: User[]
  onAddUser: () => void
  onRemoveUser: (email: string) => void
  className?: string
}

interface UserItemProps {
  user: User
  onRemoveUser: (email: string) => void
}

const UserItem = ({ user, onRemoveUser }: UserItemProps) => (
  <div className="flex items-center justify-between p-2 border my-2 rounded-lg border-da-gray-light bg-da-gray-light/25">
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
      onClick={() => onRemoveUser(user.email)}
    >
      <TbMinus className="text-red-500 cursor-pointer" />
    </div>
  </div>
)

const ContributorList = ({
  contributors,
  members,
  onAddUser,
  onRemoveUser,
  className,
}: ContributorListProps) => {
  return (
    <div
      className={cn(
        'mx-auto p-4 bg-white shadow-sm rounded-lg border border-da-gray-light',
        className,
      )}
    >
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-4">
          <DaText
            variant="regular"
            className="text-da-primary-500 cursor-pointer border-b-2 border-da-primary-500 pb-1"
          >
            Contributor ({contributors.length})
          </DaText>
          <DaText
            variant="regular"
            className="cursor-pointer text-da-gray-dark pb-1"
          >
            Member ({members.length})
          </DaText>
        </div>
        <DaButton
          size="sm"
          onClick={onAddUser}
          className="text-da-primary-500 flex items-center"
        >
          <TbUserPlus className="mr-2" /> Add user
        </DaButton>
      </div>
      <div>
        {contributors.map((user, index) => (
          <UserItem key={index} user={user} onRemoveUser={onRemoveUser} />
        ))}
      </div>
    </div>
  )
}

export default ContributorList
