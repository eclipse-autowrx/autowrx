import { DaAvatar } from '../atoms/DaAvatar'
import { DaText } from '../atoms/DaText'
import { cn } from '@/lib/utils'

interface DaUserProfileProps {
  userName?: string
  userAvatar?: string
  className?: string
  avatarClassName?: string
  showEmail?: boolean
  textClassName?: string
}

const DaUserProfile = ({
  userName,
  userAvatar,
  className,
  avatarClassName = 'mr-2 w-5 h-5',
  textClassName,
}: DaUserProfileProps) => {
  return (
    <div className={cn('flex items-center', className)}>
      <DaAvatar
        className={avatarClassName}
        src={userAvatar ?? '/imgs/profile.png'}
      />
      <DaText variant="regular-medium" className={textClassName}>
        {userName}
      </DaText>
    </div>
  )
}

export default DaUserProfile
