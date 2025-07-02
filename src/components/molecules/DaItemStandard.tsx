// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { DaImageRatio } from '../atoms/DaImageRatio'
import { DaTag } from '../atoms/DaTag'
import { DaText } from '../atoms/DaText'
import { Prototype } from '@/types/model.type'
import { cn } from '@/lib/utils'
import DaUserProfile from './DaUserProfile'

interface DaItemStandardProps {
  prototype: Prototype
  maxWidth?: string
  imageMaxWidth?: string
  isSelected?: boolean
}

const DaItemStandard: React.FC<DaItemStandardProps> = ({
  prototype,
  imageMaxWidth = '300px',
  isSelected = false,
}) => {
  return (
    <div
      className={`flex w-full space-x-4 overflow-hidden rounded-lg border border-da-gray-light bg-da-white p-4 text-da-gray-medium hover:border-da-primary-500 ${
        isSelected ? 'border-da-primary-500 !bg-da-primary-100' : ''
      }`}
    >
      <DaImageRatio
        src={
          prototype.image_file
            ? prototype.image_file
            : '/imgs/default_prototype_cover.jpg'
        }
        alt="Image"
        className="flex h-full w-full rounded-lg"
        ratio={1 / 1}
        maxWidth={imageMaxWidth}
      />

      <div className="flex w-full flex-col justify-between overflow-hidden">
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
          <DaUserProfile
            userName={prototype.created_by?.name}
            userAvatar={prototype.created_by?.image_file}
            avatarClassName="w-4 h-4 mr-2"
            textClassName="!text-sm"
          />
          <DaText
            variant="small"
            className="line-clamp-2 w-full text-da-gray-medium"
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
