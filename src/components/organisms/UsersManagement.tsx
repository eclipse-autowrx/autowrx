import { DaText } from '../atoms/DaText'
import { DaButton } from '../atoms/DaButton'
import { DaInput } from '../atoms/DaInput'
import { TbPlus, TbSearch } from 'react-icons/tb'
import DaUserList from '../molecules/DaUserList'
import { useListUsers } from '@/hooks/useListUsers'
import DaPopup from '../atoms/DaPopup'
import FormCreateUser from '../molecules/forms/FormCreateUser'

const UsersManagement = () => {
  const { data } = useListUsers()

  return (
    <div className="h-full mt-6 flex flex-col w-full">
      <div className="mb-4 flex-shrink-0 flex items-center gap-4">
        <span className="space-x-2 text-da-primary-500">
          <DaText variant="huge-bold">Users:</DaText>
          <DaText variant="huge-bold">16</DaText>
        </span>
        <DaPopup
          trigger={
            <DaButton variant="outline">
              <TbPlus className="mr-2" /> Create new user
            </DaButton>
          }
        >
          <FormCreateUser />
        </DaPopup>
        <DaInput
          className="ml-auto"
          placeholder="Search name or email"
          iconBefore={true}
          Icon={TbSearch}
        />
      </div>
      <DaUserList users={data?.results || []} />
    </div>
  )
}

export default UsersManagement
