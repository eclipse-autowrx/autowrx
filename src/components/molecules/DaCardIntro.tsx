import { DaText } from '../atoms/DaText'

interface CardIntroProps {
  title: string
  content: string
  maxWidth?: string
}

const DaCardIntro = ({
  title,
  content,
  maxWidth = '320px',
}: CardIntroProps) => {
  return (
    <div
      className={`flex flex-col p-4 w-full bg-da-white rounded-lg space-y-2 border border-da-gray-light text-da-gray-mediume`}
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
