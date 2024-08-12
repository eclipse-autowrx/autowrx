import { useState, useEffect } from 'react'
import { DaButton } from '../atoms/DaButton'
import DaPopup from '../atoms/DaPopup'
import FormSignIn from './forms/FormSignIn'
import FormRegister from './forms/FormRegister'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import DaUserMenu from './DaUserMenu'
import FormForgotPassword from './forms/FormForgotPassword'
import useAuthStore from '@/stores/authStore'

const DaNavUser = () => {
  const { openLoginDialog, setOpenLoginDialog } = useAuthStore()
  const [authType, setAuthType] = useState<'sign-in' | 'register' | 'forgot'>(
    'sign-in',
  )

  const handleSetOpenLoginDialog = (value: React.SetStateAction<boolean>) => {
    setOpenLoginDialog(
      typeof value === 'function' ? value(openLoginDialog) : value,
    )
  }

  const { data: user } = useSelfProfileQuery()

  return (
    <div>
      {user ? (
        <DaUserMenu user={user} />
      ) : (
        <DaButton
          variant="plain"
          onClick={() => {
            setOpenLoginDialog(true) // Open the login dialog
          }}
        >
          Sign in
        </DaButton>
      )}

      <DaPopup
        state={[openLoginDialog, handleSetOpenLoginDialog]}
        trigger={<span></span>}
      >
        {authType === 'sign-in' && <FormSignIn setAuthType={setAuthType} />}
        {authType === 'register' && <FormRegister setAuthType={setAuthType} />}
        {authType === 'forgot' && (
          <FormForgotPassword setAuthType={setAuthType} />
        )}
      </DaPopup>
    </div>
  )
}

export default DaNavUser
