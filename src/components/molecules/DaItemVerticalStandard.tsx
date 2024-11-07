import * as React from 'react'
import { DaImage } from '../atoms/DaImage'
import { DaText } from '../atoms/DaText'
import { cn } from '@/lib/utils'

interface DaItemVerticalStandardProps {
  title: string
  content: string
  imageUrl: string
  maxWidth?: string
  className?: string
}

const DaItemVerticalStandard: React.FC<DaItemVerticalStandardProps> = ({
  title,
  content,
  imageUrl,
  maxWidth = '500px',
  className,
}) => {
  return (
    <div
      className={cn(
        'p-2 lg:w-full lg:h-full hover:bg-gray-100 hover:border-da-gray-medium bg-da-white rounded-lg cursor-pointer',
        className,
      )}
    >
      <div
        className="flex flex-col items-center space-y-1 text-da-gray-medium overflow-hidden"
        style={{ maxWidth: maxWidth }}
      >
        <DaImage
          src={imageUrl ? imageUrl : '/imgs/default_prototype_cover.jpg'}
          alt="Image"
          className="w-full h-full rounded-lg aspect-video object-cover shadow border"
        />
        <div className="flex flex-col items-start w-full space-y-0">
          <DaText
            variant="regular-bold"
            className="line-clamp-1 !text-da-gray-dark"
          >
            {title}
          </DaText>
          <DaText
            variant="small"
            className="line-clamp-2 text-da-gray-medium/75"
          >
            {content}
          </DaText>
        </div>
      </div>
    </div>
  )
}

export { DaItemVerticalStandard }
