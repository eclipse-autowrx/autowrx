// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/atoms/dialog'

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
  Event: 'bg-secondary',
  News: 'bg-primary',
  Guide: 'bg-primary',
  Media: 'bg-orange-500',
}

const getTypeClass = (type: string | undefined) => {
  return typeClassMapping[type as keyof typeof typeClassMapping] || 'bg-muted'
}

// Extract file extension from URL (handles query params and fragments)
const getFileExtension = (url: string): string => {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname.toLowerCase()
    const match = pathname.match(/\.([a-z0-9]+)$/i)
    return match ? match[1] : ''
  } catch {
    // If URL parsing fails, try simple string matching
    const match = url.toLowerCase().match(/\.([a-z0-9]+)(?:[?#]|$)/i)
    return match ? match[1] : ''
  }
}

// Check if URL is a video file
const isVideoURL = (url: string | undefined): boolean => {
  if (!url) return false
  const ext = getFileExtension(url)
  return ['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(ext)
}

// Check if URL is an image file
const isImageURL = (url: string | undefined): boolean => {
  if (!url) return false
  const ext = getFileExtension(url)
  return ['gif', 'png', 'jpg', 'jpeg', 'webp', 'svg', 'bmp', 'ico'].includes(ext)
}

// Get MIME type for video based on extension
const getVideoMimeType = (url: string): string => {
  const ext = getFileExtension(url)
  const mimeTypes: Record<string, string> = {
    mp4: 'video/mp4',
    webm: 'video/webm',
    ogg: 'video/ogg',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
  }
  return mimeTypes[ext] || 'video/mp4'
}

const LargeCard = ({
  item,
  onItemClick,
}: {
  item: CardProps
  onItemClick: (url: string | undefined, title: string | undefined) => void
}) => {
  return (
    <div className="flex flex-col rounded-md mb-4">
      <div
        onClick={() => onItemClick(item.redirectURL, item.title)}
        className="cursor-pointer hover:opacity-90 transition-opacity"
      >
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
              'flex items-center text-white font-medium text-xs h-5 px-2 rounded-full',
              getTypeClass(item.type),
            )}
          >
            {item.type}
          </div>

          <div className="flex w-fit items-center">
            {item.date && (
              <>
                <div className="flex mx-2">|</div>
                <div className="text-muted-foreground text-sm">{item.date}</div>
              </>
            )}
          </div>
        </div>
        <div className="text-lg font-semibold mt-4 text-foreground">
          {item.title}
        </div>

        <div className="text-muted-foreground mt-2 text-sm line-clamp-2">
          {item.description}
        </div>
      </div>
    </div>
  )
}

const SmallCard = ({
  item,
  onItemClick,
}: {
  item: CardProps
  onItemClick: (url: string | undefined, title: string | undefined) => void
}) => {
  return (
    <div className="flex space-x-4">
      <div
        onClick={() => onItemClick(item.redirectURL, item.title)}
        className="cursor-pointer hover:opacity-90 transition-opacity"
      >
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
                  'flex items-center text-white font-medium text-xs h-5 px-2 rounded-full',
                  getTypeClass(item.type),
                )}
              >
                {item.type}
              </div>

              <div className="flex w-fit items-center">
                {item.date && (
                  <>
                    <div className="flex mx-2">|</div>
                    <div className="text-muted-foreground text-sm">
                      {item.date}
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="mt-4 text-lg font-semibold text-foreground">
              {item.title}
            </div>
            <div className="mt-2 text-sm text-muted-foreground line-clamp-3">
              {item.description}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const HomeNews = ({ title, items }: HomeNewsProps) => {
  const [modalOpen, setModalOpen] = useState(false)
  const [modalContent, setModalContent] = useState<{
    url: string
    title: string | undefined
    type: 'video' | 'image'
  } | null>(null)

  const handleItemClick = (url: string | undefined, itemTitle: string | undefined) => {
    if (!url) return

    if (isVideoURL(url)) {
      // Open video in modal
      setModalContent({ url, title: itemTitle, type: 'video' })
      setModalOpen(true)
    } else if (isImageURL(url)) {
      // Open image in modal
      setModalContent({ url, title: itemTitle, type: 'image' })
      setModalOpen(true)
    } else {
      // Open other URLs in new tab (existing behavior)
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <>
      <div className="flex flex-col w-full container">
        <h2 className="text-lg font-semibold text-primary">
          {title || 'Recent Prototypes'}
        </h2>
        {items && items.length > 0 && (
          <>
            {/* For small screens, display a grid of 2 columns with LargeCards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 xl:hidden">
              {items.slice(0, 4).map((item, index) => (
                <LargeCard key={index} item={item} onItemClick={handleItemClick} />
              ))}
            </div>
            {/* For xl screens and above, display the original layout */}
            <div className="hidden xl:flex space-x-8 mt-4">
              <div className="w-1/2">
                <LargeCard item={items[0]} onItemClick={handleItemClick} />
              </div>
              <div className="w-1/2 flex flex-col space-y-8">
                {items.slice(1).map((item, index) => (
                  <SmallCard key={index} item={item} onItemClick={handleItemClick} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal for videos and images */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent
          className={cn(
            'w-[90vw] h-[90vh] max-w-[90vw] max-h-[90vh] p-0 bg-white',
          )}
          showCloseButton={true}
        >
          {modalContent && (
            <div className="w-full h-full flex items-center justify-center p-2">
              {modalContent.type === 'video' ? (
                <video
                  controls
                  autoPlay
                  className="w-full h-full max-w-full max-h-full object-contain"
                >
                  <source src={modalContent.url} type={getVideoMimeType(modalContent.url)} />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <img
                  src={modalContent.url}
                  alt={modalContent.title || 'Image'}
                  className="w-full h-full max-w-full max-h-full object-contain"
                />
              )}
            </div>
          )}
          {modalContent?.title && (
            <DialogTitle className="sr-only">{modalContent.title}</DialogTitle>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

export default HomeNews
