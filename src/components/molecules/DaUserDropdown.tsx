import { User } from "@/types/user.type"
import { TbLogout } from "react-icons/tb"
import { DaButton } from "../atoms/DaButton"
import useAuthStore from "@/stores/authStore"

interface DaUserDropdownProps {
  user: User
}

const DaUserDropdown = ({ user }: DaUserDropdownProps) => {
  const logOut = useAuthStore((state) => state.logOut)

  const handleLogout = async () => {
    try {
      logOut()
    } catch (error) {
      console.error("Logout failed")
    }
  }

  return (
    <DaButton onClick={handleLogout} variant='plain'>
      <TbLogout className='text-lg mr-2' /> Logout
    </DaButton>
  )
}

export default DaUserDropdown
