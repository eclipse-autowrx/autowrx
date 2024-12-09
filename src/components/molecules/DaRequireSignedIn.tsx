import { ReactNode, useState } from 'react'
import useAuthStore from '@/stores/authStore'
import DaPopup from '../atoms/DaPopup'
import { DaButton } from '../atoms/DaButton'
import { DaText } from '../atoms/DaText'
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
          <DaPopup
            state={[openRemindDialog, setOpenRemindDialog]}
            trigger={<span></span>}
          >
            <div className="flex flex-col max-w-xl">
              <DaText variant="sub-title" className="text-da-primary-500">
                Sign In Required
              </DaText>
              <DaText className="mt-4">
                {message || 'You must first sign in to explore this feature'}
              </DaText>
              <div className="flex justify-end mt-6">
                <DaButton
                  variant="solid"
                  size="sm"
                  onClick={() => {
                    setOpenRemindDialog(false)
                    setOpenLoginDialog(true)
                  }}
                  className="w-20"
                >
                  Sign In
                </DaButton>
              </div>
            </div>
          </DaPopup>
        </>
      ) : (
        <>{children}</>
      )}
    </>
  )
}

export default DaRequireSignedIn
