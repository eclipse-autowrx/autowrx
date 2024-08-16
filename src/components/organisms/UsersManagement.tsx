import { DaText } from '../atoms/DaText'
import { DaButton } from '../atoms/DaButton'
import { DaInput } from '../atoms/DaInput'
import { TbPlus, TbSearch, TbX } from 'react-icons/tb'
import { useListUsers } from '@/hooks/useListUsers'
import DaPopup from '../atoms/DaPopup'
import FormCreateUser from '../molecules/forms/FormCreateUser'
import DaLoader from '../atoms/DaLoader'
import { isAxiosError } from 'axios'
import { useEffect, useMemo, useState } from 'react'
import _ from 'lodash'
import { debounce } from 'lodash'
import DaUserListItem from '../molecules/DaUserListItem'
import dayjs from 'dayjs'
import DaManageUserAction from '../molecules/DaManageUserAction'
import { useSearchParams } from 'react-router-dom'

const UsersManagement = () => {
  const [, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const {
    data: users,
    isFetching,
    error,
    fetchNextPage,
    hasNextPage,
    totalResults,
    refetch,
  } = useListUsers({
    includeFullDetails: true,
  })

  const [open, setOpen] = useState(false)

  const debounceSearchQuery = useMemo(() => {
    return debounce((search: string) => {
      if (search !== '') setSearchParams({ search })
      else setSearchParams({})
    }, 500)
  }, [])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    debounceSearchQuery(e.target.value)
  }

  const clearSearch = () => {
    setSearch('')
    debounceSearchQuery('')
    setSearchParams({})
  }

  useEffect(() => {
    const searchFromUrl = new URLSearchParams(window.location.search).get(
      'search',
    )
    if (searchFromUrl) {
      setSearch(searchFromUrl)
    }
  }, [])

  if (error)
    return (
      <DaText className="h-full items-center justify-center flex w-full">
        Error:&nbsp;
        {isAxiosError(error)
          ? (error.response?.data?.message ?? error?.message)
          : error?.message}
      </DaText>
    )

  return (
    <div className="flex flex-col w-full container">
      {/* Header */}
      <div className="mb-4 top-0 pt-6 border-b pb-4 z-[50] bg-white sticky flex-shrink-0 items-center">
        <div className="flex gap-4">
          <span className="space-x-2 w-32 text-da-primary-500">
            <DaText variant="huge-bold">Users:</DaText>
            <DaText variant="huge-bold">{totalResults}</DaText>
          </span>
          <DaPopup state={[open, setOpen]} trigger={<span></span>}>
            <FormCreateUser onClose={() => setOpen(false)} />
          </DaPopup>
          <DaButton variant="solid" onClick={() => setOpen(true)}>
            <TbPlus className="mr-2" /> Create new user
          </DaButton>
          <DaInput
            value={search}
            onChange={handleSearch}
            className="ml-auto"
            placeholder="Search name or email"
            iconBefore={true}
            Icon={TbSearch}
          />
          <DaButton
            disabled={!search}
            onClick={clearSearch}
            variant="plain"
            type="button"
            className="-ml-2"
          >
            Clear <TbX className="ml-2" />
          </DaButton>
        </div>
        {search && (
          <p className="mt-4 da-label-sub-title text-da-black">
            Showing results for "{search}"
          </p>
        )}
      </div>

      {/* List */}

      <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
        {users.map((user) => (
          <div key={user.id} className="flex p-4 border rounded-lg">
            <DaUserListItem user={user} key={user.id} />

            <DaText variant="small" className="ml-auto mr-2 items-center flex">
              Created at:{' '}
              {dayjs(user.created_at).format('DD/MM/YYYY, hh:mm:ss A')}
            </DaText>

            <DaManageUserAction user={user} onUpdateList={refetch} />
          </div>
        ))}
      </div>

      {hasNextPage && (
        <div className="w-full flex mt-6 pb-8">
          <DaButton
            onClick={() => fetchNextPage()}
            disabled={isFetching}
            variant="outline-nocolor"
            className="mx-auto"
          >
            {isFetching && <DaLoader className="mr-2" />}
            Load more
          </DaButton>
        </div>
      )}
      {!hasNextPage && users.length !== 0 && (
        <DaText className="w-full flex justify-center mt-6 pb-8">
          No more users to load.
        </DaText>
      )}
      {!hasNextPage && users.length === 0 && (
        <DaText className="w-full flex justify-center mt-6 pb-8">
          No matches.
        </DaText>
      )}
    </div>
  )
}

export default UsersManagement
