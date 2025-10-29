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
        {/* Primary gradient overlay */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r z-0 from-primary/80 to-primary/60"></div>

        {/* Secondary gradient overlay */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r z-10 opacity-80 from-primary/80 to-primary/60"></div>

        {image && (
          <img
            className="w-full object-cover z-0 items-center justify-center"
            src={image}
            alt="home-cover"
          ></img>
        )}

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
