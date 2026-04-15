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
import { useAuthConfigs } from '@/hooks/useAuthConfigs'

interface DaRequireSignedInProps {
  children: ReactNode
  message?: string
}

const DaRequireSignedIn = ({ children, message }: DaRequireSignedInProps) => {
  const { data: user, isLoading, isFetching } = useSelfProfileQuery()
  const { authConfigs } = useAuthConfigs()
  const { openLoginDialog, setOpenLoginDialog, authBootstrapped } = useAuthStore()
  const [openRemindDialog, setOpenRemindDialog] = useState(false)
  const isResolvingAuth = !authBootstrapped || (!user && (isLoading || isFetching))

  const handleClick = () => {
    if (isResolvingAuth) {
      return
    }
    // Show login dialog if not signed in and public viewing is disabled
    if (!user && !authConfigs.PUBLIC_VIEWING) {
      setOpenRemindDialog(true)
    }
  }

  return (
    <>
      {!user ? (
        <>
          <div
            onClick={handleClick}
            className={isResolvingAuth ? 'cursor-default' : 'cursor-pointer'}
          >
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
