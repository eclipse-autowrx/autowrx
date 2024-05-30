import { User } from '@/types/user.type'
import { DaAvatar } from '../atoms/DaAvatar'
import { TbPencil, TbTrash, TbUser, TbUserFilled } from 'react-icons/tb'
import { DaText } from '../atoms/DaText'
import { DaButton } from '../atoms/DaButton'
import dayjs from 'dayjs'
import DaPopup from '../atoms/DaPopup'
import FormCreateUser from './forms/FormCreateUser'
import FormAlert from './forms/FormAlert'

interface DaUserListProps {
  users: User[]
}

const DaUserList = ({ users }: DaUserListProps) => {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      {users.map((user) => (
        <div className="flex w-full p-2">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <DaAvatar
              src={user.image_file || ''}
              alt="user"
              className="w-[72px] h-[72px] rounded-full mr-4"
              fallback={
                <div className="h-[72px] w-[72px] flex items-center justify-center">
                  <TbUserFilled className="text-2xl" />
                </div>
              }
            />
          </div>

          {/*  */}
          <div>
            <DaText className="block text-da-black">{user.name}</DaText>
            <DaText variant="small" className="block">
              {user.email}
            </DaText>
            <div className="block rounded-full bg-da-primary-100 w-fit px-2">
              <DaText variant="small">Is Admin</DaText>
            </div>
          </div>

          <div className="ml-auto items-end flex gap-2 flex-col">
            <div>
              <DaPopup
                trigger={
                  <DaButton variant="plain" size="sm">
                    <TbPencil className="text-lg" />
                  </DaButton>
                }
              >
                <FormCreateUser />
              </DaPopup>

              <DaPopup
                trigger={
                  <DaButton variant="destructive" size="sm">
                    <TbTrash className="text-lg" />
                  </DaButton>
                }
              >
                <FormAlert />
              </DaPopup>
            </div>
            <DaText variant="small" className="block">
              Created at:{' '}
              {dayjs(user.created_at).format('DD/MM/YYYY, hh:mm:ss A')}
            </DaText>
          </div>
        </div>
      ))}
    </div>
  )
}

export default DaUserList
