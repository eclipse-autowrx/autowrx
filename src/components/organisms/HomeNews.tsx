// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { cn } from '@/lib/utils'
import DaText from '../atoms/DaText'

type HomeNewsProps = {
  title?: string
  items?: {
    title?: string
    type?: string
    date?: string
    description?: string
    imageURL?: string
    redirectURL?: string
  }[]
}

interface CardProps {
  title?: string
  type?: string
  date?: string
  description?: string
  imageURL?: string
  redirectURL?: string
}

const typeClassMapping = {
  Event: 'bg-da-secondary-500',
  News: 'bg-da-primary-500',
  Media: 'bg-orange-500',
}

const getTypeClass = (type: string | undefined) => {
  return (
    typeClassMapping[type as keyof typeof typeClassMapping] || 'bg-gray-500'
  )
}

const LargeCard = ({ item }: { item: CardProps }) => {
  return (
    <div className="flex flex-col rounded-md mb-4">
      <a href={item.redirectURL} target="_blank" rel="noopener noreferrer">
        <div className="flex w-full h-fit border shadow rounded-lg overflow-hidden">
          <img
            src={item.imageURL}
            alt={item.title}
            className="w-full h-[300px] xl:h-[350px] object-cover"
          />
        </div>
        <div className="flex mt-4 items-center">
          <div
            className={cn(
              'text-white font-medium !text-sm px-3 py-0.5 rounded-full',
              getTypeClass(item.type),
            )}
          >
            {item.type}
          </div>

          <div className="flex w-fit items-center">
            {item.date && (
              <>
                <div className="flex mx-2">|</div>
                <div className="text-gray-600 text-sm">{item.date}</div>
              </>
            )}
          </div>
        </div>
        <div className="text-lg font-bold mt-4 text-da-gray-dark">
          {item.title}
        </div>

        <div className="text-gray-600 mt-2 text-sm line-clamp-2">
          {item.description}
        </div>
      </a>
    </div>
  )
}

const SmallCard = ({ item }: { item: CardProps }) => {
  return (
    <div className="flex space-x-4">
      <a href={item.redirectURL} target="_blank" rel="noopener noreferrer">
        <div className="flex space-x-4">
          <div className="flex min-w-[250px] h-fit border shadow rounded-lg overflow-hidden">
            <img
              src={item.imageURL}
              alt={item.title}
              className="w-full h-[140px] object-cover"
            />
          </div>
          <div>
            <div className="flex items-center">
              <div
                className={cn(
                  'text-white font-medium !text-sm px-3 py-0.5 rounded-full',
                  getTypeClass(item.type),
                )}
              >
                {item.type}
              </div>

              <div className="flex w-fit items-center">
                {item.date && (
                  <>
                    <div className="flex mx-2">|</div>
                    <div className="text-da-gray-medium text-sm">{item.date}</div>
                  </>
                )}
              </div>
            </div>
            <div className="mt-4 text-lg font-semibold text-da-gray-dark">
              {item.title}
            </div>
            <div className="mt-2 da-txt-tiny text-da-gray-medium line-clamp-3">
              {item.description}
            </div>
          </div>
        </div>
      </a>
    </div>
  )
}

const HomeNews = ({ title, items }: HomeNewsProps) => {
  return (
    <div className="flex flex-col w-full container">
      <DaText variant="sub-title" className="text-da-primary-500">
        {title || 'Recent Prototypes'}
      </DaText>
      {items && items.length > 0 && (
        <>
          {/* For small screens, display a grid of 2 columns with LargeCards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 xl:hidden">
            {items.slice(0, 4).map((item, index) => (
              <LargeCard key={index} item={item} />
            ))}
          </div>
          {/* For xl screens and above, display the original layout */}
          <div className="hidden xl:flex space-x-8 mt-4">
            <div className="w-1/2">
              <LargeCard item={items[0]} />
            </div>
            <div className="w-1/2 flex flex-col space-y-8">
              {items.slice(1).map((item, index) => (
                <SmallCard key={index} item={item} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default HomeNews
