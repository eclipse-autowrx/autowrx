import { DaImageRatio } from '../atoms/DaImageRatio'
import { DaTag } from '../atoms/DaTag'
import { DaText } from '../atoms/DaText'
import { Prototype } from '@/types/model.type'
import { cn } from '@/lib/utils'
import DaUserProfile from './DaUserProfile'

interface DaItemStandardProps {
  prototype: Prototype
  creatorId: string
  maxWidth?: string
  imageMaxWidth?: string
  isSelected?: boolean
}

const DaItemStandard: React.FC<DaItemStandardProps> = ({
  prototype,
  creatorId,
  maxWidth = '500px',
  imageMaxWidth = '300px',
  isSelected = false,
}) => {
  return (
    <div
      className={`flex w-full p-4 border border-da-gray-light rounded-lg bg-da-white max-w-lg space-x-4 text-da-gray-medium hover:border-da-primary-500 overflow-hidden ${
        isSelected ? 'border-da-primary-500 !bg-da-primary-100' : ''
      }`}
      style={{ maxWidth: maxWidth }}
    >
      <DaImageRatio
        src={
          prototype.image_file
            ? prototype.image_file
            : 'https://placehold.co/600x400'
        }
        alt="Image"
        className="w-full h-full rounded-lg"
        ratio={1 / 1}
        maxWidth={imageMaxWidth}
      />

      <div className="flex flex-col justify-between overflow-hidden w-ful">
        <div className="flex flex-col space-y-2">
          <DaText
            variant="regular-bold"
            className={cn(
              'text-da-gray-medium',
              isSelected ? 'text-da-primary-500' : '',
            )}
          >
            {prototype.name}
          </DaText>
          <DaUserProfile userId={creatorId} />
          <DaText
            variant="small"
            className="w-full line-clamp-2 text-da-gray-medium"
          >
            {prototype.description.problem}
          </DaText>
        </div>
        {prototype.tags && (
          <div className="flex space-x-2">
            {prototype.tags.map((tag, index) => (
              <DaTag variant={'secondary'} key={index}>
                {tag.tag}
              </DaTag>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export { DaItemStandard }
