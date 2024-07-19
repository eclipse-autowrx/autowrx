import { useState, useEffect } from 'react'
import { DaAvatar } from '../atoms/DaAvatar'
import { DaText } from '../atoms/DaText'
import { User } from '@/types/user.type'
import { getUserService } from '@/services/user.service'
import { cn } from '@/lib/utils'

interface DaUserProfileProps {
  userId: string
  className?: string
  avatarClassName?: string
  textClassName?: string
}

const DaUserProfile = ({ userId, className }: DaUserProfileProps) => {
  const [user, setUser] = useState<User>()

  useEffect(() => {
    getUserService(userId).then((data) => {
      setUser(data)
    })
  }, [userId])

  return (
    <div className={cn('flex items-center', className)}>
      <DaAvatar
        className={cn('w-5 h-5 mr-2')}
        src={user?.image_file ?? '/imgs/profile.png'}
      />
      <DaText variant="small">{user?.name}</DaText>
    </div>
  )
}

export default DaUserProfile
