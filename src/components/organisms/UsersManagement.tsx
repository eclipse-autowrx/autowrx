import { DaText } from '../atoms/DaText'
import { DaButton } from '../atoms/DaButton'
import { DaInput } from '../atoms/DaInput'
import { TbPlus, TbSearch } from 'react-icons/tb'
import DaUserList from '../molecules/DaUserList'
import { useListUsers } from '@/hooks/useListUsers'
import DaPopup from '../atoms/DaPopup'
import FormCreateUser from '../molecules/forms/FormCreateUser'
import DaLoader from '../atoms/DaLoader'
import { isAxiosError } from 'axios'
import { useState } from 'react'

const UsersManagement = () => {
  const { data, isLoading, error } = useListUsers()
  const [open, setOpen] = useState(false)

  if (isLoading)
    return (
      <div className="h-full flex w-full">
        <DaLoader className="m-auto" />
      </div>
    )

  if (error)
    return (
      <DaText className="h-full items-center justify-center flex w-full">
        Error:&nbsp;
        {isAxiosError(error)
          ? error.response?.data?.message ?? error?.message
          : error?.message}
      </DaText>
    )

  if (!data) return null

  return (
    <div className="h-full mt-6 flex flex-col w-full">
      {/* Header */}
      <div className="mb-4 flex-shrink-0 flex items-center gap-4">
        <span className="space-x-2 text-da-primary-500">
          <DaText variant="huge-bold">Users:</DaText>
          <DaText variant="huge-bold">16</DaText>
        </span>
        <DaPopup state={[open, setOpen]} trigger={<span></span>}>
          <FormCreateUser onClose={() => setOpen(false)} />
        </DaPopup>
        <DaButton variant="outline" onClick={() => setOpen(true)}>
          <TbPlus className="mr-2" /> Create new user
        </DaButton>
        <DaInput
          className="ml-auto"
          placeholder="Search name or email"
          iconBefore={true}
          Icon={TbSearch}
        />
      </div>

      {/* List */}
      <DaUserList users={data?.results || []} />
    </div>
  )
}

export default UsersManagement
