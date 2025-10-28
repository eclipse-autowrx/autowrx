// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useState, useEffect } from 'react'
import { Button } from '@/components/atoms/button'
import DaDialog from '@/components/molecules/DaDialog'
import FormSignIn from './forms/FormSignIn.tsx'
import FormRegister from './forms/FormRegister.tsx'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import DaUserMenu from './DaUserMenu.tsx'
import FormForgotPassword from './forms/FormForgotPassword.tsx'
import useAuthStore from '@/stores/authStore.ts'

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
    <div className="flex w-full">
      {user ? (
        <DaUserMenu user={user} />
      ) : (
        <Button
          variant="outline"
          onClick={() => {
            setOpenLoginDialog(true) // Open the login dialog
          }}
        >
          Sign In
        </Button>
      )}

      <DaDialog
        open={openLoginDialog}
        onOpenChange={handleSetOpenLoginDialog}
        className="h-fit w-full overflow-auto max-w-md"
      >
        {authType === 'sign-in' && <FormSignIn setAuthType={setAuthType} />}
        {authType === 'register' && <FormRegister setAuthType={setAuthType} />}
        {authType === 'forgot' && (
          <FormForgotPassword setAuthType={setAuthType} />
        )}
      </DaDialog>
    </div>
  )
}

export default DaNavUser
