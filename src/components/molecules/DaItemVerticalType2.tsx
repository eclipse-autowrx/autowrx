import * as React from 'react'
import { DaText } from '../atoms/DaText'
import { DaTag } from '../atoms/DaTag'
import { DaImage } from '../atoms/DaImage'

interface DaItemVerticalType2Props {
  title: string
  imageUrl: string
  tags: string[]
  maxWidth?: string
  onClick?: () => void
}

const DaItemVerticalType2: React.FC<DaItemVerticalType2Props> = ({
  title,
  imageUrl,
  tags,
  maxWidth = '500px',
  onClick,
}) => {
  return (
    <div
      className="py-2 flex flex-col w-full h-full rounded-lg border bg-da-white space-y-1 text-da-gray-medium overflow-hidden hover:border-da-primary-500"
      style={{ maxWidth: maxWidth }}
      onClick={onClick}
    >
      <DaText
        variant="sub-title"
        className="px-2 py-1 line-clamp-1 !text-da-gray-dark"
      >
        {title}
      </DaText>
      <DaImage
        src={imageUrl ? imageUrl : '/imgs/default_prototype_cover.jpg'}
        alt="Image"
        className="w-full h-full rounded-lg aspect-video object-contain"
      />
      <div className="flex space-x-2 pt-2 px-2">
        {tags.map((tag, index) => (
          <DaTag variant={'secondary'} key={index}>
            {tag}
          </DaTag>
        ))}
      </div>
    </div>
  )
}

export { DaItemVerticalType2 }
