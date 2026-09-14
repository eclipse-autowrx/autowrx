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
  /** CSS max-width of the image column in grouped layout. Example: "684px" */
  imageMaxWidth?: string
  /** CSS max-width of the centered content row. Example: "1368px" */
  contentMaxWidth?: string
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
  /** CSS max-width of the text block. Example: "684px" */
  textMaxWidth?: string
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

const IMAGE_ALIGN_STYLE: Record<string, React.CSSProperties> = {
  'center':        { top: '50%', left: '50%',  transform: 'translate(-50%, -50%)' },
  'left':          { top: '50%', left: 0,      transform: 'translateY(-50%)' },
  'right':         { top: '50%', right: 0,     transform: 'translateY(-50%)' },
  'top-left':      { top: 0,      left: 0 },
  'top-right':     { top: 0,      right: 0 },
  'bottom-left':   { bottom: 0,   left: 0 },
  'bottom-right':  { bottom: 0,   right: 0 },
}

function getImageWrapperStyle(
  imageWidth: string,
  imageHeight: string,
  imageAlign: string,
): React.CSSProperties {
  const isFullBleed = imageWidth === '100%' && imageHeight === '100%'
  if (isFullBleed) {
    return { inset: 0 }
  }

  const style: React.CSSProperties = { width: imageWidth }

  if (imageHeight === '100%') {
    style.top = 0
    style.bottom = 0
    style.height = '100%'

    if (imageAlign === 'left' || imageAlign === 'top-left' || imageAlign === 'bottom-left') {
      style.left = 0
    } else if (imageAlign === 'right' || imageAlign === 'top-right' || imageAlign === 'bottom-right') {
      style.right = 0
    } else {
      style.left = '50%'
      style.transform = 'translateX(-50%)'
    }
  } else {
    style.height = imageHeight
    Object.assign(style, IMAGE_ALIGN_STYLE[imageAlign] ?? IMAGE_ALIGN_STYLE['center'])
  }

  return style
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
  imageMaxWidth,
  contentMaxWidth,
  overlay,
  textPosition = 'right',
  textColor = 'white',
  textMaxWidth,
  children,
}: HomeHeroSectionProps) => {
  // Admin-controlled hero image (Site Config -> HOME_HERO_IMAGE).
  // If the admin has set this config, it wins over the JSON `image` field.
  // Falls back to the JSON `image` if the config is empty.
  const adminImage = useSiteConfig('HOME_HERO_IMAGE', '')
  const effectiveImage = adminImage || image

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

  const isFullBleed = imageWidth === '100%' && imageHeight === '100%'
  const useGroupedLayout = !isFullBleed && !!effectiveImage
  const overlayIsTint = fromOpacity < 100 || toOpacity < 100
  const imageZIndex = isFullBleed && overlayIsTint ? 0 : 20
  const imageWrapperStyle = getImageWrapperStyle(imageWidth, imageHeight, imageAlign)

  const textContent = (title || description) ? (
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
          className="pt-2 text-base lg:text-normal"
          style={{ color: textColor }}
          dangerouslySetInnerHTML={{ __html: description }}
        />
      )}
    </div>
  ) : null

  const groupedTextColumn = (title || description) ? (
    <div
      className={`min-w-0 z-30 ${textMaxWidth ? 'w-full' : 'flex-1'} ${textPosition === 'center' ? 'mx-auto text-center' : ''}`}
      style={textMaxWidth ? { maxWidth: textMaxWidth } : undefined}
    >
      {textContent}
      {children}
    </div>
  ) : null

  const fullBleedTextColumn = (title || description) ? (
    <div className={`px-4 absolute flex h-full items-center ${textJustify} w-full`}>
      <div
        className={`xl:px-24 lg:px-12 z-30 ${textMaxWidth ? 'w-full' : 'lg:w-[50%]'}`}
        style={textMaxWidth ? { maxWidth: textMaxWidth } : undefined}
      >
        {textContent}
        {children}
      </div>
    </div>
  ) : null

  return (
    <>
      <div
        className="flex col-span-12 relative w-full justify-between z-10 overflow-hidden"
        style={{ minHeight, maxHeight, height: maxHeight }}
      >
        {/* Gradient overlay */}
        {overlayEnabled && (
          <div
            className="absolute top-0 left-0 w-full h-full z-10"
            style={gradientStyle}
          />
        )}

        {useGroupedLayout ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center px-4">
            <div
              className="flex items-center h-full w-full"
              style={contentMaxWidth ? { maxWidth: contentMaxWidth } : undefined}
            >
              {textPosition === 'left' && groupedTextColumn}
              <div
                className="overflow-hidden flex-shrink-0 self-stretch"
                style={{
                  width: imageWidth,
                  maxWidth: imageMaxWidth,
                  height: imageHeight === '100%' ? '100%' : imageHeight,
                }}
              >
                <img
                  className="w-full h-full"
                  style={{ objectFit: imageObjectFit, objectPosition: imagePosition }}
                  src={effectiveImage}
                  alt="home-cover"
                />
              </div>
              {textPosition !== 'left' && groupedTextColumn}
            </div>
          </div>
        ) : (
          <>
            {effectiveImage && (
              <div
                className="absolute overflow-hidden"
                style={{ ...imageWrapperStyle, zIndex: imageZIndex }}
              >
                <img
                  className="w-full h-full"
                  style={{ objectFit: imageObjectFit, objectPosition: imagePosition }}
                  src={effectiveImage}
                  alt="home-cover"
                />
              </div>
            )}

            {fullBleedTextColumn}
          </>
        )}
      </div>
    </>
  )
}

export default HomeHeroSection
