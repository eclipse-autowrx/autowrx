import { useState, useEffect } from 'react'
import { DaText } from '@/components/atoms/DaText'
import {
  listUsersByRolesService,
  assignRoleToUserService,
  fetchFeaturesService,
  removeRoleFromUserService,
} from '@/services/permission.service'
import { DaButton } from '@/components/atoms/DaButton'
import DaUserList from '@/components/molecules/DaUserList'
import { UsersWithRoles } from '@/types/permission.type'
import { User } from '@/types/user.type'
import DaLoading from '@/components/atoms/DaLoading'
import { TbUserPlus } from 'react-icons/tb'
import DaSelectUserPopup from '@/components/molecules/DaSelectUserPopup'
import usePermissionHook from '@/hooks/usePermissionHook'
import { PERMISSIONS } from '@/data/permission'

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
      // console.log('Permissions fetched', response)
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
    <div className="flex flex-col w-full h-full container mt-6">
      <DaText variant="huge-bold" className="text-da-primary-500">
        Feature Management
      </DaText>
      {loading ? (
        <div className="flex w-full h-full items-center justify-center">
          <DaLoading
            text={'Loading users features...'}
            timeoutText={'Failed to load users features'}
            fullScreen={true}
          />
        </div>
      ) : (
        <div className="flex w-full h-full max-h-[70vh] mt-4 space-x-2 rounded">
          {features && features.length > 0 ? (
            <div className="flex flex-col w-1/4 h-full p-2 border rounded-lg">
              <DaText variant="regular-bold" className="px-2">
                Feature Categories
              </DaText>
              <div className="flex flex-col w-full h-full mt-2 overflow-y-auto">
                {features.map((feature) => (
                  <div
                    key={feature.id}
                    className={`flex mt-1 items-center da-menu-item whitespace-nowrap truncate ${
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
              className="flex flex-col w-1/4 h-full border rounded-lg items-center justify-center"
            >
              No features available
            </DaText>
          )}
          {activeTab ? (
            <div className="flex flex-col w-3/4 h-full p-2 border rounded-lg">
              <div className="flex w-full h-fit items-center justify-between">
                <DaText variant="regular-bold">
                  {activeTab} ({filteredUsers.length})
                </DaText>
                <DaButton
                  size="sm"
                  onClick={() => {
                    setOpen(!open)
                  }}
                >
                  <TbUserPlus className="w-4 h-4 mr-1" /> Add User
                </DaButton>
              </div>
              {filteredUsers.length > 0 ? (
                <div className="flex flex-col h-[90%] w-full ">
                  <DaUserList
                    users={filteredUsers}
                    onRemoveUser={handleRemoveUser}
                  />
                </div>
              ) : (
                <DaText
                  variant="title"
                  className="flex w-full h-full items-center justify-center"
                >
                  No users found for this feature.
                </DaText>
              )}
            </div>
          ) : (
            <div className="flex flex-col w-3/4 min-h-[500px] p-4 border rounded-lg">
              <DaText
                variant="title"
                className="flex w-full h-full items-center justify-center"
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
      />
    </div>
  )
}

export default PageManageFeatures
