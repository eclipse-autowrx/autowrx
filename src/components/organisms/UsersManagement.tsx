import { DaText } from '../atoms/DaText'
import { DaButton } from '../atoms/DaButton'
import { DaInput } from '../atoms/DaInput'
import { TbPlus, TbSearch } from 'react-icons/tb'
import DaUserManagementList from '../molecules/DaUserManagementList'
import { useListUsers } from '@/hooks/useListUsers'
import DaPopup from '../atoms/DaPopup'
import FormCreateUser from '../molecules/forms/FormCreateUser'
import DaLoader from '../atoms/DaLoader'
import { isAxiosError } from 'axios'
import { useEffect, useMemo, useState } from 'react'
import _ from 'lodash'

const UsersManagement = () => {
  const { data, isLoading, error } = useListUsers()
  const [filteredUsers, setFilteredUsers] = useState(data?.results || [])
  const [search, setSearch] = useState('')

  const [open, setOpen] = useState(false)

  const filter = useMemo(() => {
    return _.debounce((search: string) => {
      if (!data) return

      if (search === '') {
        setFilteredUsers(data.results)
        return
      }

      const keyword = search.toLowerCase()
      const filtered = data.results.filter(
        (user) =>
          user.name.toLowerCase().includes(keyword) ||
          user.email.toLowerCase().includes(keyword),
      )

      setFilteredUsers(filtered)
    }, 500)
  }, [data])

  useEffect(() => {
    filter(search)
  }, [data, search, filter])

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
    <div className="h-full mt-6 flex flex-col w-full container">
      {/* Header */}
      <div className="mb-4 flex-shrink-0 flex items-center gap-4">
        <span className="space-x-2 text-da-primary-500">
          <DaText variant="huge-bold">Users:</DaText>
          <DaText variant="huge-bold">16</DaText>
        </span>
        <DaPopup state={[open, setOpen]} trigger={<span></span>}>
          <FormCreateUser onClose={() => setOpen(false)} />
        </DaPopup>
        <DaButton variant="solid" size="sm" onClick={() => setOpen(true)}>
          <TbPlus className="mr-2" /> Create new user
        </DaButton>
        <DaInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ml-auto"
          placeholder="Search name or email"
          iconBefore={true}
          Icon={TbSearch}
        />
      </div>

      {/* List */}
      <DaUserManagementList users={filteredUsers} />
    </div>
  )
}

export default UsersManagement
