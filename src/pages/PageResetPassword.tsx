import { DaButton } from '@/components/atoms/DaButton'
import DaPopup from '@/components/atoms/DaPopup'
import { DaText } from '@/components/atoms/DaText'
import FormResetPassword from '@/components/molecules/forms/FormResetPassword'
import useAuthStore from '@/stores/authStore'
import { TbLogout } from 'react-icons/tb'

const PageResetPassword = () => {
  const access = useAuthStore((state) => state.access)
  const logout = useAuthStore((state) => state.logOut)

  const handleLogout = async () => {
    logout()
    // eslint-disable-next-line no-self-assign
    window.location.href = window.location.href
  }

  return (
    <div className="flex bg-white items-center justify-center">
      {access !== null && access !== undefined ? (
        <DaPopup state={[true, () => {}]} trigger={<span></span>}>
          <div className="w-[400px] min-w-[400px] block px-2 md:px-6 pt-2 pb-4 bg-da-white">
            <DaText className="block">
              You need to logout to perform this action. Please click the button
              below to logout.
            </DaText>
            <DaButton
              onClick={handleLogout}
              className="block w-full gap-2 mt-6"
              variant="gradient"
            >
              <TbLogout className="text-lg" />
              Logout
            </DaButton>
          </div>
        </DaPopup>
      ) : (
        <DaPopup state={[true, () => {}]} trigger={<span></span>}>
          <FormResetPassword />
        </DaPopup>
      )}
    </div>
  )
}

export default PageResetPassword
