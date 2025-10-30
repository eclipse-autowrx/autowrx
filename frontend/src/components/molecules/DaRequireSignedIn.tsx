// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { ReactNode, useState } from 'react'
import useAuthStore from '@/stores/authStore'
import DaDialog from './DaDialog'
import { Button } from '../atoms/button'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import config from '@/configs/config'

interface DaRequireSignedInProps {
  children: ReactNode
  message?: string
}

const DaRequireSignedIn = ({ children, message }: DaRequireSignedInProps) => {
  const { data: user } = useSelfProfileQuery()
  const { openLoginDialog, setOpenLoginDialog } = useAuthStore()
  const [openRemindDialog, setOpenRemindDialog] = useState(false)

  const handleClick = () => {
    if (!user && config.strictAuth) {
      setOpenRemindDialog(true)
    }
  }

  return (
    <>
      {!user ? (
        <>
          <div onClick={handleClick} className="cursor-pointer">
            {children}
          </div>
          <DaDialog open={openRemindDialog} onOpenChange={setOpenRemindDialog}>
            <div className="flex flex-col max-w-xl">
              <h3 className="text-lg font-semibold text-primary">
                Sign In Required
              </h3>
              <p className="mt-4 text-base text-muted-foreground">
                {message || 'You must first sign in to explore this feature'}
              </p>
              <div className="flex justify-end mt-6">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    setOpenRemindDialog(false)
                    setOpenLoginDialog(true)
                  }}
                  className="w-20"
                >
                  Sign In
                </Button>
              </div>
            </div>
          </DaDialog>
        </>
      ) : (
        <>{children}</>
      )}
    </>
  )
}

export default DaRequireSignedIn
