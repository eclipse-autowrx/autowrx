// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useState, useEffect, useMemo } from 'react'
import DaDialog from './DaDialog'
import { Input } from '@/components/atoms/input'
import { useListUsers } from '@/hooks/useListUsers'
import { User } from '@/types/user.type'
import { Button } from '@/components/atoms/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/atoms/avatar'
import { debounce } from '@/lib/utils'
import { Spinner } from '@/components/atoms/spinner'

interface DaSelectUserPopupProps {
  popupState: [boolean, React.Dispatch<React.SetStateAction<boolean>>]
  selectUser: (userId: string) => void
  excludeUsers?: User[]
  includeFullDetails?: boolean
}

const DaSelectUserPopup = ({
  popupState,
  selectUser,
  excludeUsers,
  includeFullDetails = false,
}: DaSelectUserPopupProps) => {
  const [search, setSearch] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [open, setOpen] = popupState

  // Always fetch initial 100 users without search filter
  const { data: initialUsers, isLoading: initialLoading } = useListUsers(
    {
      includeFullDetails,
      limit: 100,
    },
    {
      disableAutoSearchRefetch: true,
    },
  )

  // Fetch search results if there's a search term
  const { data: searchResults, isLoading: searchLoading } = useListUsers(
    {
      includeFullDetails,
      search: searchTerm,
      limit: 100,
    },
    {
      disableAutoSearchRefetch: true,
    },
  )

  const [renderUsers, setRenderUsers] = useState<User[]>([])
  const isLoading = initialLoading || searchLoading

  // Debounced search function
  const debouncedSearch = useMemo(() => {
    return debounce((value: string) => {
      setSearchTerm(value)
    }, 500)
  }, [])

  // Handle input change with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearch(value) // Update the input immediately
    debouncedSearch(value) // Debounce the actual search
  }

  useEffect(() => {
    if (!initialUsers) {
      return
    }

    let usersToRender = initialUsers

    // If searching and we have search results, use those instead
    if (searchTerm !== '' && searchResults) {
      // If search results exist and aren't empty, use them
      if (searchResults.length > 0) {
        usersToRender = searchResults
      } else if (search) {
        // If server search returned nothing, try client-side filtering
        usersToRender = initialUsers.filter(
          (user: User) =>
            user.name?.toLowerCase().includes(search.toLowerCase()) ||
            user.email?.toLowerCase().includes(search.toLowerCase()),
        )
      }
    }

    // Filter out excluded users
    usersToRender = usersToRender.filter(
      (user: User) =>
        !(excludeUsers || []).some(
          (excludedUser) => excludedUser && excludedUser.id === user.id,
        ),
    )

    setRenderUsers(usersToRender)
  }, [initialUsers, searchResults, searchTerm, search, excludeUsers])

  return (
    <DaDialog
      open={open}
      onOpenChange={setOpen}
      trigger={<></>}
      dialogTitle="Select user"
      className="max-w-[700px]"
      contentContainerClassName="max-h-[85vh]"
    >
      <div className="flex min-w-[500px] select-none flex-col rounded">
        <div className="mt-2 px-2">
          <Input
            className="border-t-2 pt-3"
            placeholder="Search"
            value={search}
            onChange={handleSearchChange}
          />
          <div className="-mx-4 mt-2 max-h-[400px] min-h-[400px] overflow-auto p-1 px-4 xl:max-h-[600px]">
            {isLoading ? (
              <div className="flex h-full w-full items-center justify-center">
                <Spinner />
              </div>
            ) : renderUsers.length > 0 ? (
              renderUsers.map((user: User) => (
                <div
                  key={user.id}
                  className="flex cursor-pointer items-center gap-x-3 border-b border-border py-3 transition-colors hover:bg-muted/50"
                  onClick={() => {
                    if (selectUser) {
                      selectUser(user.id)
                    }
                    setOpen(false)
                  }}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={user?.image_file || '/imgs/profile.png'}
                      alt={user.name || 'User'}
                    />
                    <AvatarFallback>
                      <img
                        src="/imgs/profile.png"
                        alt="profile"
                        className="h-full w-full rounded-full object-cover"
                      />
                    </AvatarFallback>
                  </Avatar>
                  <div className="grow py-1">
                    <p className="text-base font-semibold text-primary">
                      {user.name}
                    </p>
                    {user.email && (
                      <div className="text-sm italic text-muted-foreground">
                        {user?.email ?? ''}{' '}
                        {user.provider && (
                          <span>
                            {' '}
                            via @{user.provider}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary hover:bg-primary/10"
                  >
                    Select
                  </Button>
                </div>
              ))
            ) : (
              <div className="flex w-full justify-center text-muted-foreground">
                No user found
              </div>
            )}
          </div>
        </div>
      </div>
    </DaDialog>
  )
}

export default DaSelectUserPopup

