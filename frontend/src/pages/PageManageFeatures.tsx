// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useState, useEffect } from 'react'
import {
  listUsersByRolesService,
  assignRoleToUserService,
  fetchFeaturesService,
  removeRoleFromUserService,
} from '@/services/permission.service'
import { Button } from '@/components/atoms/button'
import { User } from '@/types/user.type'
import { Spinner } from '@/components/atoms/spinner'
import { TbMinus, TbUserPlus } from 'react-icons/tb'
import DaSelectUserPopup from '@/components/molecules/DaSelectUserPopup'
import usePermissionHook from '@/hooks/usePermissionHook'
import { PERMISSIONS } from '@/data/permission'
import DaUserListItem from '@/components/molecules/DaUserListItem'
import { useToast } from '@/components/molecules/toaster/use-toast'

interface Role {
  permissions: string[]
  name: string
  id: string
}

interface UsersWithRoles {
  users: User[]
  role: Role
}

const PageManageFeatures = () => {
  const [activeTab, setActiveTab] = useState('')
  const [usersWithRoles, setUsersWithRoles] = useState<UsersWithRoles[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [features, setFeatures] = useState<any[]>([])
  const [isAuthorized] = usePermissionHook([PERMISSIONS.MANAGE_USERS])
  const { toast } = useToast()

  const fetchUsersWithRoles = async () => {
    try {
      const response = await listUsersByRolesService()
      setUsersWithRoles(response)
    } catch (error) {
      console.error('Failed to fetch users with roles:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch users with roles',
        variant: 'destructive',
      })
    }
    setLoading(false)
  }

  const fetchPermissions = async () => {
    try {
      const response = await fetchFeaturesService()
      setFeatures(response)
      if (response.length > 0) {
        setActiveTab(response[0].name)
      }
    } catch (error) {
      console.error('Failed to fetch permissions:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch features',
        variant: 'destructive',
      })
    }
  }

  const handleAddUser = async (userId: string) => {
    const activeFeature = features.find((feature) => feature.name === activeTab)
    if (activeFeature) {
      try {
        await assignRoleToUserService(userId, activeFeature.id)
        setOpen(false)
        await fetchUsersWithRoles()
        toast({
          title: 'Success',
          description: 'User added to feature successfully',
        })
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to add user to feature',
          variant: 'destructive',
        })
      }
    }
  }

  const handleRemoveUser = async (userId: string) => {
    const activeFeature = features.find((feature) => feature.name === activeTab)
    if (activeFeature) {
      try {
        await removeRoleFromUserService(userId, activeFeature.id)
        await fetchUsersWithRoles()
        toast({
          title: 'Success',
          description: 'User removed from feature successfully',
        })
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to remove user from feature',
          variant: 'destructive',
        })
      }
    }
  }

  useEffect(() => {
    if (isAuthorized) {
      fetchUsersWithRoles()
      fetchPermissions()
    }
  }, [isAuthorized])

  useEffect(() => {
    const activeFeature = features.find((feature) => feature.name === activeTab)
    if (activeFeature) {
      const filtered = usersWithRoles.filter(
        (roleGroup) => roleGroup.role.id === activeFeature.id,
      )
      setFilteredUsers(filtered.flatMap((roleGroup) => roleGroup.users))
    }
  }, [activeTab, usersWithRoles, features])

  return (
    <div className="container mt-6 flex h-[calc(100%-40px)] w-full flex-col pb-8">
      <h1 className="text-2xl font-bold text-primary">Feature Management</h1>
      {loading ? (
        <div className="flex h-full w-full items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Spinner />
            <p className="text-muted-foreground">Loading users features...</p>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex h-full w-full space-x-2 rounded">
          {features && features.length > 0 ? (
            <div className="flex h-full w-1/4 flex-col rounded-lg border border-border p-2">
              <h2 className="px-2 text-base font-semibold text-primary">
                Feature Categories
              </h2>
              <div className="mt-2 flex h-full w-full flex-col overflow-y-auto">
                {features.map((feature) => (
                  <div
                    key={feature.id}
                    className={`mt-1 flex cursor-pointer items-center truncate whitespace-nowrap rounded-md px-2 py-2 transition-colors ${
                      activeTab === feature.name
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => setActiveTab(feature.name)}
                  >
                    {feature.name}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-full w-1/4 flex-col items-center justify-center rounded-lg border border-border">
              <p className="text-lg text-muted-foreground">
                No features available
              </p>
            </div>
          )}
          {activeTab ? (
            <div className="flex h-full w-3/4 flex-col rounded-lg border border-border p-4">
              <div className="flex h-fit w-full items-center justify-between">
                <h2 className="text-base font-semibold text-primary">
                  {activeTab} ({filteredUsers.length})
                </h2>
                <Button size="sm" onClick={() => setOpen(!open)}>
                  <TbUserPlus className="mr-1 h-4 w-4" /> Add User
                </Button>
              </div>
              {filteredUsers.length > 0 ? (
                <div className="-mx-2 mt-4 flex h-[90%] flex-col gap-2 overflow-y-auto px-2">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center rounded-lg border border-border p-4"
                    >
                      <DaUserListItem user={user} key={user.id} />
                      <Button
                        onClick={() => handleRemoveUser(user.id)}
                        size="sm"
                        variant="destructive"
                        className="ml-auto"
                      >
                        <TbMinus />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <p className="text-lg text-muted-foreground">
                    No users found for this feature.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex min-h-[500px] w-3/4 flex-col rounded-lg border border-border p-4">
              <div className="flex h-full w-full items-center justify-center">
                <p className="text-lg text-muted-foreground">
                  Please select a feature category
                </p>
              </div>
            </div>
          )}
        </div>
      )}
      <DaSelectUserPopup
        selectUser={handleAddUser}
        popupState={[open, setOpen]}
        excludeUsers={filteredUsers}
        includeFullDetails
      />
    </div>
  )
}

export default PageManageFeatures

