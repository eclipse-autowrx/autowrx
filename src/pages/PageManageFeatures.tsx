import { useState, useEffect } from 'react'
import { DaText } from '@/components/atoms/DaText'
import {
  listUsersByRolesService,
  assignRoleToUserService,
} from '@/services/permission.service'
import { DaButton } from '@/components/atoms/DaButton'
import DaUserList from '@/components/molecules/DaUserList'
import { UsersWithRoles } from '@/types/permission.type'
import { User } from '@/types/user.type'
import DaLoading from '@/components/atoms/DaLoading'
import { TbUserPlus } from 'react-icons/tb'
import DaSelectUserPopup from '@/components/molecules/DaSelectUserPopup'
import config from '@/configs/config'

const PageManageFeatures = () => {
  const [activeTab, setActiveTab] = useState(config.features[0].description) // Use features from config
  const [usersWithRoles, setUsersWithRoles] = useState<UsersWithRoles[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]) // Explicitly type as User array
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  const fetchUsersWithRoles = async () => {
    try {
      const response = await listUsersByRolesService()
      // console.log('Users with roles: ', response)
      setUsersWithRoles(response)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch users with roles:', error)
      setLoading(false)
    }
  }

  const handleAddUser = async (userId: string) => {
    const activeFeature = config.features.find(
      (feature) => feature.description === activeTab,
    )
    if (activeFeature) {
      await assignRoleToUserService(userId, activeFeature.id)
      setOpen(false)
      await fetchUsersWithRoles()
    }
  }

  useEffect(() => {
    fetchUsersWithRoles()
    console.log('Fetching users with roles')
  }, [])

  useEffect(() => {
    const activeFeature = config.features.find(
      (feature) => feature.description === activeTab,
    )
    if (activeFeature) {
      const filtered = usersWithRoles.filter(
        (roleGroup) => roleGroup.role.id === activeFeature.id,
      )
      setFilteredUsers(filtered.flatMap((roleGroup) => roleGroup.users))
    }
  }, [activeTab, usersWithRoles])

  return (
    <div className="flex flex-col w-full h-full container mt-6">
      <DaText variant="huge-bold" className="text-da-primary-500">
        Feature Management
      </DaText>
      {loading ? (
        <div>Loading features...</div>
      ) : (
        <div className="flex w-full h-full max-h-[70vh] mt-4 space-x-2 rounded">
          <div className="flex flex-col w-1/4 h-fit py-2 px-1 border rounded-lg border-r">
            {config.features.map(
              (
                feature, // Use features from config
              ) => (
                <div
                  key={feature.id}
                  className={`flex items-center p-4 cursor-pointer da-menu-item whitespace-nowrap truncate ${
                    activeTab === feature.description
                      ? 'bg-da-primary-100 !text-da-primary-500'
                      : ''
                  }`}
                  onClick={() => setActiveTab(feature.description)}
                >
                  {feature.description}
                </div>
              ),
            )}
          </div>
          <div className="flex flex-col w-3/4 min-h-[500px] p-4 border rounded-lg">
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
              <div className="flex flex-col w-full ">
                <DaUserList
                  users={filteredUsers}
                  onRemoveUser={(userId) =>
                    console.log('No API to remove user permission yet:', userId)
                  }
                />
              </div>
            ) : (
              <div>No users found for this feature.</div>
            )}
          </div>
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
