// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useState, useEffect, useMemo } from 'react'
import DaPopup from '../atoms/DaPopup'
import { DaInput } from '../atoms/DaInput'
import { useListUsers } from '@/hooks/useListUsers'
import { User } from '@/types/user.type'
import { DaText } from '../atoms/DaText'
import { DaButton } from '../atoms/DaButton'
import { DaAvatar } from '../atoms/DaAvatar'
import debounce from 'lodash/debounce'

interface DaSelectUserProps {
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
}: DaSelectUserProps) => {
  const [search, setSearch] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

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
    <>
      <DaPopup
        state={popupState}
        trigger={<span></span>}
        className="w-[700px] h-[85vh]"
      >
        <div className="min-w-[500px] select-none rounded">
          <div className="flex items-center border-da-gray-light px-3 py-1 text-xl font-bold">
            <DaText variant="sub-title" className="text-da-primary-500">
              Select user
            </DaText>
            <div className="grow"></div>
            <DaButton
              variant="outline-nocolor"
              size="sm"
              className="text-da-primary-500"
              onClick={() => {
                popupState[1](false)
              }}
            >
              Close
            </DaButton>
          </div>
          <div className="mt-2 px-2">
            <DaInput
              className="border-t-2 pt-3"
              placeholder="Search"
              value={search}
              onChange={handleSearchChange}
            />
            <div className="-mx-4 mt-2 max-h-[400px] min-h-[400px] overflow-auto p-1 px-4 xl:max-h-[600px]">
              {isLoading ? (
                <DaText className="flex h-full w-full items-center justify-center">
                  Loading...
                </DaText>
              ) : renderUsers.length > 0 ? (
                renderUsers.map((user: User) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-x-3 border-b border-slate-200 py-3"
                  >
                    <DaAvatar src={user?.image_file} />
                    <div className="grow py-1">
                      <DaText
                        variant="regular-bold"
                        className="text-da-gray-meidum"
                      >
                        {user.name}
                      </DaText>
                      {user.email && (
                        <div className="da-label-small italic">
                          {user?.email ?? ''} {''}
                          {user.provider && (
                            <span>
                              {''}via @{user.provider}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div
                      className="flex items-center justify-center"
                      onClick={() => {
                        if (selectUser) {
                          selectUser(user.id)
                        }
                        popupState[1](false)
                      }}
                    >
                      <DaText
                        variant="small-bold"
                        className="cursor-pointer rounded-md px-2 py-1 text-da-primary-500 hover:bg-da-primary-100"
                      >
                        Select
                      </DaText>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex w-full justify-center text-da-gray-medium">
                  No user found
                </div>
              )}
            </div>
          </div>
        </div>
      </DaPopup>
    </>
  )
}

export default DaSelectUserPopup
