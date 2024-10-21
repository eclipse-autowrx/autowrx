import * as React from 'react'
import { DaImage } from '../atoms/DaImage'
import { DaText } from '../atoms/DaText'

interface DaItemVerticalStandardProps {
  title: string
  content: string
  imageUrl: string
  maxWidth?: string
}

const DaItemVerticalStandard: React.FC<DaItemVerticalStandardProps> = ({
  title,
  content,
  imageUrl,
  maxWidth = '500px',
}) => {
  return (
    <div className="p-2 hover:bg-gray-100 hover:border-da-gray-medium bg-da-white rounded-lg cursor-pointer">
      <div
        className="flex w-full flex-col items-center space-y-1 text-da-gray-medium overflow-hidden"
        style={{ maxWidth: maxWidth }}
      >
        <DaImage
          src={imageUrl ? imageUrl : '/imgs/default_prototype_cover.jpg'}
          alt="Image"
          className="w-full h-auto rounded-lg aspect-video object-cover shadow border"
        />
        <div className="flex flex-col items-start w-full space-y-0">
          <DaText variant="regular-bold" className="line-clamp-1">
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
