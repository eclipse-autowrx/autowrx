// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { cn } from '@/lib/utils'

type HomeHeroSectionProps = {
  title?: string
  description?: string
  image?: string
  children?: React.ReactNode
}

const HomeHeroSection = ({
  title,
  description,
  image,
  children,
}: HomeHeroSectionProps) => {
  return (
    <>
      <div className="flex col-span-12 relative min-h-[400px] max-h-[400px] w-full justify-between z-10 overflow-hidden">
        {image && (
          <img
            className="w-full object-cover absolute inset-0 z-0"
            src={image}
            alt="home-cover"
          ></img>
        )}

        {/* Gradient overlay from lighter to darker primary */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-primary/50 via-primary/70 to-primary/95 z-10"></div>

        {(title || description) && (
          <div className="absolute flex h-full items-center justify-end w-full">
            <div className="lg:w-[50%] xl:px-24 lg:px-12 z-30">
              <div className="flex flex-col sm:text-xs">
                {title && (
                  <div
                    className="text-2xl lg:text-4xl font-bold text-white"
                    dangerouslySetInnerHTML={{
                      __html: title,
                    }}
                  />
                )}
                {description && (
                  <div
                    className="text-white pt-2 text-sm lg:text-normal"
                    dangerouslySetInnerHTML={{
                      __html: description,
                    }}
                  />
                )}
              </div>
              {children}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default HomeHeroSection
