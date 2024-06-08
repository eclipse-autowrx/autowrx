import { DaText } from '../atoms/DaText'
import { cn } from '@/lib/utils'

interface CardIntroProps {
  title: string
  content: string
  maxWidth?: string
  className?: string
}

const DaCardIntro = ({
  title,
  content,
  maxWidth = '320px',
  className,
}: CardIntroProps) => {
  return (
    <div
      className={cn(
        `flex flex-col p-4 w-full bg-da-white rounded-lg space-y-2 border border-da-gray-light text-da-gray-medium hover:border-da-primary-500`,
        className,
      )}
      style={{ maxWidth: maxWidth }}
    >
      <DaText variant="sub-title">{title}</DaText>
      <DaText variant="small" className="text-da-gray-medium">
        {content}
      </DaText>
    </div>
  )
}

export { DaCardIntro }
