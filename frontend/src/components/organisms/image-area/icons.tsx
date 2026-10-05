// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useEffect, useState } from 'react'
import { ICON_PATHS, type IconPath } from './icon-paths'

// The lib stores the kebab-case svg name (re.* values) on shapes it merges.
export const ICON_JSON_NAME: Record<string, string> = {
  RECTANGLE: 'rectangle',
  ELLIPSE: 'ellipse',
  TEXT: 'text',
  LOCATION: 'location',
  DISLIKE: 'dislike',
  LIKE: 'like',
  ONE: 'one',
  TWO: 'two',
  THREE: 'three',
  FOUR: 'four',
  FIVE: 'five',
  SAND_CLOCK: 'sand-clock',
  CLOSE: 'close',
}

interface IconAttrsProps {
  path: IconPath
  fill?: string
}

const IconPathNode = ({ path, fill }: IconAttrsProps) => {
  const attrs: Record<string, unknown> = { d: path.d }
  const resolvedFill = path.fill === null ? fill : path.fill
  if (resolvedFill !== undefined) attrs.fill = resolvedFill
  if (path.stroke !== undefined) {
    const resolvedStroke = path.stroke === null ? fill : path.stroke
    if (resolvedStroke !== undefined) attrs.stroke = resolvedStroke
  }
  if (path.strokeWidth !== undefined) attrs.strokeWidth = path.strokeWidth
  if (path.strokeLinecap !== undefined) attrs.strokeLinecap = path.strokeLinecap
  if (path.strokeLinejoin !== undefined) {
    attrs.strokeLinejoin = path.strokeLinejoin
  }
  if (path.fillRule !== undefined) attrs.fillRule = path.fillRule
  if (path.transform !== undefined) attrs.transform = path.transform
  return <path {...attrs} />
}

interface ShapeIconSvgProps {
  name: string
  fill?: string
  className?: string
  style?: React.CSSProperties
}

// Same 20x20 svg the lib renders (BCIconSvg), rasterized to data URLs for
// canvas icons so saved diagrams look identical.
export const ShapeIconSvg = ({
  name,
  fill,
  className,
  style,
}: ShapeIconSvgProps) => (
  <svg
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    width={20}
    height={20}
    viewBox="0 0 20 20"
    className={className}
    style={style}
  >
    {(ICON_PATHS[name] ?? []).map((path, i) => (
      <IconPathNode key={i} path={path} fill={fill} />
    ))}
  </svg>
)

export const encodeSvg = (name: string, fill?: string) => {
  const paths = (ICON_PATHS[name] ?? [])
    .map((path) => {
      const attrs: string[] = []
      const resolvedFill = path.fill === null ? fill : path.fill
      if (resolvedFill !== undefined) attrs.push(`fill="${resolvedFill}"`)
      if (path.stroke !== undefined) {
        const resolvedStroke = path.stroke === null ? fill : path.stroke
        if (resolvedStroke !== undefined) attrs.push(`stroke="${resolvedStroke}"`)
      }
      if (path.strokeWidth !== undefined) {
        attrs.push(`stroke-width="${path.strokeWidth}"`)
      }
      if (path.strokeLinecap !== undefined) {
        attrs.push(`stroke-linecap="${path.strokeLinecap}"`)
      }
      if (path.strokeLinejoin !== undefined) {
        attrs.push(`stroke-linejoin="${path.strokeLinejoin}"`)
      }
      if (path.fillRule !== undefined) attrs.push(`fill-rule="${path.fillRule}"`)
      if (path.transform !== undefined) attrs.push(`transform="${path.transform}"`)
      if (path.d !== undefined) attrs.push(`d="${path.d}"`)
      return `<path ${attrs.join(' ')}/>`
    })
    .join('')
  const svg = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">${paths}</svg>`
  return 'data:image/svg+xml,' + encodeURIComponent(svg)
}

// Minimal replacement for react-konva-utils useImage.
export const useShapeImage = (name: string, fill?: string) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const url = encodeSvg(name, fill)
  useEffect(() => {
    setImage(null)
    const img = new window.Image()
    img.onload = () => setImage(img)
    img.src = url
    return () => {
      img.onload = null
    }
  }, [url])
  return image
}
