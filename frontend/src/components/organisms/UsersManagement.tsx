// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { TbPlus, TbSearch, TbX, TbLoader } from 'react-icons/tb'
import { useListUsers } from '@/hooks/useListUsers'
import DaDialog from '@/components/molecules/DaDialog'
import FormCreateUser from '@/components/molecules/forms/FormCreateUser'
import { isAxiosError } from 'axios'
import { useEffect, useMemo, useState } from 'react'
import { debounce } from '@/lib/utils'
import DaUserListItem from '@/components/molecules/DaUserListItem'
import dayjs from 'dayjs'
import DaManageUserAction from '@/components/molecules/DaManageUserAction'
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
  }, [setSearchParams])

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
      <div className="h-full items-center justify-center flex w-full text-muted-foreground">
        Error:&nbsp;
        {isAxiosError(error)
          ? (error.response?.data?.message ?? error?.message)
          : error?.message}
      </div>
    )

  return (
    <div className="flex flex-col w-full container">
      {/* Header */}
      <div className="mb-4 top-0 pt-6 border-b border-border pb-4 z-[50] bg-background sticky flex-shrink-0 items-center">
        <div className="flex gap-4 items-center">
          <span className="space-x-2 w-32 text-primary">
            <span className="text-2xl font-bold">Users:</span>
            <span className="text-2xl font-bold">{totalResults}</span>
          </span>
          <DaDialog
            open={open}
            onOpenChange={setOpen}
            trigger={
              <Button>
                <TbPlus className="mr-2" /> Create new user
              </Button>
            }
          >
            <FormCreateUser onClose={() => setOpen(false)} />
          </DaDialog>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative flex-1 max-w-md">
              <TbSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={handleSearch}
                className="pl-10"
                placeholder="Search name or email"
              />
            </div>
            {search && (
              <Button
                disabled={!search}
                onClick={clearSearch}
                variant="ghost"
                type="button"
                size="sm"
              >
                Clear <TbX className="ml-2" />
              </Button>
            )}
          </div>
        </div>
        {search && (
          <p className="mt-4 text-sm text-muted-foreground">
            Showing results for "{search}"
          </p>
        )}
      </div>

      {/* List */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
        {users.map((user) => (
          <div key={user.id} className="flex p-4 border border-border rounded-lg">
            <DaUserListItem user={user} key={user.id} />

            <span className="ml-auto mr-2 items-center flex text-sm text-muted-foreground">
              Created at:{' '}
              {dayjs(user.created_at).format('DD/MM/YYYY, hh:mm:ss A')}
            </span>

            <DaManageUserAction user={user} onUpdateList={refetch} />
          </div>
        ))}
      </div>

      {hasNextPage && (
        <div className="w-full flex mt-6 pb-8">
          <Button
            onClick={() => fetchNextPage()}
            disabled={isFetching}
            variant="outline"
            className="mx-auto"
          >
            {isFetching && <TbLoader className="mr-2 animate-spin" />}
            Load more
          </Button>
        </div>
      )}
      {!hasNextPage && users.length !== 0 && (
        <div className="w-full flex justify-center mt-6 pb-8 text-muted-foreground">
          No more users to load.
        </div>
      )}
      {!hasNextPage && users.length === 0 && (
        <div className="w-full flex justify-center mt-6 pb-8 text-muted-foreground">
          No matches.
        </div>
      )}
    </div>
  )
}

export default UsersManagement

