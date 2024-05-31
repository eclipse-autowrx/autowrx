import { User } from '@/types/user.type'
import { DaAvatar } from '../atoms/DaAvatar'
import { TbPencil, TbTrash, TbUser, TbUserFilled } from 'react-icons/tb'
import { DaText } from '../atoms/DaText'
import { DaButton } from '../atoms/DaButton'
import dayjs from 'dayjs'
import DaPopup from '../atoms/DaPopup'
import FormCreateUser from './forms/FormCreateUser'
import FormAlert from './forms/FormAlert'
import { useState } from 'react'
import { isAxiosError } from 'axios'
import { useListUsers } from '@/hooks/useListUsers'
import { deleteUserService } from '@/services/user.service'

interface DaUserListProps {
  users: User[]
}

const DaUserList = ({ users }: DaUserListProps) => {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      {users.map((user) => (
        <DaUser user={user} key={user.id} />
      ))}
    </div>
  )
}

const DaUser = ({ user }: { user: User }) => {
  const [open, setOpen] = useState(false)
  const [openDelete, setOpenDelete] = useState(false)
  const [loading, setLoading] = useState(false)
  const { refetch } = useListUsers()

  const deleteUser = async () => {
    try {
      setLoading(true)
      await deleteUserService(user.id)
      await refetch()
      setOpenDelete(false)
    } catch (error) {
      console.log(
        isAxiosError(error)
          ? error.response?.data?.message
          : 'Something went wrong',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div key={user.id} className="flex w-full px-2 py-3">
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

      {/* Information */}
      <div>
        <DaText className="block text-da-black">{user.name}</DaText>
        <DaText variant="small" className="block">
          {user.email}
        </DaText>
        {user.role === 'admin' && (
          <div className="block rounded-full bg-da-primary-100 w-fit px-2">
            <DaText variant="small">Is Admin</DaText>
          </div>
        )}
      </div>

      {/* Action */}
      <div className="ml-auto items-end flex gap-2 flex-col">
        <div>
          <DaPopup state={[open, setOpen]} trigger={<span></span>}>
            <FormCreateUser updateData={user} onClose={() => setOpen(false)} />
          </DaPopup>
          <DaButton onClick={() => setOpen(true)} variant="plain" size="sm">
            <TbPencil className="da-label-regular" />
          </DaButton>

          <DaPopup state={[openDelete, setOpenDelete]} trigger={<span></span>}>
            <FormAlert
              loading={loading}
              onConfirm={deleteUser}
              onCancel={() => setOpenDelete(false)}
            >
              <DaText>
                Are you sure you want to delete user '{user.name}'
              </DaText>
            </FormAlert>
          </DaPopup>
          <DaButton
            onClick={() => setOpenDelete(true)}
            variant="destructive"
            size="sm"
          >
            <TbTrash className="da-label-regular" />
          </DaButton>
        </div>
        <DaText variant="small" className="block">
          Created at: {dayjs(user.created_at).format('DD/MM/YYYY, hh:mm:ss A')}
        </DaText>
      </div>
    </div>
  )
}

export default DaUserList
