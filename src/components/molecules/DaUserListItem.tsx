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
      <div className="space-y-1 flex">
        <div>
          <div className="flex w-full space-x-2 items-center">
            <DaText variant="regular-bold" className="text-da-gray-dark">
              {user.name}
            </DaText>
            {user.role === 'admin' && (
              <DaText
                variant="small-medium"
                className="px-2 bg-da-primary-100 h-fit text-da-primary-500 rounded-lg"
              >
                Admin
              </DaText>
            )}
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
