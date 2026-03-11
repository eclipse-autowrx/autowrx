// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { DaCardIntroBig } from '../molecules/DaCardIntroBigAlt'
import { Button } from '@/components/atoms/button'

type HomeFeatureListProps = {
  items?: {
    title?: string
    description?: string
    url?: string
    buttons?: { title: string; url: string; variant?: "default" | "link" | "destructive" | "outline" | "secondary" | "ghost"; left_icon?: string; right_icon?: string }[]
    children?: ReactNode
  }[]
}

/**
 samples items:
 [
 {
        "title": "Overview",
        "description": "Get an overview of the cloud-based prototyping environment for SDV functions.",
        "url": "",
        "buttons": [
          {
            "title": "Graphic",
            "url": "https://docs.digital.auto/basics/overview/"
          }
        ]
      },
      {
        "title": "Get Started",
        "description": "Learn about creating efficient SDV applications, using Python and Vehicle API",
          "url": "",
          "buttons": [
            {
              "title": "Documentation",
              "url": "https://docs.digital.auto/basics/play/"
            },
            {
              "title": "Video",
              "url": "https://www.youtube.com/@sdvpg"
            }
          ]
      }
 ]
 */

const HomeFeatureList = ({ items }: HomeFeatureListProps) => {
  const navigate = useNavigate()

  const handleButtonClick = (url: string) => {
    // Check if URL is external (starts with http:// or https://)
    const isExternal = url.startsWith('http://') || url.startsWith('https://')

    if (isExternal) {
      // External link - open in new tab
      window.open(url, '_blank')
    } else {
      // Internal link - navigate in current tab
      navigate(url)
    }
  }

  return (
    <div className="container flex w-full flex-col justify-center">
      <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-3">
        {items?.map((card, index) => (
          <div key={index} className="flex w-full items-center justify-center">
            <DaCardIntroBig
              key={index}
              title={card.title || ''}
              content={card.description || ''}
            >
              {card.buttons && card.buttons.length > 0 && (
                <div className="flex flex-wrap gap-4">
                  {card.buttons.map((button, btnIndex) => (
                    <Button
                      key={btnIndex}
                      variant={button.variant || "default"}
                      size="sm"
                      onClick={() => handleButtonClick(button.url)}
                    >
                      {button.left_icon && <div
                        className="inline-block size-4 bg-current"
                        style={{
                          maskImage: `url(${button.left_icon})`,
                          maskRepeat: 'no-repeat',
                          maskSize: 'contain',
                          WebkitMaskImage: `url(${button.left_icon})`, // Required for Safari support
                          WebkitMaskRepeat: 'no-repeat',
                          WebkitMaskSize: 'contain'
                        }}
                      />}
                      {button.title}
                      {button.right_icon && <div
                        className="inline-block size-4 bg-current"
                        style={{
                          maskImage: `url(${button.right_icon})`,
                          maskRepeat: 'no-repeat',
                          maskSize: 'contain',
                          WebkitMaskImage: `url(${button.right_icon})`, // Required for Safari support
                          WebkitMaskRepeat: 'no-repeat',
                          WebkitMaskSize: 'contain'
                        }}
                      />}
                    </Button>
                  ))}
                </div>
              )}
              {card.children}
            </DaCardIntroBig>
          </div>
        ))}
      </div>
    </div>
  )
}

export default HomeFeatureList
