import { useState, useEffect } from 'react'
import { DaText } from '@/components/atoms/DaText'
import {
  listUsersByRolesService,
  assignRoleToUserService,
  fetchFeaturesService,
  removeRoleFromUserService,
} from '@/services/permission.service'
import { DaButton } from '@/components/atoms/DaButton'
import { UsersWithRoles } from '@/types/permission.type'
import { User } from '@/types/user.type'
import DaLoading from '@/components/atoms/DaLoading'
import { TbMinus, TbUserPlus } from 'react-icons/tb'
import DaSelectUserPopup from '@/components/molecules/DaSelectUserPopup'
import usePermissionHook from '@/hooks/usePermissionHook'
import { PERMISSIONS } from '@/data/permission'
import DaUserListItem from '@/components/molecules/DaUserListItem'

const PageManageFeatures = () => {
  const [activeTab, setActiveTab] = useState('')
  const [usersWithRoles, setUsersWithRoles] = useState<UsersWithRoles[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [features, setFeatures] = useState<any[]>([])
  const [isAuthorized] = usePermissionHook([PERMISSIONS.MANAGE_USERS])

  const fetchUsersWithRoles = async () => {
    try {
      const response = await listUsersByRolesService()
      setUsersWithRoles(response)
    } catch (error) {
      console.error('Failed to fetch users with roles:', error)
    }
    setLoading(false)
  }

  const fetchPermissions = async () => {
    try {
      const response = await fetchFeaturesService()
      //
      setFeatures(response)
      if (response.length > 0) {
        setActiveTab(response[0].name)
      }
    } catch (error) {
      console.error('Failed to fetch permissions:', error)
    }
  }

  const handleAddUser = async (userId: string) => {
    const activeFeature = features.find((feature) => feature.name === activeTab)
    if (activeFeature) {
      await assignRoleToUserService(userId, activeFeature.id)
      setOpen(false)
      await fetchUsersWithRoles()
    }
  }

  const handleRemoveUser = async (userId: string) => {
    const activeFeature = features.find((feature) => feature.name === activeTab)
    if (activeFeature) {
      await removeRoleFromUserService(userId, activeFeature.id)
      await fetchUsersWithRoles()
    }
  }

  useEffect(() => {
    fetchUsersWithRoles()
    fetchPermissions()
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
      <DaText variant="huge-bold" className="text-da-primary-500">
        Feature Management
      </DaText>
      {loading ? (
        <div className="flex h-full w-full items-center justify-center">
          <DaLoading
            text={'Loading users features...'}
            timeoutText={'Failed to load users features'}
            fullScreen={true}
          />
        </div>
      ) : (
        <div className="mt-4 flex h-full w-full space-x-2 rounded">
          {features && features.length > 0 ? (
            <div className="flex h-full w-1/4 flex-col rounded-lg border p-2">
              <DaText variant="regular-bold" className="px-2">
                Feature Categories
              </DaText>
              <div className="mt-2 flex h-full w-full flex-col overflow-y-auto">
                {features.map((feature) => (
                  <div
                    key={feature.id}
                    className={`da-menu-item mt-1 flex items-center truncate whitespace-nowrap ${
                      activeTab === feature.name
                        ? 'bg-da-primary-100 !text-da-primary-500'
                        : ''
                    }`}
                    onClick={() => setActiveTab(feature.name)}
                  >
                    {feature.name}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <DaText
              variant="title"
              className="flex h-full w-1/4 flex-col items-center justify-center rounded-lg border"
            >
              No features available
            </DaText>
          )}
          {activeTab ? (
            <div className="flex h-full w-3/4 flex-col rounded-lg border p-4">
              <div className="flex h-fit w-full items-center justify-between">
                <DaText variant="regular-bold">
                  {activeTab} ({filteredUsers.length})
                </DaText>
                <DaButton
                  size="sm"
                  onClick={() => {
                    setOpen(!open)
                  }}
                >
                  <TbUserPlus className="mr-1 h-4 w-4" /> Add User
                </DaButton>
              </div>
              {filteredUsers.length > 0 ? (
                <div className="-mx-2 mt-4 flex h-[90%] flex-col gap-2 overflow-y-auto px-2">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center rounded-lg border p-4"
                    >
                      <DaUserListItem user={user} key={user.id} />
                      <DaButton
                        onClick={() => handleRemoveUser(user.id)}
                        size="sm"
                        variant="destructive"
                      >
                        <TbMinus />
                      </DaButton>
                    </div>
                  ))}
                </div>
              ) : (
                <DaText
                  variant="title"
                  className="flex h-full w-full items-center justify-center"
                >
                  No users found for this feature.
                </DaText>
              )}
            </div>
          ) : (
            <div className="flex min-h-[500px] w-3/4 flex-col rounded-lg border p-4">
              <DaText
                variant="title"
                className="flex h-full w-full items-center justify-center"
              >
                Please select a feature category
              </DaText>
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
