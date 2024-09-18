import { User } from '@/types/user.type'
import { DaAvatar } from '../atoms/DaAvatar'
import { DaText } from '../atoms/DaText'

const DaUserListItem = ({ user }: { user: User }) => {
  return (
    <div key={user.id} className="flex flex-1">
      <DaAvatar
        src={user.image_file || './imgs/profile.png'}
        className="mr-4"
        alt="user"
      />

      {/* Information */}
      <div className="flex space-y-1">
        <div>
          <div className="flex w-full items-center space-x-2">
            <DaText variant="regular-bold" className="text-da-gray-dark">
              {user.name}
            </DaText>
          </div>

          <DaText variant="small" className="block">
            {user.email}
          </DaText>
        </div>
      </div>
    </div>
  )
}

export default DaUserListItem
