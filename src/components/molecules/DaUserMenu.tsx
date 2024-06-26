import { User } from '@/types/user.type'
import { TbLogout, TbUser } from 'react-icons/tb'
import { DaButton } from '../atoms/DaButton'
import useAuthStore from '@/stores/authStore'
import DaMenu from '../atoms/DaMenu'
import { DaText } from '../atoms/DaText'
import { Link } from 'react-router-dom'

interface DaUserDropdownProps {
  user: User
}

const DaUserMenu = ({ user }: DaUserDropdownProps) => {
  const logOut = useAuthStore((state) => state.logOut)

  const handleLogout = async () => {
    try {
      logOut()
    } catch (error) {
      console.error('Logout failed')
    }
  }

  return (
    <div className="flex items-center justify-center">
      <DaMenu
        trigger={
          <DaButton variant="plain" className="h-10 w-10 !p-2">
            <picture className="cursor-pointer h-full w-full">
              <source
                srcSet={user.image_file}
                type="image/png"
                className="h-full w-full object-cover rounded-full"
              />
              <img
                src={'/imgs/profile.png'}
                alt="bar"
                className="h-full w-full object-cover rounded-full"
              />
            </picture>
          </DaButton>
        }
      >
        <Link
          to="/profile"
          className="flex px-4 py-2 da-menu-item items-center"
        >
          <DaText variant="small-medium" className="flex items-center gap-2 ">
            <TbUser /> User Profile
          </DaText>
        </Link>
        <div
          onClick={handleLogout}
          className="px-4 py-2 da-menu-item flex items-center gap-2"
        >
          <DaText variant="small-medium" className="flex items-center gap-2">
            <TbLogout /> Logout
          </DaText>
        </div>
      </DaMenu>
    </div>
  )
}

export default DaUserMenu
