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

const DaUserManagementList = ({ users }: DaUserListProps) => {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto pr-4 space-y-2">
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
    <div key={user.id} className="flex w-full p-4 border rounded-lg">
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

      {/* Action */}
      <div className="ml-auto items-center flex gap-2">
        <DaText variant="small" className="flex">
          Created at: {dayjs(user.created_at).format('DD/MM/YYYY, hh:mm:ss A')}
        </DaText>
        <div>
          <DaPopup state={[open, setOpen]} trigger={<span></span>}>
            <FormCreateUser updateData={user} onClose={() => setOpen(false)} />
          </DaPopup>
          <DaButton onClick={() => setOpen(true)} variant="plain" size="sm">
            <TbPencil className="w-5 h-5" />
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
            <TbTrash className="w-5 h-5" />
          </DaButton>
        </div>
      </div>
    </div>
  )
}

export default DaUserManagementList
