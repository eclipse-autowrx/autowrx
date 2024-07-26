import { useState, useEffect } from 'react'
import { DaAvatar } from '../atoms/DaAvatar'
import { DaText } from '../atoms/DaText'
import { User } from '@/types/user.type'
import { getUserService } from '@/services/user.service'
import { cn } from '@/lib/utils'
import { maskEmail } from '@/lib/utils'

interface DaUserProfileProps {
  userId: string
  className?: string
  avatarClassName?: string
  showEmail?: boolean
  textClassName?: string
}

const DaUserProfile = ({
  userId,
  className,
  avatarClassName = 'mr-2 w-5 h-5',
  showEmail = false,
}: DaUserProfileProps) => {
  const [user, setUser] = useState<User>()

  useEffect(() => {
    getUserService(userId).then((data) => {
      setUser(data)
    })
  }, [userId])

  return (
    <div className={cn('flex items-center', className)}>
      <DaAvatar
        className={avatarClassName}
        src={user?.image_file ?? '/imgs/profile.png'}
      />
      <DaText variant="regular-medium">{user?.name}</DaText>
      {showEmail && (
        <DaText variant="small" className="ml-2">
          {maskEmail(user?.email ?? '')}
        </DaText>
      )}
    </div>
  )
}

export default DaUserProfile
