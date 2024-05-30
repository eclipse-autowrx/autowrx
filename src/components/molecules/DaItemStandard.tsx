import * as React from 'react'
import { DaImageRatio } from '../atoms/DaImageRatio'
import { DaTag } from '../atoms/DaTag'
import { DaText } from '../atoms/DaText'
import { DaAvatar } from '../atoms/DaAvatar'

interface DaItemStandardProps {
  title: string
  author: string
  content: string
  tags: string[]
  imageUrl: string
  avatarUrl: string
  maxWidth?: string
  imageMaxWidth?: string
  isSelected?: boolean
}

const DaItemStandard: React.FC<DaItemStandardProps> = ({
  title,
  author,
  content,
  tags,
  imageUrl,
  avatarUrl,
  maxWidth = '500px',
  imageMaxWidth = '300px',
  isSelected = false,
}) => {
  return (
    <div
      className={`flex w-full p-4 border border-da-gray-light rounded-lg bg-da-white max-w-lg space-x-4 text-da-gray-medium hover:border-da-primary-500 overflow-hidden ${
        isSelected ? 'border-da-primary-500 bg-da-primary-500/10' : ''
      }`}
      style={{ maxWidth: maxWidth }}
    >
      <DaImageRatio
        src={imageUrl}
        alt="Image"
        className="w-full h-full rounded-lg"
        ratio={1 / 1}
        maxWidth={imageMaxWidth}
      />

      <div className="flex flex-col justify-between overflow-hidden w-ful">
        <div className="flex flex-col space-y-2">
          <DaText className="text-da-gray-dark">{title}</DaText>
          <div className="flex items-center space-x-2">
            <DaAvatar
              src={avatarUrl}
              alt="Author"
              className="w-5 h-5 rounded-full"
            />
            <DaText variant="small" className="text-da-gray-">
              {author}
            </DaText>
          </div>
          <DaText
            variant="small"
            className="w-full line-clamp-2 text-da-gray-medium"
          >
            {content}
          </DaText>
        </div>
        <div className="flex space-x-2">
          {tags.map((tag, index) => (
            <DaTag variant={'secondary'} key={index}>
              {tag}
            </DaTag>
          ))}
        </div>
      </div>
    </div>
  )
}

export { DaItemStandard }
