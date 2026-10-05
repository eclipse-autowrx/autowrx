// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

// Shape JSON schema of @mekong89/image-area-lib, kept verbatim for backward
// compatibility: type strings (including the lib's "Dislink" typo), ellipse
// startX/startY/radiusX/radiusY alongside width/height, and the extra fields
// the lib merged back into saved shapes (viewOnly/isFocus/scaleX/scaleY and
// unknown fields, which must survive a load/save round-trip).

export const SHAPE = {
  RECTANGLE: 'Rectangle',
  ELLIPSE: 'Ellipse',
  PIN: 'Pin',
  LIKE: 'Like',
  DISLIKE: 'Dislink',
  SAND_CLOCK: 'Sand Clock',
  ONE: 'one',
  TWO: 'two',
  THREE: 'three',
  FOUR: 'four',
  FIVE: 'five',
  CLOSE: 'close',
  TEXT: 'text',
} as const

export type ShapeType = (typeof SHAPE)[keyof typeof SHAPE]

export interface ImageAreaShape {
  id?: string
  type: ShapeType
  x?: number
  y?: number
  width?: number
  height?: number
  // Ellipse geometry (stored in addition to width/height, as the lib does)
  startX?: number
  startY?: number
  radiusX?: number
  radiusY?: number
  name?: string
  fill?: string
  text?: string
  fontSize?: number
  edit?: boolean
  hoverMessage?: string
  url?: string
  // Selection-time snapshot the lib merges into saved shapes
  isFocus?: boolean
  viewOnly?: boolean
  scaleX?: number
  scaleY?: number
  [key: string]: unknown
}

export interface ImageAreaSaveData {
  shapes?: ImageAreaShape[]
  bgImage?: string
  bgColor?: string
}

export interface ImageAreaEditorProps {
  shapes?: ImageAreaShape[]
  bgImage?: string
  bgColor?: string
  onSave?: (data: ImageAreaSaveData) => void
  handleUploadImage?: (file: File) => void
}

export interface ImageAreaPreviewProps {
  shapes?: ImageAreaShape[]
  bgImage?: string
  bgColor?: string
  navigate?: (url: string) => void
}

export const FONT_SIZE = {
  SMALL: { label: 'Small', value: 14 },
  MEDIUM: { label: 'Medium', value: 18 },
  LARGE: { label: 'Large', value: 24 },
  EXTRA_LARGE: { label: 'Extra Large', value: 30 },
} as const

// Logical stage the lib draws in: the container is 16:9 and shapes are stored
// in 900x600 coordinates, scaled anisotropically (width/900, height/600).
export const ASPECT_RATIO = 16 / 9
export const LOGICAL_WIDTH = 900
export const LOGICAL_HEIGHT = 600

export const PALETTE_SHAPES: ShapeType[] = [
  SHAPE.RECTANGLE,
  SHAPE.ELLIPSE,
  SHAPE.TEXT,
]

export const PALETTE_ICONS: ShapeType[] = [
  SHAPE.PIN,
  SHAPE.CLOSE,
  SHAPE.LIKE,
  SHAPE.DISLIKE,
  SHAPE.SAND_CLOCK,
  SHAPE.ONE,
  SHAPE.TWO,
  SHAPE.THREE,
  SHAPE.FOUR,
  SHAPE.FIVE,
]

// Canonical svg + fill the lib renders for each icon shape type. `iconKey`
// indexes ICON_PATHS; `jsonName` is the kebab-case name the lib merges into
// the shape object on selection (so saved JSON stays identical).
export const ICON_SHAPE_RENDER: Partial<
  Record<ShapeType, { iconKey: string; jsonName: string; fill: string }>
> = {
  [SHAPE.PIN]: { iconKey: 'LOCATION', jsonName: 'location', fill: '#BE3144' },
  [SHAPE.CLOSE]: { iconKey: 'CLOSE', jsonName: 'close', fill: '#BE3144' },
  [SHAPE.LIKE]: { iconKey: 'LIKE', jsonName: 'like', fill: '#1976d2' },
  [SHAPE.DISLIKE]: { iconKey: 'DISLIKE', jsonName: 'dislike', fill: '#BE3144' },
  [SHAPE.SAND_CLOCK]: {
    iconKey: 'SAND_CLOCK',
    jsonName: 'sand-clock',
    fill: '#FFC436',
  },
  [SHAPE.ONE]: { iconKey: 'ONE', jsonName: 'one', fill: '#BE3144' },
  [SHAPE.TWO]: { iconKey: 'TWO', jsonName: 'two', fill: '#FFA33C' },
  [SHAPE.THREE]: { iconKey: 'THREE', jsonName: 'three', fill: '#FFFB73' },
  [SHAPE.FOUR]: { iconKey: 'FOUR', jsonName: 'four', fill: '#45FFCA' },
  [SHAPE.FIVE]: { iconKey: 'FIVE', jsonName: 'five', fill: '#3D30A2' },
}
