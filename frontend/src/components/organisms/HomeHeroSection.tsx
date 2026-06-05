// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useSiteConfig } from '@/utils/siteConfig'

type OverlayConfig = {
  /** Show or hide the gradient overlay. Default: true */
  enabled?: boolean
  /**
   * Gradient direction.
   * Options: "to-r" | "to-l" | "to-b" | "to-t" | "to-br" | "to-bl" | "to-tr" | "to-tl"
   * Default: "to-r"
   */
  direction?: string
  /** Starting color — CSS value or CSS variable e.g. "var(--primary)" or "#1a2b3c". Default: "var(--primary)" */
  fromColor?: string
  /** Opacity of starting color (0–100). Default: 70 */
  fromOpacity?: number
  /** Ending color — CSS value or CSS variable e.g. "var(--secondary)". Default: "var(--secondary)" */
  toColor?: string
  /** Opacity of ending color (0–100). Default: 90 */
  toOpacity?: number
}

type HomeHeroSectionProps = {
  title?: string
  description?: string
  /** Image URL or path */
  image?: string
  /** CSS min-height of the hero. Default: "400px" */
  minHeight?: string
  /** CSS max-height of the hero. Default: "400px" */
  maxHeight?: string
  /**
   * How the image fills its container.
   * Options: "cover" | "contain" | "fill" | "none"
   * Default: "cover"
   */
  imageObjectFit?: 'cover' | 'contain' | 'fill' | 'none'
  /**
   * Focal point of the image (which part stays visible when cropped).
   * Options: "center" | "top" | "bottom" | "left" | "right" | "top left" | "top right" | "bottom left" | "bottom right"
   * Default: "center"
   */
  imagePosition?: string
  /**
   * Width of the image box (CSS value).
   * Examples: "100%" (default, full width), "50%", "600px", "40vw"
   * Default: "100%"
   */
  imageWidth?: string
  /**
   * Height of the image box (CSS value).
   * Examples: "100%" (default, full hero height), "300px", "80%"
   * Default: "100%"
   */
  imageHeight?: string
  /**
   * Where the image box sits inside the hero (only matters if imageWidth/imageHeight < 100%).
   * Options: "left" | "center" | "right" | "top-left" | "top-right" | "bottom-left" | "bottom-right"
   * Default: "center"
   */
  imageAlign?:
    | 'left' | 'center' | 'right'
    | 'top-left' | 'top-right'
    | 'bottom-left' | 'bottom-right'
  /** Gradient overlay configuration */
  overlay?: OverlayConfig
  /**
   * Horizontal position of the text block.
   * Options: "left" | "right" | "center"
   * Default: "right"
   */
  textPosition?: 'left' | 'right' | 'center'
  /** CSS color for title and description text. Default: "white" */
  textColor?: string
  children?: React.ReactNode
}

const GRADIENT_DIRECTION_MAP: Record<string, string> = {
  'to-r':  'to right',
  'to-l':  'to left',
  'to-b':  'to bottom',
  'to-t':  'to top',
  'to-br': 'to bottom right',
  'to-bl': 'to bottom left',
  'to-tr': 'to top right',
  'to-tl': 'to top left',
}

function withOpacity(color: string, opacity: number): string {
  if (opacity >= 100) return color
  if (opacity <= 0) return 'transparent'
  return `color-mix(in srgb, ${color} ${opacity}%, transparent)`
}

const HomeHeroSection = ({
  title,
  description,
  image,
  minHeight = '400px',
  maxHeight = '400px',
  imageObjectFit = 'cover',
  imagePosition = 'center',
  imageWidth = '100%',
  imageHeight = '100%',
  imageAlign = 'center',
  overlay,
  textPosition = 'right',
  textColor = 'white',
  children,
}: HomeHeroSectionProps) => {
  // Admin-controlled hero image (Site Config -> HOME_HERO_IMAGE).
  // If the admin has set this config, it wins over the JSON `image` field.
  // Falls back to the JSON `image` if the config is empty.
  const adminImage = useSiteConfig('HOME_HERO_IMAGE', '')
  const effectiveImage = adminImage || image

  // Map imageAlign -> CSS positioning for the image wrapper (when not 100% wide/tall)
  const IMAGE_ALIGN_STYLE: Record<string, React.CSSProperties> = {
    'center':        { top: '50%', left: '50%',  transform: 'translate(-50%, -50%)' },
    'left':          { top: '50%', left: 0,      transform: 'translateY(-50%)' },
    'right':         { top: '50%', right: 0,     transform: 'translateY(-50%)' },
    'top-left':      { top: 0,      left: 0 },
    'top-right':     { top: 0,      right: 0 },
    'bottom-left':   { bottom: 0,   left: 0 },
    'bottom-right':  { bottom: 0,   right: 0 },
  }
  const imageWrapperPosition = IMAGE_ALIGN_STYLE[imageAlign] ?? IMAGE_ALIGN_STYLE['center']

  const overlayEnabled  = overlay?.enabled  ?? true
  const direction       = overlay?.direction ?? 'to-r'
  const fromColor       = overlay?.fromColor  ?? 'var(--primary)'
  const fromOpacity     = overlay?.fromOpacity ?? 70
  const toColor         = overlay?.toColor    ?? 'var(--secondary)'
  const toOpacity       = overlay?.toOpacity  ?? 90

  const cssDirection = GRADIENT_DIRECTION_MAP[direction] ?? 'to right'
  const gradientStyle = overlayEnabled
    ? {
        background: `linear-gradient(${cssDirection}, ${withOpacity(fromColor, fromOpacity)}, ${withOpacity(toColor, toOpacity)})`,
      }
    : {}

  const textJustify =
    textPosition === 'left'   ? 'justify-start' :
    textPosition === 'center' ? 'justify-center' :
                                'justify-end'

  return (
    <>
      <div
        className="flex col-span-12 relative w-full justify-between z-10 overflow-hidden"
        style={{ minHeight, maxHeight }}
      >
        {/* Gradient overlay */}
        {overlayEnabled && (
          <div
            className="absolute top-0 left-0 w-full h-full z-10"
            style={gradientStyle}
          />
        )}

        {effectiveImage && (
          <div
            className="absolute z-0 overflow-hidden"
            style={{ width: imageWidth, height: imageHeight, ...imageWrapperPosition }}
          >
            <img
              className="w-full h-full"
              style={{ objectFit: imageObjectFit, objectPosition: imagePosition }}
              src={effectiveImage}
              alt="home-cover"
            />
          </div>
        )}

        {(title || description) && (
          <div className={`px-4 absolute flex h-full items-center ${textJustify} w-full`}>
            <div className="lg:w-[50%] xl:px-24 lg:px-12 z-30">
              <div className="flex flex-col sm:text-xs">
                {title && (
                  <div
                    className="text-2xl lg:text-4xl font-semibold"
                    style={{ color: textColor }}
                    dangerouslySetInnerHTML={{ __html: title }}
                  />
                )}
                {description && (
                  <div
                    className="pt-2 text-sm lg:text-normal"
                    style={{ color: textColor }}
                    dangerouslySetInnerHTML={{ __html: description }}
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
